import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getProducts } from "../../utils/dbServices";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { BsArrowLeft, BsCartPlus, BsLightningCharge, BsHeart } from "react-icons/bs";
import { toast } from "react-hot-toast";

// Components
import ProductSEO from "../../components/common/ProductSEO";
import AIRecommendations from "../../components/AIRecommendations";
import ShareButtons from "../../components/ShareButtons";

// New Redesign Components
import ProductGallery from "../../components/product/ProductGallery";
import ProductInfo from "../../components/product/ProductInfo";
import VariantSelector from "../../components/product/VariantSelector";
import ProductTabs from "../../components/product/ProductTabs";
import StickyCTA from "../../components/product/StickyCTA";

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const { addToCart, cart } = useCart();
    const { currentUser } = useAuth();
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");

    useEffect(() => {
        const fetchProduct = async () => {
            const allProducts = await getProducts();
            const found = allProducts.find(p => p.id === id);
            setProduct(found);

            if (found?.variations?.sizes?.length > 0) {
                const isFashionProduct = found.category?.toLowerCase()?.includes("fashion");
                if (isFashionProduct) {
                    const fashionItems = cart.filter(i => i.category?.toLowerCase()?.includes("fashion"));
                    const currentGroupIndex = Math.floor(fashionItems.length / 3);
                    const itemsInCurrentGroup = fashionItems.slice(currentGroupIndex * 3, (currentGroupIndex + 1) * 3);
                    const takenSizesInGroup = itemsInCurrentGroup.map(i => i.selectedVariations?.size?.trim()?.toLowerCase() || "n/a");
                    const availableSizes = found.variations.sizes;
                    const smartSize = availableSizes.find(s => !takenSizesInGroup.includes(s.trim().toLowerCase())) || availableSizes[0];
                    setSelectedSize(smartSize);
                } else {
                    setSelectedSize(found.variations.sizes[0]);
                }
            }
            if (found?.variations?.colors?.length > 0) {
                setSelectedColor(found.variations.colors[0]);
            }
            setLoading(false);
        };
        fetchProduct();
    }, [id, cart]);

    const handleAddToCart = () => {
        if (product.variations?.sizes?.length > 0 && !selectedSize) {
            toast.error("Please select a size");
            return;
        }
        if (product.variations?.colors?.length > 0 && !selectedColor) {
            toast.error("Please select a color");
            return;
        }

        const isFashionProduct = product.category?.toLowerCase()?.includes("fashion");
        if (isFashionProduct && selectedSize) {
            const fashionItems = cart.filter(i => i.category?.toLowerCase()?.includes("fashion"));
            const currentGroupIndex = Math.floor(fashionItems.length / 3);
            const itemsInCurrentGroup = fashionItems.slice(currentGroupIndex * 3, (currentGroupIndex + 1) * 3);
            const normalizedSelected = selectedSize.trim().toLowerCase();
            const isDuplicateInGroup = itemsInCurrentGroup.some(i => i.selectedVariations?.size?.trim()?.toLowerCase() === normalizedSelected);

            if (isDuplicateInGroup) {
                toast.error(`This size is already selected in the current group of 3.`);
                return;
            }
        }

        addToCart(product, { size: selectedSize, color: selectedColor });
        toast.success("Added to cart!", {
            icon: '🛍️',
            style: { borderRadius: '15px', background: '#333', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
        });
    };

    const handleBuyNow = () => {
        if (product.variations?.sizes?.length > 0 && !selectedSize) {
            toast.error("Please select a size");
            return;
        }
        
        const isFashionProductBuyNow = product.category?.toLowerCase()?.includes("fashion");
        if (isFashionProductBuyNow && selectedSize) {
            const fashionItems = cart.filter(i => i.category?.toLowerCase()?.includes("fashion"));
            const currentGroupIndex = Math.floor(fashionItems.length / 3);
            const itemsInCurrentGroup = fashionItems.slice(currentGroupIndex * 3, (currentGroupIndex + 1) * 3);
            const normalizedSelected = selectedSize.trim().toLowerCase();
            const isDuplicateInGroup = itemsInCurrentGroup.some(i => i.selectedVariations?.size?.trim()?.toLowerCase() === normalizedSelected);
            if (isDuplicateInGroup) {
                toast.error(`This size is already selected in the current group of 3.`);
                return;
            }
        }

        addToCart(product, { size: selectedSize, color: selectedColor });
        if (!currentUser) {
            navigate("/login?redirect=checkout");
        } else {
            navigate("/checkout");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <div className="aspect-square bg-gray-100 animate-pulse rounded-[3rem]" />
                </div>
                <div className="lg:col-span-4 space-y-6">
                    <div className="h-4 w-24 bg-gray-100 animate-pulse rounded-full" />
                    <div className="h-12 w-full bg-gray-100 animate-pulse rounded-2xl" />
                    <div className="h-8 w-32 bg-gray-100 animate-pulse rounded-xl" />
                    <div className="h-48 w-full bg-gray-100 animate-pulse rounded-3xl" />
                    <div className="h-16 w-full bg-gray-900/5 animate-pulse rounded-2xl" />
                </div>
            </div>
        </div>
    );

    if (!product) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6">
            <h1 className="text-4xl font-black text-gray-200 uppercase tracking-tighter">Product Disappeared</h1>
            <button onClick={() => navigate('/')} className="bg-primary text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform">Back to Home</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fafafa] pb-24 md:pb-12">
            <ProductSEO product={product} />

            {/* Top Navigation */}
            <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between bg-transparent">
                <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-primary transition-colors">
                    <div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                        <BsArrowLeft size={16} />
                    </div>
                    Back
                </button>
                <button className="p-3 bg-white rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-all active:scale-90">
                    <BsHeart size={20} />
                </button>
            </nav>

            <main className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                    
                    {/* Left: Product Gallery */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-7 xl:col-span-8"
                    >
                        <ProductGallery image={product.image} gallery={product.gallery} />
                    </motion.div>

                    {/* Right: Product Details */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-5 xl:col-span-4"
                    >
                        <div className="sticky top-8 flex flex-col gap-2">
                            <ProductInfo product={product} cart={cart} />
                            
                            <VariantSelector 
                                product={product} 
                                cart={cart}
                                selectedSize={selectedSize}
                                setSelectedSize={setSelectedSize}
                                selectedColor={selectedColor}
                                setSelectedColor={setSelectedColor}
                            />

                            {/* Desktop CTA */}
                            <div className="hidden md:flex flex-col gap-4 py-6">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={handleAddToCart} 
                                        disabled={product.stock <= 0} 
                                        className="btn-premium flex-1 flex items-center justify-center gap-3 bg-gray-100 text-gray-900 px-8 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em]"
                                    >
                                        <BsCartPlus size={20} /> Add to Cart
                                    </button>
                                    <button 
                                        onClick={handleBuyNow} 
                                        disabled={product.stock <= 0} 
                                        className="btn-premium flex-1 flex items-center justify-center gap-3 bg-primary text-white px-8 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-green-100"
                                    >
                                        <BsLightningCharge size={20} /> Buy Now
                                    </button>
                                </div>
                            </div>

                            <ShareButtons product={product} />
                            
                            <ProductTabs description={product.description} />
                        </div>
                    </motion.div>
                </div>

                {/* Recommendations */}
                <div className="mt-20 space-y-24 border-t border-gray-100 pt-20">
                    <Suspense fallback={<div className="h-96 bg-gray-50 rounded-3xl animate-pulse" />}>
                        <AIRecommendations type="SIMILAR" params={{ productId: id }} title="Style Similarities" />
                    </Suspense>
                    <Suspense fallback={<div className="h-96 bg-gray-50 rounded-3xl animate-pulse" />}>
                        <AIRecommendations type="BOUGHT_TOGETHER" params={{ productId: id }} title="Complete the Look" />
                    </Suspense>
                </div>
            </main>

            {/* Mobile Sticky CTA */}
            <StickyCTA 
                product={product} 
                onAddToCart={handleAddToCart} 
                onBuyNow={handleBuyNow} 
                disabled={product.stock <= 0} 
            />
        </div>
    );
};

export default ProductDetails;

