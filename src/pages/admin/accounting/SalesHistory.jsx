import { useState, useEffect, useRef } from "react";
import { getOrders } from "../../../utils/dbServices";
import { getSalesLedger, getCustomerAccounts } from "../../../utils/accountingServices";
import { BsPrinter, BsSearch } from "react-icons/bs";
import SalesMemoPrint from "../../../components/SalesMemoPrint";

const SalesHistory = () => {
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredSales, setFilteredSales] = useState([]);

    // Print State
    const [printOrder, setPrintOrder] = useState(null);
    const printRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterSales();
    }, [sales, searchTerm]);

    useEffect(() => {
        if (printOrder && printRef.current) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [printOrder]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [onlineOrders, offlineSales, customersData] = await Promise.all([
                getOrders(),
                getSalesLedger(),
                getCustomerAccounts()
            ]);

            // Create customer map
            const custMap = {};
            customersData.forEach(c => {
                custMap[c.id] = c;
            });
            setCustomers(custMap);

            // Normalize Data
            const normalizedOnline = onlineOrders.map(order => ({
                id: order.orderId,
                invoiceNo: order.orderNumber,
                date: order.createdAt,
                type: 'Online',
                customerName: order.shippingDetails?.name || "Unknown",
                total: order.finalAmount,
                paid: order.paymentStatus === 'paid' ? order.finalAmount : 0, // Simplified assumption or check payment logs
                due: order.paymentStatus === 'paid' ? 0 : order.finalAmount,
                status: order.orderStatus,
                originalData: order
            }));

            const normalizedOffline = offlineSales.map(sale => {
                const customer = custMap[sale.customerId];
                const netAmount = Number(sale.netAmount || 0);
                const paidAmount = Number(sale.paidAmount || 0);
                // Ensure we don't return NaN
                return {
                    id: sale.id,
                    invoiceNo: sale.orderNumber,
                    date: sale.date,
                    type: 'Offline',
                    customerName: customer ? customer.name : "Unknown",
                    total: isNaN(netAmount) ? 0 : netAmount,
                    paid: isNaN(paidAmount) ? 0 : paidAmount,
                    due: Number(sale.dueAmount || 0),
                    status: 'completed',
                    originalData: {
                        ...sale,
                        source: 'offline',
                        customerDetails: customer
                    }
                };
            });

            // Merge and Sort
            const allSales = [...normalizedOnline, ...normalizedOffline].sort((a, b) => new Date(b.date) - new Date(a.date));
            setSales(allSales);

        } catch (error) {
            console.error("Error fetching sales history:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterSales = () => {
        if (!searchTerm) {
            setFilteredSales(sales);
            return;
        }
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = sales.filter(s =>
            s.invoiceNo.toLowerCase().includes(lowerTerm) ||
            s.customerName.toLowerCase().includes(lowerTerm) ||
            s.type.toLowerCase().includes(lowerTerm)
        );
        setFilteredSales(filtered);
    };

    const handlePrint = (sale) => {
        if (sale.type === 'Online') {
            setPrintOrder(sale.originalData);
        } else {
            // Map Offline Data to Online Order shape for SalesMemoPrint
            const offline = sale.originalData;

            // Calculate numeric values safely
            const totalAmount = Number(offline.totalAmount || 0);
            const discount = Number(offline.discount || 0);
            const netAmount = Number(offline.netAmount || (totalAmount - discount));

            const mappedOrder = {
                orderNumber: offline.orderNumber,
                createdAt: offline.date,
                orderStatus: 'Offline Sale',
                paymentMethod: 'Cash', // Default
                shippingDetails: {
                    name: offline.customerDetails?.name || "Customer",
                    phone: offline.customerDetails?.phone || "",
                    address: offline.customerDetails?.address || "",
                    city: "",
                    zip: ""
                },
                items: offline.items || [],
                subtotal: totalAmount, // This is gross total in offline schema
                discounts: {
                    product: 0,
                    coupon: discount
                },
                deliveryCharge: 0,
                finalAmount: netAmount,
                walletUsed: 0
            };
            setPrintOrder(mappedOrder);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="mb-2">
                        <a href="/admin/accounting" className="text-gray-500 hover:text-primary flex items-center gap-2 text-sm">
                            &larr; Back to Dashboard
                        </a>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>
                    <p className="text-gray-500 text-sm">View online and offline sales records</p>
                </div>
                <div className="relative">
                    <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search invoice, customer..."
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Invoice No</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Type</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Customer</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right text-sm">Total</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right text-sm">Paid</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right text-sm">Due</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-center text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                        Loading sales...
                                    </td>
                                </tr>
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                        No sales found
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {new Date(sale.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800 text-sm font-mono">
                                            {sale.invoiceNo}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded-md text-xs uppercase font-bold ${sale.type === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {sale.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 font-medium text-sm">
                                            {sale.customerName}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-800 text-sm">
                                            ৳{sale.total}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-green-600 text-sm">
                                            ৳{sale.paid}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-medium text-sm ${sale.due > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                            {sale.due > 0 ? `৳${sale.due}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handlePrint(sale)}
                                                className="p-2 hover:bg-gray-100 text-gray-600 hover:text-primary rounded-lg transition-colors"
                                                title="Print Invoice"
                                            >
                                                <BsPrinter size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Print Component */}
            <div ref={printRef}>
                <SalesMemoPrint order={printOrder} />
            </div>
        </div>
    );
};

export default SalesHistory;
