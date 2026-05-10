import { useState, useEffect } from "react";
import { getOrders, updateOrderStatus, deleteOrder, updatePaymentStatus } from "../../utils/dbServices";
import { subscribeToMessages, sendMessage, markMessagesAsRead, getUnreadCount } from "../../utils/messageServices";
import { BsChatDots, BsX, BsTrash, BsCreditCard, BsTruck, BsCheck2Circle, BsSearch, BsPrinter, BsXCircle, BsDownload } from "react-icons/bs";
import SalesMemo from "../../components/SalesMemo";
import SalesMemoPrint from "../../components/SalesMemoPrint";
import ChatBox from "../../components/ChatBox";
import { generateInvoicePDF } from "../../utils/exportUtils";
import { motion, AnimatePresence } from "framer-motion";
// Navbar import removed

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [viewingOrder, setViewingOrder] = useState(null); // For details modal
    const [showMemo, setShowMemo] = useState(false);
    const [messages, setMessages] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [error, setError] = useState(null); // [NEW]
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchOrders();
    }, []);

    // [SYNC] Keep viewingOrder in sync with the master orders list
    useEffect(() => {
        if (viewingOrder) {
            const fresh = orders.find(o => o.orderId === viewingOrder.orderId);
            if (fresh) setViewingOrder(fresh);
        }
    }, [orders]);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getOrders();
            const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(sorted);

            // [OPTIMIZED] Fetch all unread counts in parallel
            const countPromises = sorted.map(async (order) => {
                const count = await getUnreadCount(order.orderId, "admin");
                return { id: order.orderId, count };
            });

            const results = await Promise.all(countPromises);

            const counts = {};
            results.forEach(res => {
                counts[res.id] = res.count;
            });

            setUnreadCounts(counts);
        } catch (error) {
            console.error("Fetch Orders Error:", error);
            setError("Failed to load orders. Please try refreshing the page.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            await fetchOrders();
        } catch (error) {
            alert("Status update failed: " + error.message);
        }
    };

    const handlePaymentUpdate = async (orderId, newStatus) => {
        try {
            await updatePaymentStatus(orderId, newStatus);
            
            // Auto-verify advance if marked as fully paid
            if (newStatus === 'paid') {
                const { update, ref } = await import("firebase/database");
                const { db } = await import("../../firebase/firebase");
                const orderRef = ref(db, `orders/${orderId}`);
                await update(orderRef, { isAdvanceVerified: true });
            }
            
            await fetchOrders();
        } catch (error) {
            alert("Payment update failed: " + error.message);
        }
    };

    const handleVerifyAdvance = async (orderId) => {
        try {
            const { update } = await import("firebase/database");
            const { ref } = await import("../../firebase/firebase");
            const { db } = await import("../../firebase/firebase");
            // Direct firebase update to avoid complex dbServices refactoring
            const orderRef = (await import("firebase/database")).ref((await import("../../firebase/firebase")).db, `orders/${orderId}`);
            await (await import("firebase/database")).update(orderRef, { isAdvanceVerified: true });
            toast.success("Advance payment verified!");
            await fetchOrders();
        } catch (error) {
            console.error("Verification failed:", error);
            alert("Failed to verify advance payment.");
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (window.confirm("CRITICAL: Delete this order permanently? This cannot be undone.")) {
            try {
                await deleteOrder(orderId);
                fetchOrders();
            } catch (error) {
                alert("Delete failed: " + error.message);
            }
        }
    };

    const [chatUnsubscribe, setChatUnsubscribe] = useState(null);

    const openMessages = (order) => {
        if (chatUnsubscribe) chatUnsubscribe();

        setSelectedOrder(order);
        setShowMessageModal(true);
        const unsubscribe = subscribeToMessages(order.orderId, (msgs) => setMessages(msgs));
        setChatUnsubscribe(() => unsubscribe);

        markMessagesAsRead(order.orderId, "admin");
        setUnreadCounts(prev => ({ ...prev, [order.orderId]: 0 }));
    };

    const handleSendMessage = async (text) => {
        await sendMessage(selectedOrder.orderId, "admin", "shop@dhakaecommerce.com", text);
    };

    const filteredOrders = orders.filter(o =>
        o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-0">
// Navbar removed
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Order Management</h1>
                    <p className="text-gray-500 text-sm">Monitor sales and manage order lifecycle</p>
                </div>
                <div className="relative w-full md:w-64">
                    <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search ID or Email..."
                        className="w-full bg-white border-none pl-10 pr-4 py-2.5 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 p-10 rounded-3xl text-center border border-red-100 my-8">
                    <p className="text-red-600 font-bold mb-4">{error}</p>
                    <button
                        onClick={fetchOrders}
                        className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            ) : loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Order</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Final Total</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Payment</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.map((order) => (
                                    <tr key={order.orderId} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-black text-gray-900">#{order.orderNumber}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-700">{order.userEmail || "Guest"}</div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{order.shippingAddress?.district}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">
                                            ৳{Number(order.finalAmount || order.totalAmount || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase transition-colors px-2 py-0.5 rounded-full ${order.paymentStatus === 'paid'
                                                    ? 'bg-green-50 text-green-600'
                                                    : 'bg-orange-50 text-orange-600'
                                                    }`}>
                                                    <BsCreditCard size={10} />
                                                    {order.paymentStatus}
                                                </span>
                                                {order.paymentMethod === 'COD' && order.advanceRequired > 0 && !order.isAdvanceVerified && order.paymentStatus !== 'paid' && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">
                                                        Verification Required
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => handlePaymentUpdate(order.orderId, order.paymentStatus === 'paid' ? 'pending' : 'paid')}
                                                    className="text-[9px] text-gray-400 hover:text-primary underline text-left ml-1"
                                                >
                                                    Mark as {order.paymentStatus === 'paid' ? 'unpaid' : 'paid'}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={order.orderStatus}
                                                onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                                                className={`text-[10px] font-bold uppercase border-none rounded-full px-3 py-1.5 focus:ring-0 ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                        order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                    }`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setViewingOrder(order)}
                                                    className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors border border-primary/10"
                                                    title="View Details"
                                                >
                                                    <BsSearch size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openMessages(order)}
                                                    className="relative p-2 text-primary hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Customer Support"
                                                >
                                                    <BsChatDots size={18} />
                                                    {unreadCounts[order.orderId] > 0 && (
                                                        <span className="absolute top-0 right-0 bg-secondary text-white text-[8px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white">
                                                            {unreadCounts[order.orderId]}
                                                        </span>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOrder(order.orderId)}
                                                    className="p-2 text-secondary hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Order"
                                                >
                                                    <BsTrash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {filteredOrders.map((order) => (
                            <div key={order.orderId} className="p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">Order ID</div>
                                        <div className="text-sm font-black text-gray-900">#{order.orderNumber}</div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(order.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-gray-900">৳{Number(order.finalAmount || order.totalAmount || 0)}</div>
                                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase transition-colors px-2 py-0.5 rounded-full mt-1 ${order.paymentStatus === 'paid'
                                            ? 'bg-green-50 text-green-600'
                                            : 'bg-orange-50 text-orange-600'
                                            }`}>
                                            <BsCreditCard size={10} />
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-center pt-2">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Status</label>
                                        <select
                                            value={order.orderStatus}
                                            onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                                            className={`w-full text-[10px] font-bold uppercase border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 ${order.orderStatus === 'delivered' ? 'bg-green-50 text-green-700' :
                                                order.orderStatus === 'shipped' ? 'bg-blue-50 text-blue-700' :
                                                    order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-700' :
                                                        'bg-yellow-50 text-yellow-700'
                                                }`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 self-end">
                                        <button
                                            onClick={() => setViewingOrder(order)}
                                            className="p-3 bg-white text-primary border border-primary/20 rounded-xl"
                                        >
                                            <BsSearch size={20} />
                                        </button>
                                        <button
                                            onClick={() => openMessages(order)}
                                            className="relative p-3 bg-primary/5 text-primary border border-primary/10 rounded-xl"
                                        >
                                            <BsChatDots size={20} />
                                            {unreadCounts[order.orderId] > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-secondary text-white text-[9px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm">
                                                    {unreadCounts[order.orderId]}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOrder(order.orderId)}
                                            className="p-3 bg-red-50 text-secondary border border-red-100 rounded-xl"
                                        >
                                            <BsTrash size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 px-1 italic">
                                    <span>Method: {order.paymentMethod?.toUpperCase()}</span>
                                    <button
                                        onClick={() => handlePaymentUpdate(order.orderId, order.paymentStatus === 'paid' ? 'pending' : 'paid')}
                                        className="text-primary hover:underline underline-offset-2"
                                    >
                                        Mark as {order.paymentStatus === 'paid' ? 'unpaid' : 'paid'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            <AnimatePresence>
                {viewingOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingOrder(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">Order #{viewingOrder.orderNumber}</h3>
                                    <p className="text-xs text-gray-500 font-medium">{new Date(viewingOrder.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowMemo(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
                                        title="Print Sales Memo"
                                    >
                                        <BsPrinter size={16} /> Print
                                    </button>
                                    <button
                                        onClick={() => generateInvoicePDF(viewingOrder)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
                                        title="Download Memo / Invoice"
                                    >
                                        <BsDownload size={16} /> Download
                                    </button>
                                    <button onClick={() => setViewingOrder(null)} className="p-2 bg-white rounded-full text-gray-500 shadow-sm transition-transform hover:scale-110">
                                        <BsXCircle size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Items Section */}
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Ordered Items</h3>
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                                        {Object.values(viewingOrder.items || {}).map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-primary border border-gray-100 shadow-sm">
                                                        x{item.quantity}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-gray-900 font-bold">
                                                                ৳{Number(item.discountPrice || item.price)} each
                                                            </span>
                                                            {item.discountPrice && Number(item.discountPrice) < Number(item.price) && (
                                                                <span className="text-[9px] text-gray-400 line-through">
                                                                    ৳{item.price}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-black text-gray-900">৳{item.lineTotal}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Address & Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Shipping To</h3>
                                        <div className="text-sm font-bold text-gray-900">{viewingOrder.shippingDetails?.name}</div>
                                        <div className="text-sm text-gray-600 font-medium">{viewingOrder.shippingDetails?.phone}</div>
                                        <div className="text-sm text-gray-600 font-medium mt-1 leading-relaxed">
                                            {viewingOrder.shippingDetails?.address}, {viewingOrder.shippingDetails?.city} - {viewingOrder.shippingDetails?.zip}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Payment Info</h3>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Method:</span>
                                            <span className="text-xs font-black uppercase text-primary">{viewingOrder.paymentMethod}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status:</span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${viewingOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {viewingOrder.paymentStatus}
                                            </span>
                                        </div>
                                        
                                        {viewingOrder.paymentMethod === 'COD' && viewingOrder.advanceRequired > 0 && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase">Advance Method</span>
                                                    <span className="text-[10px] font-black text-gray-900 uppercase">{viewingOrder.advanceMethod}</span>
                                                </div>
                                                {viewingOrder.advanceTxnId && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase">Ref (TxnID/Last 4)</span>
                                                        <span className="text-[10px] font-mono font-black text-primary bg-primary/5 px-2 py-0.5 rounded">{viewingOrder.advanceTxnId}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase">Verification</span>
                                                    {viewingOrder.isAdvanceVerified ? (
                                                        <span className="text-[9px] font-black text-green-600 uppercase">Verified ✓</span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleVerifyAdvance(viewingOrder.orderId)}
                                                            className="text-[9px] font-black bg-primary text-white px-2 py-1 rounded hover:bg-opacity-90 transition-all uppercase"
                                                        >
                                                            Verify Now
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Price Breakdown */}
                                <div className="border-t border-gray-100 pt-6">
                                    <div className="bg-dark text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full shadow-inner"></div>
                                        <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-secondary flex items-center gap-2">
                                            Financial Breakdown
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400 font-medium">Subtotal (Raw)</span>
                                                <span className="font-bold">৳{Number(viewingOrder.subtotal || 0)}</span>
                                            </div>
                                            {(viewingOrder.discounts?.product > 0 || viewingOrder.discounts?.coupon > 0 || viewingOrder.discounts?.flashSale > 0) && (
                                                <div className="space-y-2 border-y border-white/5 py-3">
                                                    {viewingOrder.discounts?.product > 0 && (
                                                        <div className="flex justify-between text-xs text-green-400">
                                                            <span>Product Discount</span>
                                                            <span>-৳{viewingOrder.discounts.product}</span>
                                                        </div>
                                                    )}
                                                    {viewingOrder.discounts?.coupon > 0 && (
                                                        <div className="flex justify-between text-xs text-green-400">
                                                            <span>Coupon Discount</span>
                                                            <span>-৳{viewingOrder.discounts.coupon}</span>
                                                        </div>
                                                    )}
                                                    {viewingOrder.discounts?.flashSale > 0 && (
                                                        <div className="flex justify-between text-xs text-green-400">
                                                            <span>Flash Sale</span>
                                                            <span>-৳{viewingOrder.discounts.flashSale}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {viewingOrder.walletUsed > 0 && (
                                                <div className="flex justify-between text-sm text-yellow-400">
                                                    <span>Wallet Balance</span>
                                                    <span>-৳{viewingOrder.walletUsed}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400 font-medium">Delivery Charge</span>
                                                <span className="font-bold">৳{viewingOrder.deliveryCharge}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-white/20 mt-4">
                                                <span className="text-lg font-black tracking-tight text-white uppercase">Final Payable</span>
                                                <span className="text-3xl font-black text-white tracking-tighter">৳{Number(viewingOrder.finalAmount || viewingOrder.totalAmount || 0) - (viewingOrder.isAdvanceVerified ? Number(viewingOrder.advanceRequired || 0) : 0)}</span>
                                            </div>
                                            {viewingOrder.paymentMethod === 'COD' && viewingOrder.advanceRequired > 0 && (
                                                <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4 bg-primary/10 -mx-8 px-8 py-4">
                                                    <div>
                                                        <span className="block text-[10px] font-black text-secondary uppercase tracking-widest">Advance Paid</span>
                                                        <span className={`text-xs font-medium italic ${viewingOrder.isAdvanceVerified ? 'text-green-400' : 'text-amber-400 animate-pulse'}`}>
                                                            {viewingOrder.isAdvanceVerified ? 'Verified & Deducted' : 'Pending Verification'}
                                                        </span>
                                                    </div>
                                                    <span className="text-2xl font-black text-secondary tracking-tighter">৳{Number(viewingOrder.advanceRequired)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {(viewingOrder.discounts?.product + viewingOrder.discounts?.coupon + viewingOrder.discounts?.flashSale) > 0 && (
                                            <div className="mt-6 text-center text-[10px] font-black uppercase tracking-widest py-3 bg-secondary/20 rounded-xl text-secondary border border-secondary/20">
                                                Total Savings: ৳{viewingOrder.discounts.product + viewingOrder.discounts.coupon + viewingOrder.discounts.flashSale}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Message Modal */}
            <AnimatePresence>
                {showMessageModal && selectedOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMessageModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl h-[80vh] flex flex-col"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Support: #{selectedOrder.orderId.slice(-8)}</h2>
                                    <p className="text-xs text-gray-500 font-medium">Live conversation with customer</p>
                                </div>
                                <button onClick={() => setShowMessageModal(false)} className="p-2 bg-white rounded-full text-gray-500 shadow-sm">
                                    <BsX size={24} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <ChatBox
                                    messages={messages}
                                    onSendMessage={handleSendMessage}
                                    currentUserRole="admin"
                                    currentUserEmail="shop@dhakaecommerce.com"
                                    loading={false}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* Print Component - Hidden by default, visible only during print if handled by CSS */}
            {/* Modal for viewing details (includes Download button) */}
            <SalesMemo
                order={viewingOrder}
                isOpen={showMemo}
                onClose={() => setShowMemo(false)}
            />

            {/* Hidden Print Component - Always rendered with selected order to support printing */}
            <SalesMemoPrint order={viewingOrder} />
        </div >
    );
};

export default Orders;
