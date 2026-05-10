import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import { BsTrash, BsPlus, BsDash } from "react-icons/bs";

const Cart = () => {
    const { cart, addToCart, removeFromCart, updateQuantity, updateVariant, cartTotal, cartSubtotal, productDiscountTotal } = useCart();
    const { settings } = useSettings();
    const shippingFee = settings?.payments?.insideDhakaCharge || 100;

    // --- GROUPING ALGORITHM (Strict Sets of 3) ---
    const fashionItems = cart.filter(i => i.category?.toLowerCase()?.includes("fashion"));
    const nonFashionItems = cart.filter(i => !i.category?.toLowerCase()?.includes("fashion"));

    // Partition fashion items into groups of 3
    const fashionGroups = [];
    for (let i = 0; i < fashionItems.length; i += 3) {
        fashionGroups.push({
            id: Math.floor(i / 3) + 1,
            name: `Group ${String.fromCharCode(65 + Math.floor(i / 3))}`, // Group A, B, C...
            items: fashionItems.slice(i, i + 3)
        });
    }

    const handleSmartSizeChange = (item, newSize) => {
        if (!item.category?.toLowerCase()?.includes("fashion")) {
            updateVariant(item.variantKey, { ...item.selectedVariations, size: newSize });
            return;
        }

        // Find which group this item belongs to
        const groupIndex = fashionGroups.findIndex(g => g.items.some(i => i.variantKey === item.variantKey));
        const group = fashionGroups[groupIndex];
        const oldSize = item.selectedVariations?.size || "";

        if (oldSize.toLowerCase() === newSize.toLowerCase()) return;

        // Check for conflict ONLY inside this specific group
        const conflictingItem = group.items.find(i => 
            i.variantKey !== item.variantKey && 
            i.selectedVariations?.size?.trim()?.toLowerCase() === newSize.trim().toLowerCase()
        );

        if (conflictingItem) {
            // SWAP: Keeping Group Uniqueness
            updateVariant(item.variantKey, { ...item.selectedVariations, size: newSize });
            updateVariant(conflictingItem.variantKey, { ...conflictingItem.selectedVariations, size: oldSize });
        } else {
            updateVariant(item.variantKey, { ...item.selectedVariations, size: newSize });
        }
    };

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
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tighter uppercase">Shopping Bag</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Cart Items */}
                <div className="lg:w-2/3 space-y-8">
                    {/* Fashion Groups Section */}
                    {fashionGroups.map((group) => (
                        <div key={group.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50/50 px-8 py-4 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="bg-dark text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                        {group.name}
                                    </span>
                                    <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Bulk Fashion Set</h3>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${group.items.length === 3 ? 'text-green-600' : 'text-primary animate-pulse'}`}>
                                    {group.items.length}/3 Slots Used
                                </span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {group.items.map((item) => (
                                    <div key={item.variantKey} className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 group">
                                        <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                        </div>
                                        
                                        <div className="flex-grow text-center md:text-left">
                                            <h3 className="font-black text-gray-900 text-sm line-clamp-1 mb-2 tracking-tight">{item.title}</h3>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                                                {item.variations?.sizes?.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Group Size Slot</span>
                                                        <select 
                                                            className="text-[10px] bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl font-black text-gray-900 uppercase focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                                                            value={item.selectedVariations?.size || ""}
                                                            onChange={(e) => handleSmartSizeChange(item, e.target.value)}
                                                        >
                                                            {item.variations.sizes.map(s => {
                                                                const isTakenInGroup = group.items.some(gi => 
                                                                    gi.variantKey !== item.variantKey && 
                                                                    gi.selectedVariations?.size?.trim()?.toLowerCase() === s.trim().toLowerCase()
                                                                );
                                                                return <option key={s} value={s} disabled={isTakenInGroup}>{s} {isTakenInGroup ? "(Group Lock)" : ""}</option>
                                                            })}
                                                        </select>
                                                    </div>
                                                )}
                                                {item.variations?.colors?.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Color</span>
                                                        <select 
                                                            className="text-[10px] bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl font-black text-gray-900 uppercase focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                                                            value={item.selectedVariations?.color || ""}
                                                            onChange={(e) => updateVariant(item.variantKey, { ...item.selectedVariations, color: e.target.value })}
                                                        >
                                                            {item.variations.colors.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-4 bg-gray-50 p-1 rounded-2xl">
                                                <button onClick={() => removeFromCart(item.variantKey)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-secondary hover:bg-secondary hover:text-white transition-all active:scale-95">
                                                    <BsDash size={20} />
                                                </button>
                                                <span className="font-black text-lg w-6 text-center">1</span>
                                                <button
                                                    onClick={() => {
                                                        const availableSizes = item.variations?.sizes || [];
                                                        const takenInGroup = group.items.map(i => i.selectedVariations?.size?.trim()?.toLowerCase());
                                                        const nextSize = availableSizes.find(s => !takenInGroup.includes(s.trim().toLowerCase())) || availableSizes[0];
                                                        addToCart(item, { ...item.selectedVariations, size: nextSize });
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:text-primary transition-all active:scale-95"
                                                >
                                                    <BsPlus size={20} />
                                                </button>
                                            </div>
                                            <div className="text-right min-w-[100px]">
                                                <p className="font-black text-gray-900">৳{item.discountPrice || item.price}</p>
                                                <button onClick={() => removeFromCart(item.variantKey)} className="text-[9px] font-black text-red-400 uppercase tracking-widest mt-1 hover:underline">Remove Item</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Non-Fashion Items */}
                    {nonFashionItems.length > 0 && (
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mt-8">
                            <div className="bg-gray-50/50 px-8 py-4 border-b border-gray-100">
                                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">General Merchandise</h3>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {nonFashionItems.map((item) => (
                                    <div key={item.variantKey} className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 group">
                                        <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-black text-gray-900 text-sm mb-1">{item.title}</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.category}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-4 bg-gray-50 p-1 rounded-2xl">
                                                <button onClick={() => updateQuantity(item.variantKey, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:text-secondary transition-all">
                                                    <BsDash size={20} />
                                                </button>
                                                <span className="font-black text-lg w-6 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.variantKey, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:text-primary transition-all">
                                                    <BsPlus size={20} />
                                                </button>
                                            </div>
                                            <div className="text-right min-w-[80px]">
                                                <p className="font-black text-gray-900">৳{(item.discountPrice || item.price) * item.quantity}</p>
                                                <button onClick={() => removeFromCart(item.variantKey)} className="text-[9px] font-black text-red-400 uppercase tracking-widest mt-1 hover:underline">Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Summary */}
                <div className="lg:w-1/3">
                    <div className="bg-dark text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-8">
                        <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Order Summary</h2>
                        
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-gray-400 font-bold text-sm">
                                <span>Bag Subtotal</span>
                                <span>৳{Number(cartSubtotal)}</span>
                            </div>
                            {Number(productDiscountTotal) > 0 && (
                                <div className="flex justify-between text-green-400 font-bold text-sm">
                                    <span>Instant Savings</span>
                                    <span>-৳{Number(productDiscountTotal)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-400 font-bold text-sm">
                                <span>Delivery Fee</span>
                                <span className="text-white">৳{shippingFee}</span>
                            </div>
                            <div className="border-t border-white/10 pt-6 flex justify-between items-baseline">
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Estimated Total</span>
                                <span className="text-3xl font-black text-secondary tracking-tighter">৳{Number(cartSubtotal) - Number(productDiscountTotal) + shippingFee}</span>
                            </div>
                        </div>

                        {/* Multiples of 3 & Size Variety Rule for Fashion */}
                        {(() => {
                            const fashionCount = fashionItems.length;
                            const hasFashion = fashionCount > 0;
                            
                            // 1. Multiple of 3 Rule
                            const isMultipleOf3 = fashionCount >= 3 && fashionCount % 3 === 0;
                            
                            // 2. Size Variety Rule: Each group must have unique sizes
                            let hasSizeViolation = false;
                            fashionGroups.forEach(group => {
                                const sizes = group.items.map(i => i.selectedVariations?.size?.trim()?.toLowerCase());
                                const uniqueSizes = new Set(sizes);
                                if (uniqueSizes.size !== sizes.length) {
                                    hasSizeViolation = true;
                                }
                            });
                            
                            const isRequirementMet = !hasFashion || (isMultipleOf3 && !hasSizeViolation);
                            
                            const nextMultiple = Math.ceil(fashionCount / 3) * 3;
                            const needed = nextMultiple === 0 ? 3 : (nextMultiple - fashionCount);
                            const displayNeeded = fashionCount < 3 ? 3 - fashionCount : (needed === 0 ? 0 : needed);

                            return (
                                <div className="mt-8 border-t border-white/10 pt-8">
                                    {hasFashion && !isMultipleOf3 && (
                                        <div className="mb-4 p-5 bg-white/5 border border-white/10 rounded-3xl animate-pulse">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-secondary text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-secondary/20">
                                                    {displayNeeded}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantity Requirement</p>
                                                    <p className="text-xs font-bold text-gray-200">
                                                        {fashionCount < 3 
                                                            ? `Add ${3 - fashionCount} more items to meet our logistics requirement.`
                                                            : `Add ${needed} more items to complete your set of 3.`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {hasFashion && hasSizeViolation && (
                                        <div className="mb-4 p-5 bg-red-500/10 border border-red-500/20 rounded-3xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                                                    !
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Variety Requirement</p>
                                                    <p className="text-xs font-bold text-red-100">
                                                        One of your groups has duplicate sizes. Each set of 3 must have unique sizes.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isRequirementMet ? (
                                        <Link
                                            to="/checkout"
                                            className="block w-full bg-secondary text-white text-center py-5 rounded-[1.5rem] hover:bg-red-700 transition-all font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-secondary/20"
                                        >
                                            Confirm & Checkout
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            className="block w-full bg-white/5 text-gray-600 text-center py-5 rounded-[1.5rem] cursor-not-allowed font-black uppercase text-xs tracking-[0.2em] border border-white/5"
                                        >
                                            Locked (Check Requirements)
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
