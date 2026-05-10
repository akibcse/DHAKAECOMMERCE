import { useState, useEffect } from "react";
import { getTaxonomy, saveTaxonomy } from "../../utils/dbServices";
import { BsPlus, BsTrash, BsPlusCircle, BsX } from "react-icons/bs";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const Categories = () => {
    const [taxonomy, setTaxonomy] = useState({});
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState("");
    const [newSubCategory, setNewSubCategory] = useState("");
    const [activeCategory, setActiveCategory] = useState(null);

    useEffect(() => {
        fetchTaxonomy();
    }, []);

    const fetchTaxonomy = async () => {
        setLoading(true);
        try {
            const data = await getTaxonomy();
            if (Object.keys(data).length === 0) {
                // Auto-seed defaults if empty
                const defaults = {
                    "Fashion": ["Panjabi", "T-Shirt", "Shirt", "Pant", "Polo", "Shoe", "Watch", "Kids Fashion"],
                    "Electronics": ["Smartphone", "Laptop", "Gadget", "Accessory", "Audio"],
                    "Home": ["Decor", "Kitchen", "Bedding", "Furniture"],
                    "Beauty": ["Skincare", "Fragrance", "Makeup", "Haircare"],
                    "Food": ["Snacks", "Grocery", "Organic", "Beverages"]
                };
                await saveTaxonomy(defaults);
                setTaxonomy(defaults);
            } else {
                setTaxonomy(data);
            }
        } catch (error) {
            toast.error("Failed to fetch categories");
        }
        setLoading(false);
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        const normalized = newCategory.trim();
        if (taxonomy[normalized]) {
            toast.error("Category already exists");
            return;
        }

        const updated = { ...taxonomy, [normalized]: [] };
        try {
            await saveTaxonomy(updated);
            setTaxonomy(updated);
            setNewCategory("");
            toast.success("Category added");
        } catch (error) {
            toast.error("Failed to add category");
        }
    };

    const handleDeleteCategory = async (cat) => {
        if (!window.confirm(`Delete "${cat}" and all its sub-categories?`)) return;
        
        const updated = { ...taxonomy };
        delete updated[cat];
        
        try {
            await saveTaxonomy(updated);
            setTaxonomy(updated);
            if (activeCategory === cat) setActiveCategory(null);
            toast.success("Category removed");
        } catch (error) {
            toast.error("Failed to remove category");
        }
    };

    const handleAddSubCategory = async (cat) => {
        if (!newSubCategory.trim()) return;
        const sub = newSubCategory.trim();
        if (taxonomy[cat].includes(sub)) {
            toast.error("Sub-category already exists");
            return;
        }

        const updated = { ...taxonomy, [cat]: [...taxonomy[cat], sub] };
        try {
            await saveTaxonomy(updated);
            setTaxonomy(updated);
            setNewSubCategory("");
            toast.success("Sub-category added");
        } catch (error) {
            toast.error("Failed to add sub-category");
        }
    };

    const handleDeleteSubCategory = async (cat, sub) => {
        const updated = { ...taxonomy, [cat]: taxonomy[cat].filter(s => s !== sub) };
        try {
            await saveTaxonomy(updated);
            setTaxonomy(updated);
            toast.success("Sub-category removed");
        } catch (error) {
            toast.error("Failed to remove sub-category");
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Category Manager</h1>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Manage product taxonomy and sub-segments</p>
            </div>

            {/* Add Main Category */}
            <div className="flex gap-4 mb-12 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <input 
                    type="text" 
                    placeholder="New Category Name (e.g. Fashion)" 
                    className="flex-grow bg-white border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm uppercase tracking-widest"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                />
                <button 
                    onClick={handleAddCategory}
                    className="bg-dark text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition flex items-center gap-2"
                >
                    <BsPlusCircle size={18} /> Add Category
                </button>
            </div>

            {/* Category List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.keys(taxonomy).map((cat) => (
                    <motion.div 
                        key={cat}
                        layout
                        className={`p-6 rounded-[2rem] border transition-all ${activeCategory === cat ? 'border-primary bg-green-50/20' : 'border-gray-100 hover:border-gray-200'}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">{cat}</h3>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                                className="text-red-400 hover:text-red-600 transition"
                            >
                                <BsTrash size={16} />
                            </button>
                        </div>

                        {/* Sub Categories */}
                        <div className="space-y-2 mb-6">
                            {taxonomy[cat].map(sub => (
                                <div key={sub} className="flex justify-between items-center bg-white px-4 py-2 rounded-xl text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-50">
                                    <span>{sub}</span>
                                    <button onClick={() => handleDeleteSubCategory(cat, sub)} className="text-gray-300 hover:text-red-400"><BsX size={16} /></button>
                                </div>
                            ))}
                            {taxonomy[cat].length === 0 && <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest italic text-center py-2">No Sub-categories</p>}
                        </div>

                        {/* Add Sub Category */}
                        {activeCategory === cat && (
                            <div className="flex gap-2">
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Add sub..." 
                                    className="flex-grow bg-white border border-gray-100 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                                    value={newSubCategory}
                                    onChange={e => setNewSubCategory(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleAddSubCategory(cat)}
                                />
                                <button 
                                    onClick={() => handleAddSubCategory(cat)}
                                    className="bg-primary text-white p-2 rounded-xl hover:bg-green-700"
                                >
                                    <BsPlus size={18} />
                                </button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Categories;
