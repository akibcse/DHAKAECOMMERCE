import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProducts } from "../../utils/dbServices";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { BsCartPlus, BsLightningCharge, BsArrowLeft, BsTruck, BsShieldCheck, BsArrowRepeat } from "react-icons/bs";
import AIRecommendations from "../../components/AIRecommendations";
import ProductSEO from "../../components/common/ProductSEO";
import ShareButtons from "../../components/ShareButtons";
import { toast } from "react-hot-toast";

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

            // --- GROUP-BASED VARIETY LOGIC ---
            if (found?.variations?.sizes?.length > 0) {
                const isFashionProduct = found.category?.toLowerCase()?.includes("fashion");
                
                if (isFashionProduct) {
                    const fashionItems = cart.filter(i => i.category?.toLowerCase()?.includes("fashion"));
                    
                    // Determine which group the NEXT item will join
                    const currentGroupIndex = Math.floor(fashionItems.length / 3);
                    const itemsInCurrentGroup = fashionItems.slice(currentGroupIndex * 3, (currentGroupIndex + 1) * 3);
                    
                    const takenSizesInGroup = itemsInCurrentGroup.map(i => 
                        i.selectedVariations?.size?.trim()?.toLowerCase() || "n/a"
                    );

                    const availableSizes = found.variations.sizes;
                    // Auto-pick a size that isn't taken in the CURRENT group
                    const smartSize = availableSizes.find(s => 
                        !takenSizesInGroup.includes(s.trim().toLowerCase())
                    ) || availableSizes[0];
                    
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

        // Check for Variety Rule Violation (GROUP-BASED)
        const isFashionProduct = product.category?.toLowerCase()?.includes("fashion");
        if (isFashionProduct && selectedSize) {
            const fashionItems = cart.filter(i => i.category?.toLowerCase()?.includes("fashion"));
            const currentGroupIndex = Math.floor(fashionItems.length / 3);
            const itemsInCurrentGroup = fashionItems.slice(currentGroupIndex * 3, (currentGroupIndex + 1) * 3);
            
            const normalizedSelected = selectedSize.trim().toLowerCase();
            const isDuplicateInGroup = itemsInCurrentGroup.some(i => 
                i.selectedVariations?.size?.trim()?.toLowerCase() === normalizedSelected
            );

            if (isDuplicateInGroup) {
                toast.error(`This size is already selected in the current group of 3.`);
                return;
            }
        }

        addToCart(product, { size: selectedSize, color: selectedColor });
        toast.success("Added to cart!");
    };

    const handleBuyNow = () => {
        if (product.variations?.sizes?.length > 0 && !selectedSize) {
            toast.error("Please select a size");
            return;
        }
        if (product.variations?.colors?.length > 0 && !selectedColor) {
            toast.error("Please select a color");
            return;
        }

        // Check for Variety Rule Violation (GROUP-BASED)
        const isFashionProductBuyNow = product.category?.toLowerCase()?.includes("fashion");
        if (isFashionProductBuyNow && selectedSize) {
            const fashionItems = cart.filter(i => i.category?.toLowerCase()?.includes("fashion"));
            const currentGroupIndex = Math.floor(fashionItems.length / 3);
            const itemsInCurrentGroup = fashionItems.slice(currentGroupIndex * 3, (currentGroupIndex + 1) * 3);
            
            const normalizedSelected = selectedSize.trim().toLowerCase();
            const isDuplicateInGroup = itemsInCurrentGroup.some(i => 
                i.selectedVariations?.size?.trim()?.toLowerCase() === normalizedSelected
            );

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

    if (loading) return <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest animate-pulse">Scanning Inventory...</div>;
    if (!product) return <div className="text-center py-20 font-black text-gray-300 uppercase">Product Disappeared</div>;

    return (
        <div className="pb-24 md:pb-8">
            <ProductSEO product={product} />

            <button onClick={() => navigate(-1)} className="md:hidden mb-4 flex items-center gap-2 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-primary transition-colors">
                <BsArrowLeft size={16} /> Back
            </button>

            <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="md:flex">
                    <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-4 md:p-12">
                        <div className="aspect-square w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 overflow-hidden flex items-center justify-center p-8">
                            <img className="max-h-full max-w-full object-contain hover:scale-110 transition duration-700" src={product.image || "https://via.placeholder.com/500"} alt={product.title} />
                        </div>
                    </div>

                    <div className="p-8 md:p-16 md:w-1/2 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="uppercase tracking-[0.2em] text-[9px] bg-dark text-white px-3 py-1 rounded-full font-black">
                                {product.category}
                            </span>
                            {product.category?.toLowerCase()?.includes("fashion") && (
                                <span className="text-[9px] bg-secondary text-white px-3 py-1 rounded-full font-black animate-pulse">
                                    Adding to Set {String.fromCharCode(65 + Math.floor(cart.filter(i => i.category?.toLowerCase()?.includes("fashion")).length / 3))}
                                </span>
                            )}
                            {product.stock > 0 ? (
                                <span className="text-[9px] text-green-600 font-black uppercase tracking-[0.2em] border border-green-100 px-3 py-1 rounded-full bg-green-50/50">
                                    Available ({product.stock})
                                </span>
                            ) : (
                                <span className="text-[9px] text-red-500 font-black uppercase tracking-[0.2em] border border-red-100 px-3 py-1 rounded-full bg-red-50/50">
                                    Sold Out
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight tracking-tighter">{product.title}</h1>
                        
                        <div className="flex items-center gap-6 mb-10">
                            {product.discountPrice ? (
                                <>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Current Price</span>
                                        <p className="text-primary text-4xl font-black tracking-tighter">৳{product.discountPrice}</p>
                                    </div>
                                    <div className="flex flex-col opacity-30">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Was</span>
                                        <p className="text-gray-900 text-2xl font-black line-through tracking-tighter">৳{product.price}</p>
                                    </div>
                                    <div className="bg-secondary text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-bounce-subtle">
                                        Save ৳{product.price - product.discountPrice}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Price</span>
                                    <p className="text-primary text-4xl font-black tracking-tighter">৳{product.price}</p>
                                </div>
                            )}
                        </div>

                        <div className="prose prose-sm text-gray-500 mb-10 max-w-none font-medium leading-relaxed">
                            <p>{product.description}</p>
                        </div>

                        {/* Dropdown Selectors */}
                        <div className="space-y-8 mb-10 border-t border-b border-gray-50 py-10">
                            {product.variations?.sizes?.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Select Size Specification</label>
                                    <select 
                                        value={selectedSize} 
                                        onChange={(e) => setSelectedSize(e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-widest appearance-none cursor-pointer"
                                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 1.5rem center", backgroundSize: "1.2em" }}
                                    >
                                        {product.variations.sizes.map(size => {
                                            const isFashionProduct = product.category?.toLowerCase()?.includes("fashion");
                                            let isDisabled = false;
                                            
                                            if (isFashionProduct) {
                                                const fashionItems = cart.filter(i => i.category?.toLowerCase()?.includes("fashion"));
                                                const currentGroupIndex = Math.floor(fashionItems.length / 3);
                                                const itemsInCurrentGroup = fashionItems.slice(currentGroupIndex * 3, (currentGroupIndex + 1) * 3);
                                                
                                                const normalized = size.trim().toLowerCase();
                                                isDisabled = itemsInCurrentGroup.some(i => 
                                                    i.selectedVariations?.size?.trim()?.toLowerCase() === normalized
                                                );
                                            }

                                            return (
                                                <option key={size} value={size} disabled={isDisabled}>
                                                    {size} {isDisabled ? "(Taken in Group)" : ""}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}

                            {product.variations?.colors?.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Available Colors</label>
                                    <div className="flex flex-wrap gap-3">
                                        {product.variations.colors.map(color => (
                                            <button key={color} onClick={() => setSelectedColor(color)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedColor === color ? 'bg-primary border-primary text-white shadow-xl shadow-green-100' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mb-10">
                            <ShareButtons product={product} />
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            <button onClick={handleAddToCart} disabled={product.stock <= 0} className="flex-1 flex items-center justify-center gap-3 bg-gray-100 text-gray-900 px-8 py-5 rounded-2xl hover:bg-gray-200 transition-all font-black uppercase text-[11px] tracking-[0.2em] disabled:opacity-30">
                                <BsCartPlus size={20} /> Add to Cart
                            </button>
                            <button onClick={handleBuyNow} disabled={product.stock <= 0} className="flex-1 flex items-center justify-center gap-3 bg-primary text-white px-8 py-5 rounded-2xl hover:bg-green-700 transition-all font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-green-100 disabled:opacity-30">
                                <BsLightningCharge size={20} /> Checkout Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-6 z-40">
                <div className="flex items-center gap-4">
                    <button onClick={handleAddToCart} disabled={product.stock <= 0} className="flex-1 bg-gray-100 text-gray-900 py-5 rounded-2xl flex items-center justify-center font-black uppercase text-[10px] tracking-widest disabled:opacity-30">
                        <BsCartPlus size={18} />
                    </button>
                    <button onClick={handleBuyNow} disabled={product.stock <= 0} className="flex-[3] bg-primary text-white py-5 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-green-100 disabled:opacity-30">
                        <BsLightningCharge size={18} /> Buy Now
                    </button>
                </div>
            </div>

            <div className="mt-24 space-y-24">
                <AIRecommendations type="SIMILAR" params={{ productId: id }} title="Style Similarities" />
                <AIRecommendations type="BOUGHT_TOGETHER" params={{ productId: id }} title="Complete the Look" />
            </div>
        </div>
    );
};

export default ProductDetails;
