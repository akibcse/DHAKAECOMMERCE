import { motion } from 'framer-motion';
import { BsShieldCheck, BsTruck, BsArrowRepeat, BsStarFill } from 'react-icons/bs';

const ProductInfo = ({ product, cart }) => {
    const isFashion = product.category?.toLowerCase()?.includes("fashion");
    const setLabel = isFashion ? String.fromCharCode(65 + Math.floor(cart.filter(i => i.category?.toLowerCase()?.includes("fashion")).length / 3)) : null;

    return (
        <div className="flex flex-col gap-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                    {product.category}
                </span>
                {isFashion && (
                    <motion.span 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg shadow-red-100"
                    >
                        Adding to Set {setLabel}
                    </motion.span>
                )}
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${product.stock > 0 ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-500 bg-red-50 border-red-100'}`}>
                    {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                </span>
            </div>

            {/* Title & Stats */}
            <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-[0.9] text-gradient">
                    {product.title}
                </h1>
                <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1 text-accent">
                        <BsStarFill /> <BsStarFill /> <BsStarFill /> <BsStarFill /> <BsStarFill className="text-gray-200" />
                        <span className="text-gray-900 ml-1">4.8</span>
                    </div>
                    <span>•</span>
                    <span>1.2k Sold</span>
                    <span>•</span>
                    <span className="text-primary">98% Positive</span>
                </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-4 py-2">
                {product.discountPrice ? (
                    <>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Premium Price</span>
                            <span className="text-5xl font-black text-primary tracking-tighter">৳{product.discountPrice}</span>
                        </div>
                        <div className="flex flex-col pb-1">
                            <span className="text-2xl font-black text-gray-300 line-through tracking-tighter decoration-secondary decoration-2">৳{product.price}</span>
                            <span className="bg-secondary text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md self-start">-{Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</span>
                        <span className="text-5xl font-black text-primary tracking-tighter">৳{product.price}</span>
                    </div>
                )}
            </div>

            {/* Trust Markers */}
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-100">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 bg-gray-50 rounded-2xl text-primary"><BsTruck size={20} /></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Fast Shipping</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 bg-gray-50 rounded-2xl text-primary"><BsShieldCheck size={20} /></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 bg-gray-50 rounded-2xl text-primary"><BsArrowRepeat size={20} /></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">7-Day Returns</span>
                </div>
            </div>
        </div>
    );
};

export default ProductInfo;
