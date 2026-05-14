import { motion } from 'framer-motion';
import { BsCartPlus, BsLightningCharge } from 'react-icons/bs';

const StickyCTA = ({ product, onAddToCart, onBuyNow, disabled }) => {
    return (
        <motion.div 
            initial={{ translateY: 100 }}
            animate={{ translateY: 0 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 pb-8 shadow-2xl shadow-gray-900/10"
        >
            <div className="flex items-center gap-4 max-w-lg mx-auto">
                <div className="flex flex-col min-w-[80px]">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                    <span className="text-lg font-black text-primary tracking-tighter">৳{product.discountPrice || product.price}</span>
                </div>
                <button 
                    onClick={onAddToCart}
                    disabled={disabled}
                    className="flex-1 bg-gray-100 text-gray-900 py-4 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
                >
                    <BsCartPlus size={22} />
                </button>
                <button 
                    onClick={onBuyNow}
                    disabled={disabled}
                    className="flex-[3] bg-primary text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-green-100 transition-all active:scale-95 disabled:opacity-30"
                >
                    <BsLightningCharge size={18} /> Buy Now
                </button>
            </div>
        </motion.div>
    );
};

export default StickyCTA;
