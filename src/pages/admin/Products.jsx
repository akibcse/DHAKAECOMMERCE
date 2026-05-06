import { useState, useEffect } from "react";
import { addProduct, getProducts, deleteProduct, updateProduct } from "../../utils/dbServices";
import { BsPlus, BsTrash, BsPencil, BsEye, BsEyeSlash, BsCloudUpload, BsX } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form State
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [category, setCategory] = useState("Electronics");
    const [description, setDescription] = useState("");
    const [stock, setStock] = useState("");
    const [visibility, setVisibility] = useState(true);
    const [imageURL, setImageURL] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Optional per-product SEO state (stored as product.seo.*)
    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");
    const [seoShareImage, setSeoShareImage] = useState("");
    const [seoKeywords, setSeoKeywords] = useState("");
    const [showSeoFields, setShowSeoFields] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

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
                description,
                stock: Number(stock),
                visibility,
                image: imageURL,
                // seo sub-object — only included if at least one field is filled
                // Does NOT replace product.image — it's a parallel override for sharing only
                seo: {
                    title: seoTitle.trim(),
                    description: seoDescription.trim(),
                    shareImage: seoShareImage.trim(),
                    keywords: seoKeywords.trim()
                }
            };

            if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
            } else {
                await addProduct(productData);
            }

            setShowModal(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            alert("Error: " + error.message);
        }
        setIsSaving(false);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setTitle(product.title);
        setPrice(product.price);
        setDiscountPrice(product.discountPrice || "");
        setCategory(product.category);
        setDescription(product.description);
        setStock(product.stock);
        setVisibility(product.visibility ?? true);
        setImageURL(product.image || "");
        // Restore SEO fields if they exist
        setSeoTitle(product.seo?.title || "");
        setSeoDescription(product.seo?.description || "");
        setSeoShareImage(product.seo?.shareImage || "");
        setSeoKeywords(product.seo?.keywords || "");
        setShowSeoFields(!!(product.seo?.title || product.seo?.shareImage));
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product? This cannot be undone.")) {
            try {
                await deleteProduct(id);
                fetchProducts();
            } catch (error) {
                alert("Delete failed: " + error.message);
            }
        }
    };

    const toggleVisibility = async (product) => {
        try {
            await updateProduct(product.id, { visibility: !product.visibility });
            fetchProducts();
        } catch (error) {
            alert("Toggle failed: " + error.message);
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setTitle("");
        setPrice("");
        setDiscountPrice("");
        setCategory("Electronics");
        setDescription("");
        setStock("");
        setVisibility(true);
        setImageURL("");
        setSeoTitle("");
        setSeoDescription("");
        setSeoShareImage("");
        setSeoKeywords("");
        setShowSeoFields(false);
    };

    return (
        <div className="p-4 md:p-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Product Management</h1>
                    <p className="text-gray-500 text-sm">Manage your store inventory and visibility</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-100 font-bold w-full md:w-auto justify-center"
                >
                    <BsPlus size={24} /> Add New Product
                </button>
            </div>

            {/* ⚠️ Missing Image Warning Banner */}
            {(() => {
                const missing = products.filter(p => !p.image && !(p.images && p.images.length > 0));
                if (missing.length === 0) return null;
                return (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                        <span className="text-2xl mt-0.5">⚠️</span>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-amber-800">
                                {missing.length} product{missing.length > 1 ? 's' : ''} missing image URL — social previews will show the default banner instead of the product image.
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                                Click the ✏️ edit button on each highlighted product and paste a public image URL in the <strong>Product Image URL</strong> field.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {missing.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleEdit(p)}
                                        className="text-xs bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1 rounded-full font-semibold hover:bg-amber-200 transition-colors"
                                    >
                                        {p.title?.slice(0, 24) || 'Unnamed product'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Product</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Stock</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">OG Image</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
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
                                                    <div className="text-sm font-bold text-gray-900">{product.title}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{product.id.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600 uppercase">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">
                                            {product.discountPrice ? (
                                                <div className="flex flex-col">
                                                    <span className="text-primary font-black">৳{product.discountPrice}</span>
                                                    <span className="text-[10px] text-gray-400 line-through">৳{product.price}</span>
                                                </div>
                                            ) : (
                                                `৳${product.price}`
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-bold ${product.stock <= 5 ? 'text-red-500' : 'text-gray-600'}`}>
                                                {product.stock} units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleVisibility(product)}
                                                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${product.visibility !== false
                                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {product.visibility !== false ? <BsEye size={12} /> : <BsEyeSlash size={12} />}
                                                {product.visibility !== false ? 'Visible' : 'Hidden'}
                                            </button>
                                        </td>
                                        {/* OG Image status */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {product.image || (product.images && product.images[0]) ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                                                        <img
                                                            src={product.image || product.images[0]}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                            onError={e => { e.target.parentNode.classList.add("opacity-30"); }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-green-600 font-bold">✓ Set</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                                                >
                                                    ⚠ Missing
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-primary hover:bg-green-50 rounded-lg transition-colors"
                                                >
                                                    <BsPencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-secondary hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <BsTrash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {products.map((product) => (
                            <div key={product.id} className="p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center">
                                        <div className="h-16 w-16 rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm flex-shrink-0">
                                            <img className="h-full w-full object-cover" src={product.image || "https://via.placeholder.com/150"} alt="" />
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-base font-black text-gray-900 line-clamp-1">{product.title}</div>
                                            <div className="flex gap-2 mt-1">
                                                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-blue-50 text-blue-600 uppercase">
                                                    {product.category}
                                                </span>
                                                <span className={`text-[10px] font-bold ${product.stock <= 5 ? 'text-red-500' : 'text-gray-500'}`}>
                                                    Stock: {product.stock}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-lg font-black text-gray-900 mt-1">
                                        ৳{product.price}
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => toggleVisibility(product)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex-1 justify-center border ${product.visibility !== false
                                            ? 'bg-green-50 text-green-600 border-green-100'
                                            : 'bg-gray-50 text-gray-400 border-gray-100'
                                            }`}
                                    >
                                        {product.visibility !== false ? <BsEye size={14} /> : <BsEyeSlash size={14} />}
                                        {product.visibility !== false ? 'Visible' : 'Hidden'}
                                    </button>

                                    {/* OG image missing badge — mobile */}
                                    {!product.image && !(product.images && product.images[0]) && (
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="flex items-center gap-1 px-3 py-2 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                                        >
                                            ⚠ No Image
                                        </button>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="p-2 rounded-xl border border-primary/20 text-primary bg-primary/5"
                                        >
                                            <BsPencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="p-2 rounded-xl border border-red-100 text-secondary bg-red-50"
                                        >
                                            <BsTrash size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 md:p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-black text-gray-900">
                                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                                    </h2>
                                    <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                                        <BsX size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Title</label>
                                                <input
                                                    type="text" placeholder="e.g. Premium Leather Wallet" required
                                                    className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                    value={title} onChange={e => setTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Price (৳)</label>
                                                    <input
                                                        type="number" placeholder="599" required
                                                        className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                        value={price} onChange={e => setPrice(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Discount Price (৳)</label>
                                                    <input
                                                        type="number" placeholder="Optional"
                                                        className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                        value={discountPrice} onChange={e => setDiscountPrice(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Stock</label>
                                                    <input
                                                        type="number" placeholder="10" required
                                                        className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                        value={stock} onChange={e => setStock(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Category</label>
                                                <select
                                                    className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                    value={category} onChange={e => setCategory(e.target.value)}
                                                >
                                                    <option>Electronics</option>
                                                    <option>Fashion</option>
                                                    <option>Home</option>
                                                    <option>Beauty</option>
                                                    <option>Food</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Product Image URL</label>
                                                <input
                                                    type="url" placeholder="https://example.com/image.jpg" required
                                                    className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                    value={imageURL} onChange={e => setImageURL(e.target.value)}
                                                />
                                                {imageURL && (
                                                    <div className="mt-4 aspect-video bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                                        <img src={imageURL} className="w-full h-full object-cover" alt="Preview" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => setVisibility(!visibility)}
                                                    className={`w-12 h-6 rounded-full transition-colors relative ${visibility ? 'bg-primary' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${visibility ? 'left-7' : 'left-1'}`} />
                                                </button>
                                                <span className="text-sm font-bold text-gray-700">Make product visible to customers</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Description</label>
                                        <textarea
                                            placeholder="Tell customers about this product..." required
                                            className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium h-32"
                                            value={description} onChange={e => setDescription(e.target.value)}
                                        ></textarea>
                                    </div>

                                    {/* ── Optional Social / SEO Fields ───────────────── */}
                                    <div className="border border-dashed border-gray-200 rounded-2xl overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setShowSeoFields(v => !v)}
                                            className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                        >
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                                📣 Social Sharing / SEO Override
                                                <span className="ml-2 text-[10px] font-normal normal-case text-gray-400">(optional — does not affect product image)</span>
                                            </span>
                                            <span className="text-gray-400 text-xs">{showSeoFields ? "▲ Hide" : "▼ Show"}</span>
                                        </button>

                                        {showSeoFields && (
                                            <div className="p-5 space-y-4 bg-white">
                                                <p className="text-[11px] text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                                    These fields override the social preview title, description, and share image on Facebook, WhatsApp, Telegram, etc.
                                                    The product image URL above is still used for the store listing.
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Social Title</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Best Running Shoes in BD"
                                                            className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                                                            value={seoTitle}
                                                            onChange={e => setSeoTitle(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Keywords</label>
                                                        <input
                                                            type="text"
                                                            placeholder="shoes, running, nike"
                                                            className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                                                            value={seoKeywords}
                                                            onChange={e => setSeoKeywords(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Social Description</label>
                                                    <textarea
                                                        placeholder="Short punchy description for WhatsApp/Facebook previews..."
                                                        className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm h-20 resize-none"
                                                        value={seoDescription}
                                                        onChange={e => setSeoDescription(e.target.value)}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">
                                                        Custom Share Image URL
                                                        <span className="ml-1 text-[10px] font-normal normal-case text-gray-400">(1200×630 recommended)</span>
                                                    </label>
                                                    <input
                                                        type="url"
                                                        placeholder="https://example.com/social-banner.jpg"
                                                        className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                                                        value={seoShareImage}
                                                        onChange={e => setSeoShareImage(e.target.value)}
                                                    />
                                                    {seoShareImage && (
                                                        <div className="mt-3 aspect-video max-h-32 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                                            <img
                                                                src={seoShareImage}
                                                                className="w-full h-full object-cover"
                                                                alt="Share image preview"
                                                                onError={e => { e.target.style.display = "none"; }}
                                                            />
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        Leave blank to use the product image URL above for social previews.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 disabled:opacity-50 min-w-[140px]"
                                        >
                                            {isSaving ? (
                                                <div className="flex items-center gap-2 justify-center">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Saving...</span>
                                                </div>
                                            ) : (
                                                editingProduct ? 'Update Product' : 'Create Product'
                                            )}
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
