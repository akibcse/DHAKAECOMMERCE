import { motion } from 'framer-motion';
import { BsCartPlus, BsLightningCharge } from 'react-icons/bs';

const StickyCTA = ({ product, onAddToCart, onBuyNow, disabled }) => {
    return (
        <motion.div 
            initial={{ translateY: 100 }}
            animate={{ translateY: 0 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-gray-100 p-3 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.08)]"
        >
            <div className="flex items-center gap-2 max-w-lg mx-auto pb-2">
                <div className="flex flex-col shrink-0 min-w-[70px] pl-1">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                    <span className="text-lg font-black text-primary tracking-tighter">৳{product.discountPrice || product.price}</span>
                </div>
                <button 
                    onClick={onAddToCart}
                    disabled={disabled}
                    className="w-14 h-14 bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 shrink-0"
                >
                    <BsCartPlus size={22} />
                </button>
                <button 
                    onClick={onBuyNow}
                    disabled={disabled}
                    className="flex-1 bg-primary text-white h-14 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-[0.15em] shadow-xl shadow-green-100 transition-all active:scale-95 disabled:opacity-30"
                >
                    <BsLightningCharge size={18} /> Buy Now
                </button>
            </div>
        </motion.div>
    );
};

export default StickyCTA;
