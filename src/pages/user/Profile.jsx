import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOrders } from "../../utils/dbServices";
import { BsCheckCircle, BsXCircle, BsClock, BsTruck, BsChatDots } from "react-icons/bs";

const Profile = () => {
    const { currentUser, userRole } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserOrders = async () => {
            if (currentUser) {
                const allOrders = await getOrders();
                const myOrders = allOrders.filter(order => order.userId === currentUser.uid);
                setOrders(myOrders.reverse()); // Newest first
                setLoading(false);
            }
        };
        fetchUserOrders();
    }, [currentUser]);

    const getStatusStep = (status) => {
        const steps = { pending: 1, shipped: 2, delivered: 3, cancelled: -1 };
        return steps[status] || 0;
    };

    const OrderTimeline = ({ status }) => {
        const currentStep = getStatusStep(status);

        if (status === "cancelled") {
            return (
                <div className="flex items-center gap-2 text-red-600">
                    <BsXCircle size={20} />
                    <span className="font-semibold">Order Cancelled</span>
                </div>
            );
        }

        const steps = [
            { label: "Pending", icon: <BsClock />, step: 1 },
            { label: "Shipped", icon: <BsTruck />, step: 2 },
            { label: "Delivered", icon: <BsCheckCircle />, step: 3 },
        ];

        return (
            <div className="flex items-center justify-between gap-2">
                {steps.map((s, idx) => (
                    <div key={idx} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep >= s.step
                                        ? "bg-primary border-primary text-white"
                                        : "bg-white border-gray-300 text-gray-400"
                                    }`}
                            >
                                {s.icon}
                            </div>
                            <span className={`text-xs mt-1 ${currentStep >= s.step ? "text-primary font-semibold" : "text-gray-400"}`}>
                                {s.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 ${currentStep > s.step ? "bg-primary" : "bg-gray-300"}`} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold">
                        {currentUser?.email[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{currentUser?.displayName || "User"}</h1>
                        <p className="text-gray-600">{currentUser?.email}</p>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full uppercase font-bold mt-1 inline-block">{userRole}</span>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Order History</h2>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white p-12 rounded-lg shadow text-center">
                    <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                    <Link to="/shop" className="bg-primary text-white px-6 py-2 rounded-full hover:bg-green-700 transition">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.orderId} className="bg-white p-6 rounded-lg shadow border-l-4 border-primary">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="font-bold text-lg">Order #{order.orderId.slice(-8)}</p>
                                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-600 mt-1">Payment: {order.paymentMethod}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary text-xl">৳{order.totalAmount}</p>
                                    <Link
                                        to={`/order-messages/${order.orderId}`}
                                        className="inline-flex items-center gap-1 mt-2 text-sm text-secondary hover:underline"
                                    >
                                        <BsChatDots /> Message Shop
                                    </Link>
                                </div>
                            </div>

                            {/* Order Progress Timeline */}
                            <div className="my-6 px-4">
                                <OrderTimeline status={order.orderStatus} />
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2">Items:</h4>
                                <ul className="space-y-2">
                                    {order.items.map(item => (
                                        <li key={item.id} className="flex justify-between text-sm">
                                            <span>{item.quantity} x {item.title}</span>
                                            <span>৳{item.price * item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Profile;

