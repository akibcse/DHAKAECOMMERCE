import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { BsX, BsCartCheck, BsBagCheck, BsPlus, BsDash } from "react-icons/bs";

const AddToCartModal = () => {
    const { 
        isCartModalOpen, 
        setIsCartModalOpen, 
        lastAddedProduct, 
        lastAddedVariantKey,
        lastAddedVariations,
        addToCart,
        updateQuantity, 
        cart 
    } = useCart();

    if (!lastAddedProduct) return null;

    // For non-fashion, we find the specific item to show its quantity
    const isFashion = lastAddedProduct.category === "Fashion";
    const cartItem = !isFashion ? cart.find(item => item.variantKey === lastAddedVariantKey) : null;
    const quantity = cartItem ? cartItem.quantity : 1;

    // For fashion, we count how many of THIS product are in the cart
    const fashionInstances = isFashion ? cart.filter(item => item.id === lastAddedProduct.id) : [];
    const displayCount = isFashion ? fashionInstances.length : quantity;

    return (
        <AnimatePresence>
            {isCartModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartModalOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-white w-full max-w-md rounded-t-[2rem] md:rounded-2xl overflow-hidden shadow-2xl"
                    >
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
                                <h3 className="text-xl font-black text-gray-900 tracking-tighter">Added to Cart!</h3>
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
                                    <h4 className="font-black text-gray-900 line-clamp-2 mb-1 text-sm">{lastAddedProduct.title}</h4>
                                    
                                    <div className="flex flex-col mb-1">
                                        <p className="text-primary font-black text-xl">৳{Number(lastAddedProduct.discountPrice || lastAddedProduct.price)}</p>
                                        {lastAddedProduct.selectedVariations?.size && (
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                                Size: {lastAddedProduct.selectedVariations.size}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 mt-4 bg-gray-50 w-fit p-1 rounded-xl">
                                        <button
                                            onClick={() => {
                                                if (!isFashion && lastAddedVariantKey) {
                                                    updateQuantity(lastAddedVariantKey, Math.max(1, quantity - 1));
                                                }
                                            }}
                                            disabled={isFashion}
                                            className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-primary font-black shadow-sm active:scale-95 transition-all disabled:opacity-30"
                                        >
                                            <BsDash size={18} />
                                        </button>
                                        <span className="font-black w-8 text-center text-lg">{displayCount}</span>
                                        <button
                                            onClick={() => {
                                                if (isFashion) {
                                                    addToCart(lastAddedProduct, lastAddedVariations);
                                                } else if (lastAddedVariantKey) {
                                                    updateQuantity(lastAddedVariantKey, quantity + 1);
                                                }
                                            }}
                                            className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-primary font-black shadow-sm active:scale-95 transition-all"
                                        >
                                            <BsPlus size={18} />
                                        </button>
                                    </div>
                                    {isFashion && (
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-2 ml-1">
                                            Fashion Mode: + adds another set
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <Link
                                    to="/cart"
                                    onClick={() => setIsCartModalOpen(false)}
                                    className="flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-700 transition shadow-xl shadow-primary/20"
                                >
                                    <BsBagCheck size={20} />
                                    Review & Checkout
                                </Link>
                                <button
                                    onClick={() => setIsCartModalOpen(false)}
                                    className="bg-gray-100 text-gray-700 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition"
                                >
                                    Add More Items
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
