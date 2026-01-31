import { useState, useEffect } from "react";
import { getOrders } from "../../utils/dbServices";
import { BsArrowUpRight, BsSearch, BsFileEarmarkPdf, BsFileEarmarkSpreadsheet, BsPrinter } from "react-icons/bs";
import { useSettings } from "../../context/SettingsContext"; // [NEW]
import { exportToCSV, exportReportPDF } from "../../utils/exportUtils";

const SalesReport = () => {
    const { settings } = useSettings(); // [NEW]
    const brandName = settings?.branding?.brandName || "DhakaEcommerce";

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeReport, setActiveReport] = useState("sales");

    useEffect(() => {
        const fetchOrders = async () => {
            const data = await getOrders();
            setOrders(data || []);
            setLoading(false);
        };
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt).toISOString().slice(0, 10);
        const matchesDate = (!dateRange.start || orderDate >= dateRange.start) &&
            (!dateRange.end || orderDate <= dateRange.end);
        const matchesSearch = order.orderNumber?.includes(searchTerm) ||
            order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter;
        return matchesDate && matchesSearch && matchesStatus;
    });

    const metrics = {
        totalRevenue: filteredOrders.reduce((acc, curr) => acc + Number(curr.finalAmount), 0),
        totalOrders: filteredOrders.length,
        codCount: filteredOrders.filter(o => o.paymentMethod === 'COD').length,
        onlineCount: filteredOrders.filter(o => o.paymentMethod === 'ONLINE').length
    };
    metrics.avgOrderValue = metrics.totalOrders > 0 ? metrics.totalRevenue / metrics.totalOrders : 0;

    const getReportData = (type) => {
        switch (type) {
            case 'monthly':
                const months = {};
                filteredOrders.forEach(o => {
                    const m = new Date(o.createdAt).toISOString().slice(0, 7);
                    if (!months[m]) months[m] = { revenue: 0, count: 0, cod: 0, online: 0 };
                    months[m].revenue += Number(o.finalAmount);
                    months[m].count += 1;
                    if (o.paymentMethod === 'COD') months[m].cod += 1;
                    else months[m].online += 1;
                });
                return Object.keys(months).sort().reverse().map(m => ({
                    label: m,
                    orders: months[m].count,
                    revenue: months[m].revenue,
                    avg: Math.round(months[m].revenue / months[m].count),
                    cod: months[m].cod,
                    online: months[m].online
                }));
            case 'payment':
                const payments = {};
                filteredOrders.forEach(o => {
                    const p = o.paymentMethod || "N/A";
                    if (!payments[p]) payments[p] = { revenue: 0, count: 0 };
                    payments[p].revenue += Number(o.finalAmount);
                    payments[p].count += 1;
                });
                return Object.keys(payments).map(p => ({
                    label: p,
                    orders: payments[p].count,
                    revenue: payments[p].revenue
                }));
            case 'status':
                const statuses = {};
                filteredOrders.forEach(o => {
                    const s = o.orderStatus || "N/A";
                    if (!statuses[s]) statuses[s] = { count: 0, revenue: 0 };
                    statuses[s].count += 1;
                    statuses[s].revenue += Number(o.finalAmount);
                });
                return Object.keys(statuses).map(s => ({
                    label: s.toUpperCase(),
                    orders: statuses[s].count,
                    revenue: statuses[s].revenue
                }));
            case 'wallet':
                return filteredOrders.filter(o => Number(o.walletUsed) > 0).map(o => ({
                    label: o.orderNumber,
                    date: new Date(o.createdAt).toLocaleDateString(),
                    customer: o.shippingDetails?.name || o.userEmail || "N/A",
                    wallet: Number(o.walletUsed),
                    total: Number(o.finalAmount)
                }));
            default:
                return filteredOrders.map(o => ({
                    orderNumber: o.orderNumber,
                    date: new Date(o.createdAt).toISOString().split('T')[0],
                    customer: o.shippingDetails?.name || o.userEmail || "N/A",
                    payment: o.paymentMethod || "N/A",
                    status: o.orderStatus || "N/A",
                    subtotal: Number(o.subtotal || 0),
                    discount: Number(o.discounts?.product || 0) + Number(o.discounts?.coupon || 0) + Number(o.discounts?.flashSale || 0),
                    delivery: Number(o.deliveryCharge || 0),
                    wallet: Number(o.walletUsed || 0),
                    total: Number(o.finalAmount || 0)
                }));
        }
    };

    const handleCSVExport = () => {
        const type = activeReport;
        const data = getReportData(type);
        let headers = [];
        let rows = [];

        if (type === 'sales') {
            headers = ["OrderNumber", "OrderDate", "Customer", "PaymentMethod", "Status", "Subtotal", "Discount", "Delivery", "WalletUsed", "FinalAmount"];
            rows = data.map(o => [o.orderNumber, o.date, o.customer, o.payment, o.status, o.subtotal, o.discount, o.delivery, o.wallet, o.total]);
        } else if (type === 'monthly') {
            headers = ["Month", "Orders", "Revenue", "AvgValue", "COD", "Online"];
            rows = data.map(o => [o.label, o.orders, o.revenue, o.avg, o.cod, o.online]);
        } else if (type === 'payment' || type === 'status') {
            headers = ["Category", "Orders", "Revenue"];
            rows = data.map(o => [o.label, o.orders, o.revenue]);
        } else if (type === 'wallet') {
            headers = ["OrderNumber", "Date", "Customer", "WalletUsed", "FinalAmount"];
            rows = data.map(o => [o.label, o.date, o.customer, o.wallet, o.total]);
        }

        exportToCSV(headers, rows, `${brandName}_${type}_Report`);
    };

    const handlePDFExport = () => {
        const type = activeReport;
        const data = getReportData(type);
        let headers = [];
        let body = [];
        let reportMetrics = {
            "Total Orders": metrics.totalOrders,
            "Total Revenue": metrics.totalRevenue.toLocaleString()
        };

        if (type === 'sales') {
            headers = [['Order #', 'Date', 'Customer', 'Status', 'Total']];
            body = data.map(o => [o.orderNumber, o.date, o.customer, o.status.toUpperCase(), o.total.toLocaleString()]);
        } else if (type === 'monthly') {
            headers = [['Month', 'Orders', 'Revenue', 'Avg Value', 'COD/Online']];
            body = data.map(o => [o.label, o.orders, o.revenue.toLocaleString(), o.avg.toLocaleString(), `${o.cod}/${o.online}`]);
        } else if (type === 'payment' || type === 'status') {
            headers = [['Category', 'Orders', 'Revenue']];
            body = data.map(o => [o.label, o.orders, o.revenue.toLocaleString()]);
        } else if (type === 'wallet') {
            headers = [['Order #', 'Date', 'Customer', 'Wallet Used', 'Final Total']];
            body = data.map(o => [o.label, o.date, o.customer, o.wallet.toLocaleString(), o.total.toLocaleString()]);
        }

        exportReportPDF(`${type} Report`, headers, body, reportMetrics, `${type}_Report`, brandName);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" /></div>;

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 printable-area">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">{brandName} Reporting</h1>
                    <p className="text-gray-500 font-medium">Online Shopping Platform - Financial Audit</p>
                </div>
                <div className="flex flex-wrap gap-3 no-print">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-3 px-6 py-4 bg-gray-100 text-gray-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-sm"
                    >
                        <BsPrinter size={16} /> Print Report
                    </button>
                    <button
                        onClick={handleCSVExport}
                        className="flex items-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-gray-200"
                    >
                        <BsFileEarmarkSpreadsheet size={16} /> Export CSV
                    </button>
                    <button
                        onClick={handlePDFExport}
                        className="flex items-center gap-3 px-6 py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-green-100"
                    >
                        <BsFileEarmarkPdf size={16} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Report Type Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit no-print">
                {[
                    { id: 'sales', label: 'Detailed Sales' },
                    { id: 'monthly', label: 'Monthly Summary' },
                    { id: 'payment', label: 'Payment Methods' },
                    { id: 'status', label: 'Order Status' },
                    { id: 'wallet', label: 'Wallet Usage' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveReport(tab.id)}
                        className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeReport === tab.id ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Total Revenue</div>
                    <div className="text-3xl font-black text-gray-900 tracking-tighter">৳{metrics.totalRevenue.toLocaleString()}</div>
                    <div className="mt-4 flex items-center gap-2 text-green-500 text-xs font-black uppercase">
                        <BsArrowUpRight /> Live Update
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Total Orders</div>
                    <div className="text-3xl font-black text-gray-900 tracking-tighter">{metrics.totalOrders}</div>
                    <div className="mt-4 flex items-center gap-2 text-secondary text-xs font-black uppercase tracking-widest">
                        Volume Filtered
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Avg Order Value</div>
                    <div className="text-3xl font-black text-gray-900 tracking-tighter">৳{Math.round(metrics.avgOrderValue).toLocaleString()}</div>
                    <div className="mt-4 flex items-center gap-2 text-yellow-600 text-xs font-black uppercase">
                        AOV Metrics
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-dark/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">COD vs Online</div>
                    <div className="text-3xl font-black text-gray-900 tracking-tighter">{metrics.codCount} | {metrics.onlineCount}</div>
                    <div className="mt-4 flex items-center gap-2 text-dark/50 text-xs font-black uppercase tracking-widest text-[9px]">
                        Payment Split
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px] relative">
                    <BsSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Order # or Email..."
                        className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-4 font-bold text-sm focus:ring-primary/20"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-50 rounded-2xl p-1 shadow-inner">
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs font-black p-3"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="self-center text-gray-400">-</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs font-black p-3"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    <select
                        className="bg-gray-50 border-none rounded-2xl px-6 py-4 font-black uppercase text-[10px] tracking-widest focus:ring-primary/20"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {activeReport === 'sales' && (
                                    <>
                                        <th className="px-8 py-6">Order Number</th>
                                        <th className="px-8 py-6">Date</th>
                                        <th className="px-8 py-6">Customer</th>
                                        <th className="px-8 py-6">Status</th>
                                        <th className="px-8 py-6">Payment</th>
                                        <th className="px-8 py-6 text-right">Amount</th>
                                    </>
                                )}
                                {activeReport === 'monthly' && (
                                    <>
                                        <th className="px-8 py-6">Month</th>
                                        <th className="px-8 py-6">Orders</th>
                                        <th className="px-8 py-6">Revenue</th>
                                        <th className="px-8 py-6 text-right">Avg Order Value</th>
                                    </>
                                )}
                                {(activeReport === 'payment' || activeReport === 'status') && (
                                    <>
                                        <th className="px-8 py-6">Category</th>
                                        <th className="px-8 py-6">Orders</th>
                                        <th className="px-8 py-6 text-right">Revenue</th>
                                    </>
                                )}
                                {activeReport === 'wallet' && (
                                    <>
                                        <th className="px-8 py-6">Order Number</th>
                                        <th className="px-8 py-6">Date</th>
                                        <th className="px-8 py-6">Customer</th>
                                        <th className="px-8 py-6 text-right">Wallet Used</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {getReportData(activeReport).map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-all font-bold text-sm text-gray-600">
                                    {activeReport === 'sales' && (
                                        <>
                                            <td className="px-8 py-6"><span className="text-gray-900 font-black">#{row.orderNumber}</span></td>
                                            <td className="px-8 py-6">{row.date}</td>
                                            <td className="px-8 py-6">
                                                <div className="text-gray-900">{row.customer}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${row.status === 'delivered' ? 'bg-green-50 text-green-600' : row.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6"><span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 px-3 py-1 rounded-lg">{row.payment}</span></td>
                                            <td className="px-8 py-6 text-right text-gray-900 font-black">৳{row.total.toLocaleString()}</td>
                                        </>
                                    )}
                                    {activeReport === 'monthly' && (
                                        <>
                                            <td className="px-8 py-6 text-gray-900 font-black">{row.label}</td>
                                            <td className="px-8 py-6">{row.orders} Orders</td>
                                            <td className="px-8 py-6 font-black text-primary">৳{row.revenue.toLocaleString()}</td>
                                            <td className="px-8 py-6 text-right">৳{row.avg.toLocaleString()}</td>
                                        </>
                                    )}
                                    {(activeReport === 'payment' || activeReport === 'status') && (
                                        <>
                                            <td className="px-8 py-6 text-gray-900 font-black">{row.label}</td>
                                            <td className="px-8 py-6">{row.orders} Orders</td>
                                            <td className="px-8 py-6 text-right font-black text-primary">৳{row.revenue.toLocaleString()}</td>
                                        </>
                                    )}
                                    {activeReport === 'wallet' && (
                                        <>
                                            <td className="px-8 py-6 text-gray-900 font-black">#{row.label}</td>
                                            <td className="px-8 py-6">{row.date}</td>
                                            <td className="px-8 py-6">{row.customer}</td>
                                            <td className="px-8 py-6 text-right font-black text-yellow-600">৳{row.wallet.toLocaleString()}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {getReportData(activeReport).length === 0 && (
                    <div className="p-20 text-center text-gray-400 font-black uppercase tracking-widest text-xs">
                        No transactions found for the selected period
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesReport;
