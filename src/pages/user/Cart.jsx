import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { BsTrash, BsPlus, BsDash } from "react-icons/bs";

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

    if (cart.length === 0) {
        return (
            <div className="text-center py-20">
                <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
                <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
                <Link to="/shop" className="bg-primary text-white px-6 py-3 rounded-full hover:bg-green-700 transition">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Cart</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Cart Items */}
                <div className="lg:w-2/3 space-y-4">
                    {cart.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded" />
                                <div>
                                    <h3 className="font-bold text-gray-800">{item.title}</h3>
                                    <p className="text-gray-500 text-sm">{item.category}</p>
                                    <p className="text-primary font-bold">৳{item.price}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center border rounded">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="px-3 py-1 hover:bg-gray-100"
                                    >
                                        <BsDash />
                                    </button>
                                    <span className="px-3 py-1 font-medium">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="px-3 py-1 hover:bg-gray-100"
                                    >
                                        <BsPlus />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">৳{item.price * item.quantity}</p>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-500 text-sm hover:underline flex items-center gap-1 justify-end mt-1"
                                    >
                                        <BsTrash /> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cart Summary */}
                <div className="lg:w-1/3">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                        <div className="flex justify-between mb-2 text-gray-600">
                            <span>Subtotal</span>
                            <span>৳{cartTotal}</span>
                        </div>
                        <div className="flex justify-between mb-4 text-gray-600">
                            <span>Shipping</span>
                            <span>৳50</span>
                        </div>
                        <div className="border-t pt-4 flex justify-between font-bold text-lg mb-6">
                            <span>Total</span>
                            <span>৳{cartTotal + 50}</span>
                        </div>
                        <Link
                            to="/checkout"
                            className="block w-full bg-primary text-white text-center py-3 rounded-lg hover:bg-green-700 transition font-bold"
                        >
                            Proceed to Checkout
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
