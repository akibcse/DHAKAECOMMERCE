import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProducts } from "../../utils/dbServices";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { BsCartPlus, BsLightningCharge, BsArrowLeft, BsTruck, BsShieldCheck, BsArrowRepeat } from "react-icons/bs";
import AIRecommendations from "../../components/AIRecommendations";

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchProduct = async () => {
            const allProducts = await getProducts();
            const found = allProducts.find(p => p.id === id);
            setProduct(found);
            setLoading(false);
        };
        fetchProduct();
    }, [id]);

    const handleBuyNow = () => {
        addToCart(product);
        if (!currentUser) {
            navigate("/login?redirect=checkout");
        } else {
            navigate("/checkout");
        }
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!product) return <div className="text-center py-20">Product not found.</div>;

    return (
        <div className="pb-24 md:pb-8">
            {/* Back Button for Mobile */}
            <button
                onClick={() => navigate(-1)}
                className="md:hidden mb-4 flex items-center gap-2 text-gray-600 font-medium"
            >
                <BsArrowLeft size={20} /> Back
            </button>

            <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="md:flex">
                    <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-4 md:p-8">
                        <div className="aspect-square w-full max-w-md bg-white rounded-2xl shadow-inner overflow-hidden flex items-center justify-center">
                            <img
                                className="max-h-full max-w-full object-contain hover:scale-110 transition duration-500"
                                src={product.image || "https://via.placeholder.com/500"}
                                alt={product.title}
                            />
                        </div>
                    </div>

                    <div className="p-6 md:p-12 md:w-1/2 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="uppercase tracking-widest text-[10px] bg-secondary text-white px-2 py-0.5 rounded-full font-bold">
                                {product.category}
                            </span>
                            {product.stock > 0 ? (
                                <span className="text-[10px] text-green-600 font-bold border border-green-200 px-2 py-0.5 rounded-full">
                                    In Stock ({product.stock})
                                </span>
                            ) : (
                                <span className="text-[10px] text-red-600 font-bold border border-red-200 px-2 py-0.5 rounded-full">
                                    Out of Stock
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-4">{product.title}</h1>
                        <div className="flex items-center gap-4 mb-6">
                            {product.discountPrice ? (
                                <>
                                    <p className="text-primary text-3xl font-black">৳{product.discountPrice}</p>
                                    <p className="text-gray-400 text-xl font-bold line-through">৳{product.price}</p>
                                    <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest">
                                        Save ৳{product.price - product.discountPrice}
                                    </span>
                                </>
                            ) : (
                                <p className="text-primary text-3xl font-black">৳{product.price}</p>
                            )}
                        </div>

                        <div className="prose prose-sm text-gray-600 mb-8 max-w-none">
                            <p>{product.description}</p>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-4 mt-auto">
                            <button
                                onClick={() => addToCart(product)}
                                disabled={product.stock <= 0}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-6 py-4 rounded-xl hover:bg-gray-200 transition-all font-bold disabled:opacity-50"
                            >
                                <BsCartPlus size={24} /> Add to Cart
                            </button>
                            <button
                                onClick={handleBuyNow}
                                disabled={product.stock <= 0}
                                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-xl hover:bg-green-700 transition-all font-bold shadow-lg shadow-green-100 disabled:opacity-50"
                            >
                                <BsLightningCharge size={24} /> Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Mobile Action Bar */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 z-40">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform disabled:opacity-50"
                    >
                        <BsCartPlus size={22} />
                    </button>
                    <button
                        onClick={handleBuyNow}
                        disabled={product.stock <= 0}
                        className="flex-[3] bg-primary text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-green-100 active:scale-95 transition-transform disabled:opacity-50"
                    >
                        <BsLightningCharge size={22} /> Buy Now
                    </button>
                </div>
            </div>
            {/* AI Recommendations */}
            <div className="mt-12 px-4 md:px-0 space-y-20">
                <AIRecommendations
                    type="SIMILAR"
                    params={{ productId: id }}
                    title="Similar Products"
                />
                <AIRecommendations
                    type="BOUGHT_TOGETHER"
                    params={{ productId: id }}
                    title="Frequently Bought Together"
                />
            </div>
        </div>
    );
};

export default ProductDetails;
