import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOrders } from "../../utils/dbServices";
import { subscribeToMessages, sendMessage, markMessagesAsRead } from "../../utils/messageServices";
import ChatBox from "../../components/ChatBox";

const OrderMessages = () => {
    const { orderId } = useParams();
    const { currentUser } = useAuth();
    const [order, setOrder] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch order details
        const fetchOrder = async () => {
            const allOrders = await getOrders();
            const foundOrder = allOrders.find((o) => o.orderId === orderId);
            setOrder(foundOrder);
            setLoading(false);
        };

        fetchOrder();

        // Subscribe to messages
        const unsubscribe = subscribeToMessages(orderId, (msgs) => {
            setMessages(msgs);
        });

        // Mark messages as read when viewing
        markMessagesAsRead(orderId, "user");

        return () => unsubscribe();
    }, [orderId]);

    const handleSendMessage = async (text) => {
        try {
            await sendMessage(orderId, "user", currentUser.email, text);
        } catch (error) {
            toast.error("Failed to send message");
        }
    };

    if (loading || !order) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link to="/orders" className="text-primary hover:underline mb-4 inline-block font-bold">
                ← Back to My Orders
            </Link>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Order Header */}
                <div className="bg-primary text-white p-6">
                    <h1 className="text-2xl font-bold">Order #{order.orderId.slice(-8)}</h1>
                    <div className="mt-2 flex justify-between items-center">
                        <div>
                            <p className="text-sm opacity-90">
                                Placed on {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-lg font-bold mt-1">৳{Number(order.finalAmount || order.totalAmount || 0)}</p>
                        </div>
                        <span
                            className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${order.orderStatus === "delivered"
                                ? "bg-green-500"
                                : order.orderStatus === "cancelled"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                                }`}
                        >
                            {order.orderStatus}
                        </span>
                    </div>
                </div>

                {/* Order Items Summary */}
                <div className="p-6 border-b">
                    <h3 className="font-bold text-lg mb-3">Order Items</h3>
                    <ul className="space-y-2">
                        {Object.values(order.items || {}).map((item, idx) => (
                            <li key={idx} className="flex justify-between items-start text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                <div className="flex flex-col">
                                    <span className="font-semibold">
                                        {item.quantity} x {item.name || item.title}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-gray-500 font-bold">৳{Number(item.discountPrice || item.price)} each</span>
                                        {item.discountPrice && Number(item.discountPrice) < Number(item.price) && (
                                            <span className="text-[9px] text-gray-300 line-through">৳{item.price}</span>
                                        )}
                                    </div>
                                </div>
                                <span className="font-semibold">৳{Number(item.lineTotal || (item.price * item.quantity))}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Chat Section */}
                <div className="p-6">
                    <h3 className="font-bold text-lg mb-4">Message Shop</h3>
                    <ChatBox
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        currentUserRole="user"
                        currentUserEmail={currentUser.email}
                        loading={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default OrderMessages;
