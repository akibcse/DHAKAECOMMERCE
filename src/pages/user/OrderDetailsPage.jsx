import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderById } from "../../utils/dbServices"; // [UPDATED]
import { useAuth } from "../../context/AuthContext";
import { BsCheckCircle, BsXCircle, BsClock, BsTruck, BsArrowLeft, BsChatDots, BsBagCheck, BsShieldLock, BsFileEarmarkText } from "react-icons/bs";
import { generateInvoicePDF } from "../../utils/exportUtils";
import SalesMemo from "../../components/SalesMemo";

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const { currentUser, loading: authLoading } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMemo, setShowMemo] = useState(false);
    const [error, setError] = useState(null); // [NEW]

    useEffect(() => {
        if (authLoading) return; // Wait for auth to resolve

        if (!currentUser) {
            setError("You must be logged in to view this order.");
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            if (!orderId) return;

            try {
                setLoading(true);
                const foundOrder = await getOrderById(orderId); // [UPDATED]

                // Allow user to view their own order OR admin to view any
                if (foundOrder && (foundOrder.userId === currentUser.uid || currentUser.role === 'admin')) {
                    setOrder(foundOrder);
                } else if (foundOrder) {
                    setError("You are not authorized to view this order.");
                } else {
                    setError("Order not found.");
                }
            } catch (error) {
                console.error("Fetch Order error:", error);
                setError("Failed to load order details.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId, currentUser, authLoading]);

    const getStatusStep = (status) => {
        const steps = { pending: 1, processing: 2, shipped: 3, delivered: 4, cancelled: -1 };
        return steps[status] || 0;
    };

    if (loading) return (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>
    );

    if (!order) return (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><BsShieldLock size={40} /></div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-500 mb-8">This order does not exist or you don't have permission to view it.</p>
            <Link to="/orders" className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-opacity-90 transition-all">Back to My Orders</Link>
        </div>
    );

    const currentStep = getStatusStep(order.orderStatus);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <Link to="/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-bold mb-8 transition-colors">
                <BsArrowLeft /> Back to My Orders
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Main Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-1">Order #{order.orderNumber}</h1>
                                <p className="text-sm font-medium text-gray-400">Placed on {new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                                    order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    Status: {order.orderStatus}
                                </span>
                            </div>
                        </div>

                        {/* Order Timeline */}
                        <div className="mb-10 pt-6 border-t border-gray-50">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Track Your Order</h3>
                            <div className="flex items-center justify-between gap-1 relative">
                                {[
                                    { label: "Pending", icon: <BsClock />, step: 1 },
                                    { label: "Processing", icon: <BsBagCheck />, step: 2 },
                                    { label: "Shipped", icon: <BsTruck />, step: 3 },
                                    { label: "Delivered", icon: <BsCheckCircle />, step: 4 },
                                ].map((s, idx, arr) => (
                                    <div key={idx} className="flex flex-col items-center flex-1 relative">
                                        <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center z-10 ${currentStep >= s.step ? "bg-primary border-white text-white shadow-lg shadow-primary/20" : "bg-white border-gray-100 text-gray-300"
                                            }`}>
                                            {s.icon}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase mt-3 tracking-wider ${currentStep >= s.step ? "text-gray-900" : "text-gray-300"}`}>
                                            {s.label}
                                        </span>
                                        {idx < arr.length - 1 && (
                                            <div className={`absolute top-5 left-1/2 w-full h-[3px] -z-0 ${currentStep > s.step ? "bg-primary" : "bg-gray-100"
                                                }`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {order.orderStatus === "cancelled" && (
                                <div className="mt-8 bg-red-50 p-4 rounded-2xl flex items-center gap-3 text-red-600 border border-red-100 animate-pulse">
                                    <BsXCircle size={20} />
                                    <span className="font-black text-xs uppercase tracking-widest">Order has been cancelled</span>
                                </div>
                            )}
                        </div>

                        {/* Item List */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Package Content</h3>
                            <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
                                {Object.values(order.items || {}).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white rounded-2xl border border-gray-200 flex items-center justify-center font-black text-primary text-sm shadow-sm">
                                                x{item.quantity}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-gray-900">{item.name}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] text-gray-900 font-bold uppercase tracking-widest">
                                                        ৳{Number(item.discountPrice || item.price)} each
                                                    </span>
                                                    {item.discountPrice && Number(item.discountPrice) < Number(item.price) && (
                                                        <span className="text-[10px] text-gray-400 line-through font-bold">
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
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/5 text-primary rounded-full flex items-center justify-center"><BsChatDots size={24} /></div>
                            <div>
                                <h4 className="font-black text-gray-900 text-sm">Need help with this order?</h4>
                                <p className="text-xs text-gray-500 font-medium">Chat directly with our support team</p>
                            </div>
                        </div>
                        <Link to={`/order-messages/${order.orderId}`} className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-opacity-90 shadow-lg shadow-primary/20 whitespace-nowrap">Open Chat</Link>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-secondary/5 text-secondary rounded-full flex items-center justify-center"><BsFileEarmarkText size={24} /></div>
                            <div>
                                <h4 className="font-black text-gray-900 text-sm">Download Sales Memo</h4>
                                <p className="text-xs text-gray-500 font-medium">Get a professional PDF receipt for your records</p>
                            </div>
                        </div>
                        <button
                            onClick={() => generateInvoicePDF(order)}
                            className="px-8 py-4 bg-dark text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all whitespace-nowrap"
                        >
                            Download Memo / Invoice
                        </button>
                    </div>
                </div>

                {/* Right Column: Order Summary & Address */}
                <div className="space-y-8">
                    <div className="bg-dark text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full shadow-inner"></div>
                        <h2 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10 text-secondary">Summary</h2>

                        <div className="space-y-4 font-bold text-sm relative z-10">
                            <div className="flex justify-between text-gray-400">
                                <span>Subtotal (Raw)</span>
                                <span>৳{Number(order.subtotal || 0)}</span>
                            </div>
                            <div className="space-y-2 py-3 border-y border-white/5">
                                {Number(order.discounts?.product || 0) > 0 && (
                                    <div className="flex justify-between text-xs text-green-400">
                                        <span>Product Discount</span>
                                        <span>-৳{Number(order.discounts.product)}</span>
                                    </div>
                                )}
                                {Number(order.discounts?.coupon || 0) > 0 && (
                                    <div className="flex justify-between text-xs text-green-400">
                                        <span>Coupon Discount</span>
                                        <span>-৳{Number(order.discounts.coupon)}</span>
                                    </div>
                                )}
                                {Number(order.walletUsed || 0) > 0 && (
                                    <div className="flex justify-between text-xs text-yellow-400">
                                        <span>Wallet Deduction</span>
                                        <span>-৳{Number(order.walletUsed)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Delivery Charge</span>
                                <span>৳{Number(order.deliveryCharge || 0)}</span>
                            </div>
                            <div className="flex justify-between text-2xl font-black pt-5 border-t border-white/20 mt-4 text-white uppercase tracking-tighter">
                                <span>Final Payable</span>
                                <span className="text-secondary">৳{Number(order.finalAmount || 0) - (order.isAdvanceVerified ? Number(order.advanceRequired || 0) : 0)}</span>
                            </div>
                            
                            {order.paymentMethod === 'COD' && order.advanceRequired > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                    <div className="flex justify-between text-xs text-green-400">
                                        <span>Advance Paid ({order.advanceMethod?.toUpperCase()})</span>
                                        <span>৳{Number(order.advanceRequired)}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium italic">
                                        * Advance delivery charge is separate and not deducted from the total due.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Delivery To</h3>
                            <div className="font-black text-gray-900 mb-1">{order.shippingDetails?.name}</div>
                            <div className="text-sm text-gray-500 font-bold mb-3">{order.shippingDetails?.phone}</div>
                            <div className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl">
                                {order.shippingDetails?.address},<br />
                                {order.shippingDetails?.city} - {order.shippingDetails?.zip}
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-50">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Payment Information</h3>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-gray-500 font-bold">Method</span>
                                <span className="text-xs font-black uppercase text-primary bg-primary/5 px-3 py-1 rounded-lg">{order.paymentMethod}</span>
                            </div>
                            
                            {order.paymentMethod === 'COD' && order.advanceRequired > 0 && (
                                <div className="space-y-3 mb-3 pb-3 border-b border-gray-50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 font-bold">Advance Method</span>
                                        <span className="text-[10px] font-black uppercase text-gray-900">{order.advanceMethod}</span>
                                    </div>
                                    {order.advanceTxnId && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-bold">Ref (TxnID/Last 4)</span>
                                            <span className="text-[10px] font-mono font-black text-gray-900 bg-gray-50 px-2 py-1 rounded">{order.advanceTxnId}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 font-bold">Advance Status</span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${(order.isAdvanceVerified || order.paymentStatus === 'paid') ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
                                            {(order.isAdvanceVerified || order.paymentStatus === 'paid') ? 'Verified' : 'Pending Verification'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-bold">Payment Status</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                    }`}>{order.paymentStatus}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SalesMemo
                order={order}
                isOpen={showMemo}
                onClose={() => setShowMemo(false)}
            />
        </div>
    );
};

export default OrderDetailsPage;
