import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { BsX, BsCartCheck, BsBagCheck } from "react-icons/bs";

const AddToCartModal = () => {
    const { isCartModalOpen, setIsCartModalOpen, lastAddedProduct, updateQuantity, cart } = useCart();

    if (!lastAddedProduct) return null;

    const cartItem = cart.find(item => item.id === lastAddedProduct.id);
    const quantity = cartItem ? cartItem.quantity : 1;

    return (
        <AnimatePresence>
            {isCartModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartModalOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-white w-full max-w-md rounded-t-[2rem] md:rounded-2xl overflow-hidden shadow-2xl"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsCartModalOpen(false)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-10"
                        >
                            <BsX size={24} />
                        </button>

                        <div className="p-6 pt-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-green-100 text-primary p-2 rounded-full">
                                    <BsCartCheck size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Added to Cart!</h3>
                            </div>

                            <div className="flex gap-4 mb-8">
                                <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                    <img
                                        src={lastAddedProduct.image || "https://via.placeholder.com/150"}
                                        alt={lastAddedProduct.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-bold text-gray-800 line-clamp-2 mb-1">{lastAddedProduct.title}</h4>
                                    <div className="flex flex-col mb-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-primary font-black text-2xl">৳{Number(lastAddedProduct.discountPrice || lastAddedProduct.price) * quantity}</span>
                                            {quantity > 1 && (
                                                <span className="text-gray-400 text-xs font-bold">(Total)</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                                                Unit: ৳{Number(lastAddedProduct.discountPrice || lastAddedProduct.price)}
                                            </span>
                                            {lastAddedProduct.discountPrice && Number(lastAddedProduct.discountPrice) < Number(lastAddedProduct.price) && (
                                                <span className="text-[10px] text-gray-400 line-through font-bold">
                                                    ৳{Number(lastAddedProduct.price)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-4 bg-gray-50 w-fit p-1 rounded-xl">
                                        <button
                                            onClick={() => updateQuantity(lastAddedProduct.id, Math.max(1, quantity - 1))}
                                            className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-primary font-black shadow-sm active:scale-95 transition-all"
                                        >
                                            -
                                        </button>
                                        <span className="font-black w-8 text-center text-lg">{quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(lastAddedProduct.id, quantity + 1)}
                                            className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-primary font-black shadow-sm active:scale-95 transition-all"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <Link
                                    to="/cart"
                                    onClick={() => setIsCartModalOpen(false)}
                                    className="flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg"
                                >
                                    <BsBagCheck size={20} />
                                    Go to Cart
                                </Link>
                                <button
                                    onClick={() => setIsCartModalOpen(false)}
                                    className="bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddToCartModal;
