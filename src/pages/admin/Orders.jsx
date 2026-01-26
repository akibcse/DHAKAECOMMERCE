import { useState, useEffect } from "react";
import { getOrders, updateOrderStatus } from "../../utils/dbServices";
import { subscribeToMessages, sendMessage, markMessagesAsRead, getUnreadCount } from "../../utils/messageServices";
import { BsChatDots, BsX } from "react-icons/bs";
import ChatBox from "../../components/ChatBox";

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [showMessageModal, setShowMessageModal] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        const data = await getOrders();
        setOrders(data.reverse());

        // Fetch unread counts for all orders
        const counts = {};
        for (const order of data) {
            counts[order.orderId] = await getUnreadCount(order.orderId, "admin");
        }
        setUnreadCounts(counts);
        setLoading(false);
    };

    const handleStatusChange = async (orderId, newStatus) => {
        await updateOrderStatus(orderId, newStatus);
        fetchOrders();
    };

    const openMessages = (order) => {
        setSelectedOrder(order);
        setShowMessageModal(true);

        // Subscribe to messages
        const unsubscribe = subscribeToMessages(order.orderId, (msgs) => {
            setMessages(msgs);
        });

        // Mark as read
        markMessagesAsRead(order.orderId, "admin");
        setUnreadCounts(prev => ({ ...prev, [order.orderId]: 0 }));

        return () => unsubscribe();
    };

    const handleSendMessage = async (text) => {
        await sendMessage(selectedOrder.orderId, "admin", "shop@dhakaecommerce.com", text);
    };

    const closeModal = () => {
        setShowMessageModal(false);
        setSelectedOrder(null);
        setMessages([]);
    };

    if (loading) return <p>Loading orders...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Order Management</h1>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Messages</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                            <tr key={order.orderId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{order.orderId.slice(-6)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.userEmail || order.userId.slice(0, 10)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">৳{order.totalAmount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{order.paymentMethod}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                            order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {order.orderStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    <button
                                        onClick={() => openMessages(order)}
                                        className="relative inline-flex items-center justify-center text-primary hover:text-green-700"
                                        title="View Messages"
                                    >
                                        <BsChatDots size={20} />
                                        {unreadCounts[order.orderId] > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                                {unreadCounts[order.orderId]}
                                            </span>
                                        )}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <select
                                        value={order.orderStatus}
                                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                                        className="border rounded p-1"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Message Modal */}
            {showMessageModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold">Messages - Order #{selectedOrder.orderId.slice(-8)}</h2>
                                <p className="text-sm text-gray-600">Customer: {selectedOrder.userEmail || "User"}</p>
                            </div>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <BsX size={30} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-4">
                            <ChatBox
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                currentUserRole="admin"
                                currentUserEmail="shop@dhakaecommerce.com"
                                loading={false}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
