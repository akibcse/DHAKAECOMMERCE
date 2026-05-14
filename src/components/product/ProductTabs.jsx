import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsChevronDown } from 'react-icons/bs';

const ProductTabs = ({ description }) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { title: 'Description', content: description },
        { title: 'Shipping Info', content: 'Fast delivery within Dhaka (24-48h). Nationwide delivery (3-5 days). Cash on delivery available.' },
        { title: 'Return Policy', content: 'Easy 7-day return policy for unused products in original packaging. Quality guarantee.' },
    ];

    return (
        <div className="py-10 border-t border-gray-100">
            <div className="space-y-4">
                {tabs.map((tab, idx) => (
                    <div key={idx} className="border-b border-gray-50 last:border-0">
                        <button 
                            onClick={() => setActiveTab(activeTab === idx ? -1 : idx)}
                            className="w-full py-4 flex justify-between items-center text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 hover:text-primary transition-colors"
                        >
                            {tab.title}
                            <BsChevronDown className={`transition-transform duration-300 ${activeTab === idx ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {activeTab === idx && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pb-6 text-sm text-gray-500 font-medium leading-relaxed prose prose-sm max-w-none">
                                        {tab.content}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductTabs;
