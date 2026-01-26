import { Link } from "react-router-dom";
import { BsCartPlus } from "react-icons/bs";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
            <Link to={`/product/${product.id}`}>
                <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img
                        src={product.image || "https://via.placeholder.com/300"}
                        alt={product.title}
                        className="w-full h-full object-cover transform hover:scale-110 transition duration-500"
                    />
                </div>
            </Link>

            <div className="p-4">
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{product.category}</span>
                <Link to={`/product/${product.id}`}>
                    <h3 className="text-lg font-bold text-gray-800 mt-1 mb-2 hover:text-primary transition truncate">{product.title}</h3>
                </Link>

                <div className="flex justify-between items-center mt-3">
                    <span className="text-xl font-bold text-primary">৳{product.price}</span>
                    <button
                        onClick={() => addToCart(product)}
                        className="bg-gray-100 text-gray-800 p-2 rounded-full hover:bg-primary hover:text-white transition"
                        title="Add to Cart"
                    >
                        <BsCartPlus size={20} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
