import { motion } from 'framer-motion';

const VariantSelector = ({ product, cart, selectedSize, setSelectedSize, selectedColor, setSelectedColor }) => {
    const isFashion = product.category?.toLowerCase()?.includes("fashion");
    
    const sizes = product.variations?.sizes || [];
    const colors = product.variations?.colors || [];

    const isSizeDisabled = (size) => {
        if (!isFashion) return false;
        
        const fashionItems = cart.filter(i => i.category?.toLowerCase()?.includes("fashion"));
        const currentGroupIndex = Math.floor(fashionItems.length / 3);
        const itemsInCurrentGroup = fashionItems.slice(currentGroupIndex * 3, (currentGroupIndex + 1) * 3);
        
        const normalized = size.trim().toLowerCase();
        return itemsInCurrentGroup.some(i => 
            i.selectedVariations?.size?.trim()?.toLowerCase() === normalized
        );
    };

    if (sizes.length === 0 && colors.length === 0) return null;

    return (
        <div className="flex flex-col gap-8 py-6">
            {/* Size Selector */}
            {sizes.length > 0 && (
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Select Size</label>
                        {isFashion && <span className="text-[9px] font-bold text-primary uppercase">Variety Rule Active</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => {
                            const disabled = isSizeDisabled(size);
                            const selected = selectedSize === size;
                            return (
                                <button
                                    key={size}
                                    disabled={disabled}
                                    onClick={() => setSelectedSize(size)}
                                    className={`
                                        px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border-2 transition-all duration-300
                                        ${selected 
                                            ? 'bg-primary border-primary text-white shadow-xl shadow-green-100' 
                                            : disabled 
                                                ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                                                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}
                                    `}
                                >
                                    {size}
                                    {disabled && <span className="block text-[7px] mt-0.5">(Taken)</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Color Selector */}
            {colors.length > 0 && (
                <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Available Colors</label>
                    <div className="flex flex-wrap gap-3">
                        {colors.map((color) => {
                            const selected = selectedColor === color;
                            return (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`
                                        group relative w-12 h-12 rounded-full border-2 transition-all duration-300 p-1
                                        ${selected ? 'border-primary scale-110 shadow-lg' : 'border-transparent hover:border-gray-200'}
                                    `}
                                >
                                    <div 
                                        className="w-full h-full rounded-full shadow-inner"
                                        style={{ backgroundColor: color.toLowerCase() }}
                                        title={color}
                                    />
                                    {selected && (
                                        <motion.div 
                                            layoutId="activeColor"
                                            className="absolute -inset-1 rounded-full border-2 border-primary"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VariantSelector;
