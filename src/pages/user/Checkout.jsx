import { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { createOrder, validateCoupon, createAuditLog } from "../../utils/dbServices";
import { calculateFraudScore } from "../../utils/FraudService";
import { useNavigate } from "react-router-dom";
import { BsBagCheck, BsShieldCheck, BsTruck, BsTag, BsX, BsCheck2Circle } from "react-icons/bs";
import { useSettings } from "../../context/SettingsContext";
import toast from "react-hot-toast";

const Checkout = () => {
    const { cart, cartTotal, cartSubtotal, productDiscountTotal, clearCart } = useCart();
    const { currentUser } = useAuth();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [placedOrder, setPlacedOrder] = useState(null);

    // Dynamic Payment States
    const [location, setLocation] = useState("inside"); // inside | outside
    const [advanceMethod, setAdvanceMethod] = useState("bkash"); // bkash | bank
    const [advanceTxnId, setAdvanceTxnId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [payFull, setPayFull] = useState(false);

    // Coupon State
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(0);

    const [formData, setFormData] = useState({
        name: currentUser?.displayName || "",
        email: currentUser?.email || "",
        phone: "",
        address: "",
        city: "",
        zip: ""
    });

    useEffect(() => {
        if (appliedCoupon) {
            let discount = 0;
            if (appliedCoupon.type === 'percent') {
                discount = (cartTotal * appliedCoupon.value) / 100;
            } else {
                discount = appliedCoupon.value;
            }
            setDiscountAmount(discount);
        } else {
            setDiscountAmount(0);
        }
    }, [appliedCoupon, cartTotal]);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidating(true);
        try {
            const coupon = await validateCoupon(couponCode, cartTotal);
            setAppliedCoupon(coupon);
            toast.success("Coupon applied successfully!");
        } catch (error) {
            toast.error(error.message || "Invalid coupon");
            setAppliedCoupon(null);
        } finally {
            setIsValidating(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
        setDiscountAmount(0);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const paySettings = settings?.payments || { insideDhakaCharge: 100, outsideDhakaCharge: 150 };
            const shippingFee = location === 'inside' ? paySettings.insideDhakaCharge : paySettings.outsideDhakaCharge;
            const walletUsed = 0; 
            // Final total now INCLUDES shipping fee again to track full order value
            const finalTotal = cartTotal - discountAmount + shippingFee - walletUsed;
            
            // Calculate how much they are paying now
            const amountToPay = payFull ? finalTotal : shippingFee;

            // Map cart to items schema
            const orderItems = {};
            cart.forEach((item, index) => {
                orderItems[`item_${index}`] = {
                    productId: item.id,
                    name: item.title,
                    price: item.price,
                    discountPrice: item.discountPrice || null,
                    quantity: item.quantity,
                    lineTotal: (item.discountPrice || item.price) * item.quantity
                };
            });

            const orderData = {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                items: orderItems,
                shippingDetails: formData,
                subtotal: Number(cartSubtotal),
                discounts: {
                    product: Number(productDiscountTotal),
                    coupon: Number(discountAmount),
                    flashSale: 0
                },
                walletUsed: Number(walletUsed),
                deliveryCharge: Number(shippingFee),
                finalAmount: Number(finalTotal),
                paymentMethod,
                paymentStatus: paymentMethod === 'ONLINE' ? 'paid' : 'pending',
                orderStatus: "pending",
                createdAt: new Date().toISOString(),
                // COD Advance specific fields
                location,
                advanceRequired: Number(amountToPay),
                advanceMethod,
                advanceTxnId,
                isAdvanceVerified: false
            };

            // Fraud Detection using specialized service
            const fraudResult = await calculateFraudScore(currentUser.uid, orderData);
            if (fraudResult.score > 80) {
                toast.error("Security Alert: Your account has high-risk activity flags. COD is disabled.");
                if (paymentMethod === 'COD') {
                    setLoading(false);
                    return;
                }
            }

            const result = await createOrder(orderData);
            setPlacedOrder({ ...orderData, ...result });

            clearCart();
            setShowSuccess(true);
            toast.success(`Success! Order #${result.orderNumber} placed.`);
        } catch (error) {
            toast.error("Failed to place order. Please try again.");
            console.error(error);
        }
        setLoading(false);
    };

    if (cart.length === 0 && !showSuccess) {
        navigate("/cart");
        return null;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Left Side: Form & Delivery */}
                <div className="lg:w-2/3 space-y-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">Checkout</h1>
                        <p className="text-gray-500 font-medium">Complete your order by providing delivery details</p>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                <BsTruck size={24} />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Shipping Details</h2>
                        </div>

                        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                    <input
                                        type="text" name="name" placeholder="John Doe" required
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 font-bold"
                                        value={formData.name} onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                                    <input
                                        type="tel" name="phone" placeholder="01XXXXXXXXX" required
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 font-bold"
                                        value={formData.phone} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                <input
                                    type="email" name="email" placeholder="email@example.com" required readOnly
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 font-bold text-gray-400"
                                    value={formData.email}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Delivery Address</label>
                                <textarea
                                    name="address" placeholder="House #, Road #, Area..." required
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 font-bold h-32 resize-none"
                                    value={formData.address} onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">City</label>
                                    <input
                                        type="text" name="city" placeholder="Dhaka" required
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 font-bold"
                                        value={formData.city} onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Zip Code</label>
                                    <input
                                        type="text" name="zip" placeholder="1200" required
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 font-bold"
                                        value={formData.zip} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="pt-8 mt-8 border-t border-gray-100">
                                <h2 className="text-xl font-black text-gray-900 mb-6">Delivery Location</h2>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <button
                                        type="button"
                                        onClick={() => setLocation("inside")}
                                        className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${location === "inside" ? "border-primary bg-green-50 text-primary" : "border-gray-50 bg-gray-50 text-gray-500"}`}
                                    >
                                        Inside Dhaka (৳{settings?.payments?.insideDhakaCharge || 100})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLocation("outside")}
                                        className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${location === "outside" ? "border-primary bg-green-50 text-primary" : "border-gray-50 bg-gray-50 text-gray-500"}`}
                                    >
                                        Outside Dhaka (৳{settings?.payments?.outsideDhakaCharge || 150})
                                    </button>
                                </div>

                                <h2 className="text-xl font-black text-gray-900 mb-6">Payment Method</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {settings?.payments?.codEnabled !== false && (
                                        <label className={`flex items-center gap-4 p-5 rounded-3xl cursor-pointer transition-all border-2 ${paymentMethod === 'COD' ? 'border-primary bg-green-50/50' : 'border-gray-50 bg-gray-50 hover:bg-gray-100'}`}>
                                            <input
                                                type="radio" name="payment" value="COD"
                                                className="w-5 h-5 text-primary focus:ring-primary"
                                                checked={paymentMethod === "COD"}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                            />
                                            <div>
                                                <div className="font-black text-gray-900">Cash on Delivery</div>
                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pay when you receive</div>
                                            </div>
                                        </label>
                                    )}
                                    {settings?.payments?.onlinePaymentEnabled !== false ? (
                                        <label className={`flex items-center gap-4 p-5 rounded-3xl cursor-pointer transition-all border-2 ${paymentMethod === 'ONLINE' ? 'border-primary bg-green-50/50' : 'border-gray-50 bg-gray-50 hover:bg-gray-100'}`}>
                                            <input
                                                type="radio" name="payment" value="ONLINE"
                                                className="w-5 h-5 text-primary focus:ring-primary"
                                                checked={paymentMethod === "ONLINE"}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                            />
                                            <div>
                                                <div className="font-black text-gray-900">Online Payment</div>
                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">SSLCommerz Secured</div>
                                            </div>
                                        </label>
                                    ) : (
                                        <div className="p-5 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 opacity-60 flex items-center justify-center text-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Online payment temporarily unavailable</p>
                                        </div>
                                    )}
                                </div>

                                {/* COD Advance Payment Fields */}
                                {paymentMethod === 'COD' && settings?.payments?.codAdvanceEnabled && (
                                    <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-[2rem] space-y-6 animate-fade-in">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-primary text-white rounded-lg">
                                                <BsShieldCheck size={18} />
                                            </div>
                                            <h3 className="font-black text-gray-900">Advance Payment Required</h3>
                                        </div>
                                        
                                        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/50 p-4 rounded-2xl border border-primary/10 mb-4">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Payment Option</h4>
                                                <p className="text-[10px] text-gray-500 font-medium">Choose how much you want to pay now via Mobile Banking/Bank</p>
                                            </div>
                                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                                <button 
                                                    type="button"
                                                    onClick={() => setPayFull(false)}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!payFull ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    Advance Only
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setPayFull(true)}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${payFull ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    Full Payment
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                            {payFull 
                                                ? `Please send the full amount ৳${Number(cartTotal) - Number(discountAmount) + (location === 'inside' ? (settings?.payments?.insideDhakaCharge || 100) : (settings?.payments?.outsideDhakaCharge || 150))} to confirm your order.` 
                                                : (settings?.payments?.paymentInstructions || "Please send the delivery charge as advance to confirm your order.")
                                            }
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                                <span className="block text-[9px] font-black text-primary uppercase tracking-widest mb-1">bKash</span>
                                                <span className="text-sm font-black text-gray-900 tracking-tighter">{settings?.payments?.bkashNumber || "017XXXXXXXX"}</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                                <span className="block text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Nagad</span>
                                                <span className="text-sm font-black text-gray-900 tracking-tighter">{settings?.payments?.nagadNumber || "017XXXXXXXX"}</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                                <span className="block text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1">Rocket</span>
                                                <span className="text-sm font-black text-gray-900 tracking-tighter">{settings?.payments?.rocketNumber || "017XXXXXXXX"}</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 md:col-span-2 lg:col-span-3">
                                                <span className="block text-[9px] font-black text-primary uppercase tracking-widest mb-1">Bank Account</span>
                                                <span className="text-[10px] font-bold text-gray-700 whitespace-pre-wrap">{settings?.payments?.bankInfo || "Bank details here"}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-primary/10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Payment Method</label>
                                                    <select 
                                                        className="w-full bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                                                        value={advanceMethod}
                                                        onChange={(e) => setAdvanceMethod(e.target.value)}
                                                    >
                                                        <option value="bkash">bKash</option>
                                                        <option value="nagad">Nagad</option>
                                                        <option value="rocket">Rocket</option>
                                                        <option value="bank">Bank Transfer</option>
                                                        <option value="others">Others</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">TxnID / Last 4 Digits (Optional)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter TxnID or Last 4 digits"
                                                        className="w-full bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                                                        value={advanceTxnId}
                                                        onChange={(e) => setAdvanceTxnId(e.target.value.toUpperCase())}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Side: Order Summary */}
                <div className="lg:w-1/3">
                    <div className="sticky top-8 space-y-6">
                        <div className="bg-dark text-white p-8 rounded-[2rem] shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10"></div>

                            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10">
                                <BsBagCheck className="text-secondary" /> Summary
                            </h2>

                            <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-medium">
                                            <span className="text-white font-black">x{item.quantity}</span> {item.title}
                                            {item.discountPrice && (
                                                <span className="ml-2 text-[10px] line-through opacity-50 font-bold">৳{item.price * item.quantity}</span>
                                            )}
                                        </span>
                                        <span className="font-black">৳{(item.discountPrice || item.price) * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon Input */}
                            <div className="mb-8 p-1.5 bg-white/10 rounded-2xl flex relative z-10">
                                <input
                                    type="text"
                                    placeholder="COUPON CODE"
                                    className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest px-4 py-3 flex-1 placeholder:text-gray-500"
                                    value={couponCode}
                                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                    disabled={!!appliedCoupon}
                                />
                                {appliedCoupon ? (
                                    <button
                                        onClick={removeCoupon}
                                        className="bg-red-500/20 text-red-400 px-4 rounded-xl hover:bg-red-500/30 transition-all"
                                    >
                                        <BsX size={20} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={isValidating || !couponCode}
                                        className="bg-secondary text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                                    >
                                        {isValidating ? '...' : 'Apply'}
                                    </button>
                                )}
                            </div>

                            {appliedCoupon && (
                                <div className="mb-8 flex items-center gap-2 bg-green-500/10 text-green-400 p-4 rounded-2xl border border-green-500/20 relative z-10 animate-bounce-subtle">
                                    <BsTag size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        Coupon "{appliedCoupon.code}" active!
                                    </span>
                                </div>
                            )}

                            <div className="space-y-4 pt-8 border-t border-white/10 relative z-10 font-bold text-sm">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal (Raw)</span>
                                    <span>৳{Number(cartSubtotal)}</span>
                                </div>
                                {Number(productDiscountTotal) > 0 && (
                                    <div className="flex justify-between text-green-400 text-xs">
                                        <span>Product Discount</span>
                                        <span>-৳{Number(productDiscountTotal)}</span>
                                    </div>
                                )}
                                {Number(discountAmount) > 0 && (
                                    <div className="flex justify-between text-green-400 text-xs">
                                        <span>Coupon Discount</span>
                                        <span>-৳{Number(discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-400">
                                    <span>Shipping ({location === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
                                    <span className="text-secondary font-black">৳{location === 'inside' ? (settings?.payments?.insideDhakaCharge || 100) : (settings?.payments?.outsideDhakaCharge || 150)}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black pt-5 border-t border-white/20 mt-4 text-white uppercase">
                                    <span>Total Payable</span>
                                    <span className="text-secondary tracking-tight">৳{Number(cartTotal) - Number(discountAmount) + (location === 'inside' ? (settings?.payments?.insideDhakaCharge || 100) : (settings?.payments?.outsideDhakaCharge || 150))}</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 mt-2">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                                        {payFull 
                                            ? `Pay ৳${Number(cartTotal) - Number(discountAmount) + (location === 'inside' ? (settings?.payments?.insideDhakaCharge || 100) : (settings?.payments?.outsideDhakaCharge || 150))} now to confirm` 
                                            : `Pay ৳${location === 'inside' ? (settings?.payments?.insideDhakaCharge || 100) : (settings?.payments?.outsideDhakaCharge || 150)} in advance to confirm`
                                        }
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit" form="checkout-form" disabled={loading}
                                className="w-full bg-secondary text-white py-5 rounded-[1.5rem] mt-8 hover:bg-red-700 transition-all font-black uppercase text-xs tracking-[0.2em] shadow-2xl disabled:opacity-50 shadow-secondary/20 relative z-10"
                            >
                                {loading ? "Processing..." : "Confirm order"}
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                <BsShieldCheck size={24} />
                            </div>
                            <div>
                                <div className="font-black text-gray-900 text-sm">Secure Checkout</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">SSL Encrypted Transaction</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Checkout Success Modal */}
            {showSuccess && placedOrder && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-dark/80 backdrop-blur-md" />
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl p-8 text-center">
                        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BsCheck2Circle size={60} />
                        </div>

                        <h2 className="text-3xl font-black text-gray-900 mb-2">Order Placed!</h2>
                        <p className="text-gray-500 font-medium mb-8">We've received your order and will start processing it soon.</p>

                        <div className="bg-gray-50 rounded-3xl p-6 mb-8 text-left space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Order Number</span>
                                <span className="text-gray-900 font-black">#{placedOrder.orderNumber}</span>
                            </div>
                            <div className="border-t border-gray-100 my-2 pt-2 space-y-2">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest">Subtotal (Raw)</span>
                                    <span className="text-gray-900 font-bold">৳{Number(placedOrder.subtotal)}</span>
                                </div>
                                {Number(placedOrder.discounts?.product) > 0 && (
                                    <div className="flex justify-between text-[11px] text-green-600">
                                        <span className="font-bold uppercase tracking-widest">Product Discount</span>
                                        <span className="font-bold">-৳{Number(placedOrder.discounts.product)}</span>
                                    </div>
                                )}
                                {Number(placedOrder.discounts?.coupon) > 0 && (
                                    <div className="flex justify-between text-[11px] text-green-600">
                                        <span className="font-bold uppercase tracking-widest">Coupon Discount</span>
                                        <span className="font-bold">-৳{Number(placedOrder.discounts.coupon)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest">Delivery Charge</span>
                                    <span className="text-gray-900 font-bold">৳{Number(placedOrder.deliveryCharge)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                                <span className="text-gray-900 font-black uppercase tracking-tighter">Final Amount</span>
                                <span className="text-primary font-black">৳{Number(placedOrder.finalAmount)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate(`/orders/${placedOrder.orderId}`)}
                                className="bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all"
                            >
                                View Order
                            </button>
                            <button
                                onClick={() => navigate("/shop")}
                                className="bg-primary text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;
