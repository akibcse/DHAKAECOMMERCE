import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserOrders } from "../../utils/dbServices"; // [UPDATED]
import { BsCheckCircle, BsXCircle, BsClock, BsTruck, BsChatDots, BsBagCheck, BsSave, BsExclamationTriangle } from "react-icons/bs";

const MyOrders = () => {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // [NEW]

    useEffect(() => {
        if (currentUser) {
            fetchUserOrders();
        }
    }, [currentUser]);

    const fetchUserOrders = async () => {
        try {
            setLoading(true);
            const myOrders = await getUserOrders(currentUser.uid); // [UPDATED]
            // Explicitly sort by createdAt descending (newest first)
            const sortedOrders = myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(sortedOrders);
            setError(null);
        } catch (error) {
            console.error("Orders Fetch Error:", error);
            setError("Failed to load your orders. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (status) => {
        const steps = { pending: 1, processing: 2, shipped: 3, delivered: 4, cancelled: -1 };
        return steps[status] || 0;
    };

    const OrderTimeline = ({ order }) => {
        const currentStep = getStatusStep(order.orderStatus);
        if (order.orderStatus === "cancelled") return (
            <div className="flex items-center gap-2 text-red-600"><BsXCircle size={18} /><span className="font-bold text-sm">Cancelled</span></div>
        );

        const steps = [
            { label: "Pending", icon: <BsClock />, step: 1 },
            { label: "Processing", icon: <BsSave />, step: 2 },
            { label: "Shipped", icon: <BsTruck />, step: 3 },
            { label: "Delivered", icon: <BsCheckCircle />, step: 4 },
        ];

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-1">
                    {steps.map((s, idx) => (
                        <div key={idx} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                                <div className={`flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full border-2 ${currentStep >= s.step ? "bg-primary border-primary text-white" : "bg-white border-gray-200 text-gray-300"}`}>
                                    <span className="scale-75 md:scale-100">{s.icon}</span>
                                </div>
                                <span className={`text-[7px] md:text-[9px] font-bold uppercase mt-1 text-center ${currentStep >= s.step ? "text-primary" : "text-gray-300"}`}>{s.label}</span>
                            </div>
                            {idx < steps.length - 1 && <div className={`flex-1 h-0.5 mt-[-18px] md:mt-[-14px] ${currentStep > s.step ? "bg-primary" : "bg-gray-200"}`} />}
                        </div>
                    ))}
                </div>
                {order.timeline && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        {order.timeline.map((t, i) => (
                            <div key={i} className="flex justify-between text-[10px] font-bold">
                                <span className="text-gray-500 uppercase tracking-widest">{t.status}: {t.note}</span>
                                <span className="text-gray-400">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Orders</h1>
                <p className="text-gray-500 font-medium">
                    Track and manage your recent purchases
                    <span className="text-xs text-primary bg-primary/5 px-2 py-1 rounded-lg ml-2">
                        {currentUser?.email}
                    </span>
                </p>
            </div>

            <div className="space-y-4">
                {error ? (
                    <div className="bg-red-50 p-8 rounded-3xl text-center border border-red-100">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BsExclamationTriangle size={30} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">Something went wrong</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={fetchUserOrders}
                            className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                        <p className="text-gray-400 font-bold text-sm animate-pulse">Loading your orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300"><BsBagCheck size={40} /></div>
                        <p className="text-gray-500 font-bold mb-8">You haven't placed any orders yet.</p>
                        <Link to="/shop" className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-opacity-90 transition-all shadow-lg">Start Shopping</Link>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.orderId} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 border-l-8 border-primary relative group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="max-w-[60%]">
                                    <h3 className="text-lg md:text-xl font-black text-gray-900 mb-1 truncate">Order #{order.orderNumber}</h3>
                                    <p className="text-xs md:text-sm font-medium text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xl md:text-2xl font-black text-primary tracking-tight">৳{order.finalAmount || order.totalAmount}</p>
                                    <div className="flex flex-col items-end gap-1 mt-2">
                                        <Link to={`/orders/${order.orderId}`} className="text-[8px] md:text-[10px] font-black uppercase text-primary hover:underline tracking-widest">Details</Link>
                                        <Link to={`/order-messages/${order.orderId}`} className="inline-flex items-center gap-1 text-[8px] md:text-[10px] font-black uppercase text-secondary hover:underline tracking-widest"><BsChatDots /> Chat</Link>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-8 bg-gray-50 p-6 rounded-2xl"><OrderTimeline order={order} /></div>
                            <div className="space-y-3">
                                {Object.values(order.items || {}).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 font-bold">
                                                <span className="text-primary font-black">x{item.quantity}</span> {item.name || item.title}
                                            </span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-gray-500 font-bold">৳{Number(item.discountPrice || item.price)} each</span>
                                                {item.discountPrice && Number(item.discountPrice) < Number(item.price) && (
                                                    <span className="text-[9px] text-gray-300 line-through">৳{item.price}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-black text-gray-900">৳{Number(item.lineTotal || (item.price * item.quantity))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyOrders;
