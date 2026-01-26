import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { createOrder } from "../../utils/dbServices";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: currentUser?.displayName || "", // Use display name if available? Actually auth context doesn't expose display name update easily here without refetch, but we can assume user fills it.
        // Better to just let them type or prefill if we stored profile in DB context.
        // For MVP, just manual entry with init blank or context email.
        email: currentUser?.email || "",
        phone: "",
        address: "",
        city: "",
        zip: ""
    });

    const [paymentMethod, setPaymentMethod] = useState("COD");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const orderData = {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                items: cart,
                shippingDetails: formData,
                paymentMethod,
                totalAmount: cartTotal + 50 // Shipping Sim
            };

            await createOrder(orderData);
            clearCart();
            alert("Order placed successfully!");
            navigate("/profile");
        } catch (error) {
            alert("Failed to place order. Please try again.");
            console.error(error);
        }
        setLoading(false);
    };

    if (cart.length === 0) {
        navigate("/cart");
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Checkout</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Shipping Details */}
                <div className="md:w-2/3 bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text" name="name" placeholder="Full Name" required
                                className="w-full border p-2 rounded"
                                value={formData.name} onChange={handleChange}
                            />
                            <input
                                type="text" name="phone" placeholder="Phone Number" required
                                className="w-full border p-2 rounded"
                                value={formData.phone} onChange={handleChange}
                            />
                        </div>
                        <input
                            type="email" name="email" placeholder="Email Address" required readOnly
                            className="w-full border p-2 rounded bg-gray-100"
                            value={formData.email} onChange={handleChange}
                        />
                        <input
                            type="text" name="address" placeholder="Address" required
                            className="w-full border p-2 rounded"
                            value={formData.address} onChange={handleChange}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text" name="city" placeholder="City" required
                                className="w-full border p-2 rounded"
                                value={formData.city} onChange={handleChange}
                            />
                            <input
                                type="text" name="zip" placeholder="Zip Code" required
                                className="w-full border p-2 rounded"
                                value={formData.zip} onChange={handleChange}
                            />
                        </div>

                        <div className="mt-6">
                            <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 border p-3 rounded cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio" name="payment" value="COD"
                                        checked={paymentMethod === "COD"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <span>Cash on Delivery (COD)</span>
                                </label>
                                <label className="flex items-center gap-2 border p-3 rounded cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio" name="payment" value="ONLINE"
                                        checked={paymentMethod === "ONLINE"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <span>Online Payment (Credit Card / Mobile Banking)</span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Order Summary */}
                <div className="md:w-1/3">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.quantity} x {item.title}</span>
                                    <span>৳{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-2 space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>৳{cartTotal}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>৳50</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                                <span>Total</span>
                                <span>৳{cartTotal + 50}</span>
                            </div>
                        </div>

                        <button
                            type="submit" form="checkout-form" disabled={loading}
                            className="w-full bg-primary text-white py-3 rounded-lg mt-6 hover:bg-green-700 transition font-bold disabled:opacity-50"
                        >
                            {loading ? "Placing Order..." : "Place Order"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
