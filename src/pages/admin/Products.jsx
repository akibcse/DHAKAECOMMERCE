import { useState, useEffect } from "react";
import { addProduct, getProducts, deleteProduct, updateProduct, getTaxonomy } from "../../utils/dbServices";
import { BsPlus, BsTrash, BsPencil, BsEye, BsEyeSlash, BsX, BsTags } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [taxonomy, setTaxonomy] = useState({});

    // Form State
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [category, setCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [description, setDescription] = useState("");
    const [stock, setStock] = useState("");
    const [visibility, setVisibility] = useState(true);
    const [imageURL, setImageURL] = useState("");
    const [sizes, setSizes] = useState("");
    const [colors, setColors] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // SEO / Social Sharing State
    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");
    const [seoShareImage, setSeoShareImage] = useState("");
    const [seoKeywords, setSeoKeywords] = useState("");
    const [showSeoFields, setShowSeoFields] = useState(false);
    
    const [isSeoModified, setIsSeoModified] = useState({
        title: false,
        description: false,
        shareImage: false
    });

    useEffect(() => {
        fetchProducts();
        fetchTaxonomy();
    }, []);

    const fetchTaxonomy = async () => {
        try {
            const data = await getTaxonomy();
            setTaxonomy(data);
            // Default to first category if not set
            if (!category && Object.keys(data).length > 0) {
                setCategory(Object.keys(data)[0]);
            }
        } catch (error) {
            console.error("Taxonomy Fetch Error:", error);
        }
    };

    // [SYNC] Auto-populate Sub-category when Category changes
    useEffect(() => {
        if (taxonomy[category]) {
            if (!taxonomy[category].includes(subCategory)) {
                setSubCategory(taxonomy[category][0] || "");
            }
        }
    }, [category, taxonomy]);

    // [SYNC] Auto-populate SEO fields from main fields if not manually modified
    useEffect(() => {
        if (!isSeoModified.title) setSeoTitle(title);
    }, [title, isSeoModified.title]);

    useEffect(() => {
        if (!isSeoModified.description) setSeoDescription(description);
    }, [description, isSeoModified.description]);

    useEffect(() => {
        if (!isSeoModified.shareImage) setSeoShareImage(imageURL);
    }, [imageURL, isSeoModified.shareImage]);

    // [SYNC] Auto-populate Fashion variations
    useEffect(() => {
        if (category === "Fashion" && !editingProduct) {
            setSizes("S, M, L, XL");
            setColors("Red, Blue, Black");
        }
    }, [category, editingProduct]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (error) {
            console.error("Fetch Error:", error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const productData = {
                title,
                price: Number(price),
                discountPrice: discountPrice ? Number(discountPrice) : null,
                category,
                subCategory,
                description,
                stock: Number(stock),
                visibility,
                image: imageURL,
                seo: {
                    title: seoTitle.trim() || title.trim(),
                    description: seoDescription.trim() || description.trim(),
                    shareImage: seoShareImage.trim() || imageURL.trim(),
                    keywords: seoKeywords.trim()
                },
                variations: {
                    sizes: sizes.split(",").map(s => s.trim()).filter(s => s),
                    colors: colors.split(",").map(c => c.trim()).filter(c => c)
                }
            };

            if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
                toast.success("Product updated successfully!");
            } else {
                await addProduct(productData);
                toast.success("Product added successfully!");
            }

            setShowModal(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            toast.error("Error: " + error.message);
        }
        setIsSaving(false);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setTitle(product.title);
        setPrice(product.price);
        setDiscountPrice(product.discountPrice || "");
        setCategory(product.category);
        setSubCategory(product.subCategory || "");
        setDescription(product.description);
        setStock(product.stock);
        setVisibility(product.visibility ?? true);
        setImageURL(product.image || "");
        setSizes(product.variations?.sizes?.join(", ") || "");
        setColors(product.variations?.colors?.join(", ") || "");
        
        // Restore SEO fields
        setSeoTitle(product.seo?.title || "");
        setSeoDescription(product.seo?.description || "");
        setSeoShareImage(product.seo?.shareImage || "");
        setSeoKeywords(product.seo?.keywords || "");
        
        setIsSeoModified({
            title: !!(product.seo?.title && product.seo.title !== product.title),
            description: !!(product.seo?.description && product.seo.description !== product.description),
            shareImage: !!(product.seo?.shareImage && product.seo.shareImage !== product.image)
        });
        
        setShowSeoFields(!!(product.seo?.title || product.seo?.shareImage));
        setShowModal(true);
    };

    const handleDuplicate = (product) => {
        setEditingProduct(null);
        setTitle(`${product.title} (Copy)`);
        setPrice(product.price);
        setDiscountPrice(product.discountPrice || "");
        setCategory(product.category);
        setSubCategory(product.subCategory || "");
        setDescription(product.description);
        setStock(product.stock);
        setVisibility(product.visibility ?? true);
        setImageURL(product.image || "");
        setSizes(product.variations?.sizes?.join(", ") || "");
        setColors(product.variations?.colors?.join(", ") || "");
        setSeoTitle(product.seo?.title || "");
        setSeoDescription(product.seo?.description || "");
        setSeoShareImage(product.seo?.shareImage || "");
        setSeoKeywords(product.seo?.keywords || "");
        setIsSeoModified({
            title: !!(product.seo?.title && product.seo.title !== product.title),
            description: !!(product.seo?.description && product.seo.description !== product.description),
            shareImage: !!(product.seo?.shareImage && product.seo.shareImage !== product.image)
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product? This cannot be undone.")) {
            try {
                await deleteProduct(id);
                fetchProducts();
                toast.success("Product deleted!");
            } catch (error) {
                toast.error("Delete failed: " + error.message);
            }
        }
    };

    const toggleVisibility = async (product) => {
        try {
            await updateProduct(product.id, { visibility: !product.visibility });
            fetchProducts();
        } catch (error) {
            toast.error("Toggle failed: " + error.message);
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setTitle("");
        setPrice("");
        setDiscountPrice("");
        // Reset to first dynamic category if available
        const firstCat = Object.keys(taxonomy)[0] || "Fashion";
        setCategory(firstCat);
        setSubCategory("");
        setDescription("");
        setStock("");
        setVisibility(true);
        setImageURL("");
        setSeoTitle("");
        setSeoDescription("");
        setSeoShareImage("");
        setSeoKeywords("");
        setShowSeoFields(false);
        setIsSeoModified({ title: false, description: false, shareImage: false });
    };

    return (
        <div className="p-4 md:p-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tighter uppercase">Product Management</h1>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Manage your store taxonomy and inventory</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-100 font-black uppercase text-xs tracking-widest w-full md:w-auto justify-center"
                >
                    <BsPlus size={24} /> Add New Product
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Product</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Taxonomy</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Stock</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex-shrink-0">
                                                    <img className="h-full w-full object-cover" src={product.image || "https://via.placeholder.com/150"} alt="" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900 line-clamp-1 max-w-[200px]">{product.title}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1 uppercase tracking-widest">
                                                        <BsTags size={10} /> {product.category}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{product.category}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">{product.subCategory || 'No Sub'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">৳{product.discountPrice || product.price}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${product.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {product.stock} Units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => toggleVisibility(product)} className={`p-2 rounded-lg transition-colors ${product.visibility ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}>
                                                    {product.visibility ? <BsEye size={18} /> : <BsEyeSlash size={18} />}
                                                </button>
                                                <button onClick={() => handleEdit(product)} title="Edit" className="p-2 text-primary hover:bg-green-50 rounded-lg">
                                                    <BsPencil size={18} />
                                                </button>
                                                <button onClick={() => handleDuplicate(product)} title="Duplicate" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <motion.div whileHover={{ scale: 1.2 }}><BsPlus size={20} /></motion.div>
                                                </button>
                                                <button onClick={() => handleDelete(product.id)} title="Delete" className="p-2 text-secondary hover:bg-red-50 rounded-lg">
                                                    <BsTrash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                                    <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><BsX size={24} /></button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Title</label>
                                                <input type="text" placeholder="Product title" required className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium" value={title} onChange={e => setTitle(e.target.value)} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Price (৳)</label>
                                                    <input type="number" placeholder="0" required className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium" value={price} onChange={e => setPrice(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Stock</label>
                                                    <input type="number" placeholder="0" required className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium" value={stock} onChange={e => setStock(e.target.value)} />
                                                </div>
                                            </div>
                                            
                                            {/* TAXONOMY SECTION (DYNAMIC) */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Category</label>
                                                    <select className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium" value={category} onChange={e => setCategory(e.target.value)}>
                                                        {Object.keys(taxonomy).length > 0 ? (
                                                            Object.keys(taxonomy).map(cat => (
                                                                <option key={cat} value={cat}>{cat}</option>
                                                            ))
                                                        ) : (
                                                            <option disabled>No Categories Defined</option>
                                                        )}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Sub-Category</label>
                                                    <select className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium" value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                                                        {taxonomy[category]?.map(sub => (
                                                            <option key={sub} value={sub}>{sub}</option>
                                                        )) || <option disabled>Select Category First</option>}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Main Image URL</label>
                                                <input type="url" placeholder="https://..." required className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium" value={imageURL} onChange={e => setImageURL(e.target.value)} />
                                                {imageURL && <div className="mt-4 aspect-video bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden"><img src={imageURL} className="w-full h-full object-cover" alt="Preview" /></div>}
                                            </div>

                                            {category === "Fashion" && (
                                                <div className="grid grid-cols-2 gap-4 pt-2">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Available Sizes</label>
                                                        <input type="text" placeholder="S, M, L, XL" className="w-full bg-gray-50 border-none px-4 py-2.5 rounded-xl text-sm" value={sizes} onChange={e => setSizes(e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Available Colors</label>
                                                        <input type="text" placeholder="Red, Blue, Black" className="w-full bg-gray-50 border-none px-4 py-2.5 rounded-xl text-sm" value={colors} onChange={e => setColors(e.target.value)} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Description</label>
                                        <textarea placeholder="Product description..." required className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium h-32" value={description} onChange={e => setDescription(e.target.value)}></textarea>
                                    </div>

                                    {/* ── SEO / Social Sharing ───────────────── */}
                                    <div className="border border-dashed border-gray-200 rounded-2xl overflow-hidden">
                                        <button type="button" onClick={() => setShowSeoFields(v => !v)} className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">📣 Social Sharing / SEO (Auto-Synced)</span>
                                            <span className="text-gray-400 text-xs">{showSeoFields ? "▲ Hide" : "▼ Show"}</span>
                                        </button>

                                        {showSeoFields && (
                                            <div className="p-5 space-y-4 bg-white">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Social Title</label>
                                                        <input type="text" placeholder="Auto-populated" className="w-full bg-gray-50 border-none px-4 py-2.5 rounded-xl text-sm font-medium" value={seoTitle} onChange={e => { setSeoTitle(e.target.value); setIsSeoModified(prev => ({ ...prev, title: true })); }} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Social Image URL</label>
                                                        <input type="url" placeholder="Auto-populated" className="w-full bg-gray-50 border-none px-4 py-2.5 rounded-xl text-sm font-medium" value={seoShareImage} onChange={e => { setSeoShareImage(e.target.value); setIsSeoModified(prev => ({ ...prev, shareImage: true })); }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Social Description</label>
                                                    <textarea placeholder="Auto-populated" className="w-full bg-gray-50 border-none px-4 py-2.5 rounded-xl text-sm font-medium h-20" value={seoDescription} onChange={e => { setSeoDescription(e.target.value); setIsSeoModified(prev => ({ ...prev, description: true })); }}></textarea>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Keywords</label>
                                                    <input type="text" placeholder="e.g. fashion, summer, shirt" className="w-full bg-gray-50 border-none px-4 py-2.5 rounded-xl text-sm font-medium" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                        <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                                        <button type="submit" disabled={isSaving} className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 disabled:opacity-50 uppercase tracking-widest text-[10px]">
                                            {isSaving ? 'Saving...' : (editingProduct ? 'Update Inventory' : 'Create Product')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Products;
