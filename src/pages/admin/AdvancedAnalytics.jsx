import { useState, useEffect } from "react";
import { getOrders, getProducts } from "../../utils/dbServices";
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { BsArrowUpRight, BsBag, BsCashStack, BsPeople, BsDownload, BsExclamationTriangle } from "react-icons/bs";

import { useSettings } from "../../context/SettingsContext"; // [NEW]

const AdvancedAnalytics = () => {
    const { settings } = useSettings(); // [NEW]
    const brandName = settings?.branding?.brandName || "DhakaEcommerce";

    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersData, productsData] = await Promise.all([getOrders(), getProducts()]);
                setOrders(ordersData);
                setProducts(productsData);
            } catch (error) {
                console.error("Analytics Dashboard Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Data Processing ---
    const processMonthlySales = () => {
        const monthlyData = {};
        orders.forEach(order => {
            const month = new Date(order.createdAt).toLocaleString('default', { month: 'short' });
            monthlyData[month] = (monthlyData[month] || 0) + order.finalAmount;
        });
        return Object.keys(monthlyData).map(month => ({ name: month, revenue: monthlyData[month] }));
    };

    const processTopProducts = () => {
        const productSales = {};
        orders.forEach(order => {
            Object.values(order.items || {}).forEach(item => {
                productSales[item.name] = (productSales[item.name] || 0) + item.lineTotal;
            });
        });
        return Object.keys(productSales)
            .map(name => ({ name, value: productSales[name] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    };

    const processPaymentMethods = () => {
        const methods = { 'COD': 0, 'ONLINE': 0, 'WALLET': 0 };
        orders.forEach(order => {
            methods[order.paymentMethod] = (methods[order.paymentMethod] || 0) + 1;
        });
        return Object.keys(methods).map(method => ({ name: method, value: methods[method] }));
    };

    const COLORS = ['#FF4D4D', '#2D3436', '#00B894', '#0984E3'];

    if (loading) return <div className="p-8 text-center"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div></div>;

    const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
    const avgOrderValue = orders.length ? (totalRevenue / orders.length).toFixed(2) : 0;

    return (
        <div className="p-4 md:p-8 space-y-8 bg-gray-50/50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Business Intelligence</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">{brandName} Advanced Analytics</p>
                </div>
                <button className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
                    <BsDownload size={16} /> Export Reports
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-secondary rounded-2xl"><BsCashStack size={24} /></div>
                        <span className="text-green-500 text-xs font-black flex items-center gap-1"><BsArrowUpRight /> +12%</span>
                    </div>
                    <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Revenue</div>
                    <div className="text-3xl font-black text-gray-900 mt-1">৳{totalRevenue.toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><BsBag size={24} /></div>
                        <span className="text-gray-400 text-xs font-black">All Time</span>
                    </div>
                    <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Orders</div>
                    <div className="text-3xl font-black text-gray-900 mt-1">{orders.length}</div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-500 rounded-2xl"><BsArrowUpRight size={24} /></div>
                    </div>
                    <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Avg. Order Value</div>
                    <div className="text-3xl font-black text-gray-900 mt-1">৳{avgOrderValue}</div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl"><BsExclamationTriangle size={24} /></div>
                    </div>
                    <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Fraud Risk Flags</div>
                    <div className="text-3xl font-black text-gray-900 mt-1">04</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Growth Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Revenue Growth</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={processMonthlySales()}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#FF4D4D" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Revenue by Top Products</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={processTopProducts()} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: '#F8F9FA' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontWeight: 'bold' }} />
                                <Bar dataKey="value" fill="#2D3436" radius={[0, 10, 10, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Payment Methods Distribution</h3>
                    <div className="h-[300px] flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={processPaymentMethods()}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={100}
                                    paddingAngle={5} dataKey="value"
                                >
                                    {processPaymentMethods().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Detailed Reports Table (Snippet) */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Recent Sales Audit</h3>
                    <div className="space-y-4">
                        {orders.slice(-5).reverse().map(order => (
                            <div key={order.orderId} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                                <div>
                                    <div className="font-black text-sm text-gray-900">#{order.orderNumber}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase">{order.paymentMethod} • {new Date(order.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="text-primary font-black">৳{order.finalAmount}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedAnalytics;
