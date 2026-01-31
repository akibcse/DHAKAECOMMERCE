import { Link } from "react-router-dom";
import { BsCartPlus } from "react-icons/bs";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
        >
            <Link to={`/product/${product.id}`} className="block relative">
                <div className="aspect-square overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                        src={product.image || "https://via.placeholder.com/300"}
                        alt={product.title}
                        loading="lazy"
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-700"
                    />
                </div>
                {product.discountPrice && (
                    <div className="absolute top-3 left-3 bg-secondary text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10 animate-pulse">
                        SALE
                    </div>
                )}
            </Link>

            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] text-primary uppercase font-bold tracking-wider bg-green-50 px-2 py-0.5 rounded">
                        {product.category}
                    </span>
                    {product.stock <= 5 && product.stock > 0 && (
                        <span className="text-[10px] text-secondary font-bold uppercase">Low Stock</span>
                    )}
                </div>

                <Link to={`/product/${product.id}`}>
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[2.5rem] hover:text-primary transition">
                        {product.title}
                    </h3>
                </Link>

                <div className="flex justify-between items-center mt-4">
                    <div className="flex flex-col">
                        {product.discountPrice && Number(product.discountPrice) < Number(product.price) ? (
                            <>
                                <span className="text-lg font-extrabold text-primary">৳{Number(product.discountPrice)}</span>
                                <span className="text-[10px] text-gray-400 line-through font-bold">৳{Number(product.price)}</span>
                            </>
                        ) : (
                            <span className="text-lg font-extrabold text-primary">৳{Number(product.price)}</span>
                        )}
                    </div>
                    <button
                        onClick={() => addToCart(product)}
                        className="bg-primary text-white h-11 w-11 flex items-center justify-center rounded-xl shadow-md active:scale-95 transition-transform"
                        title="Add to Cart"
                        aria-label="Add to Cart"
                    >
                        <BsCartPlus size={22} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
