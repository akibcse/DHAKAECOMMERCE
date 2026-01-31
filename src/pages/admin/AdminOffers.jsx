import { useState, useEffect } from "react";
import { getOffers, addOffer, updateOffer, deleteOffer, getProducts } from "../../utils/dbServices";
import { BsPlus, BsTrash, BsPencil, BsEye, BsEyeSlash, BsImage, BsLink45Deg } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const AdminOffers = () => {
    const [offers, setOffers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        image: "",
        linkType: "product",
        linkId: "",
        active: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ["Electronics", "Fashion", "Groceries", "Home & Lifestyle", "Gadgets"];

    useEffect(() => {
        fetchOffers();
        fetchProducts();
    }, []);

    const fetchOffers = async () => {
        try {
            const data = await getOffers();
            setOffers(data);
        } catch (error) {
            toast.error("Failed to fetch offers");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        const data = await getProducts();
        setProducts(data);
    };

    const handleOpenModal = (offer = null) => {
        if (offer) {
            setEditingOffer(offer);
            setFormData(offer);
        } else {
            setEditingOffer(null);
            setFormData({
                title: "",
                description: "",
                image: "",
                linkType: "product",
                linkId: "",
                active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const offerData = { ...formData };

            if (editingOffer) {
                await updateOffer(editingOffer.id, offerData);
                toast.success("Offer updated successfully");
            } else {
                await addOffer(offerData);
                toast.success("Offer added successfully");
            }
            setIsModalOpen(false);
            fetchOffers();
        } catch (error) {
            toast.error("Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this offer?")) {
            try {
                await deleteOffer(id);
                toast.success("Offer deleted");
                fetchOffers();
            } catch (error) {
                toast.error("Delete failed");
            }
        }
    };

    const toggleStatus = async (offer) => {
        try {
            await updateOffer(offer.id, { active: !offer.active });
            toast.success(`Offer ${!offer.active ? 'activated' : 'deactivated'}`);
            fetchOffers();
        } catch (error) {
            toast.error("Status update failed");
        }
    };

    return (
        <div className="p-4 md:p-0">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Banner Offers</h1>
                    <p className="text-gray-500 text-sm">Manage home page slider content</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
                >
                    <BsPlus size={24} />
                    <span>New Offer</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offers.map((offer) => (
                        <div key={offer.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
                            <div className="relative h-48 overflow-hidden">
                                <img src={offer.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => toggleStatus(offer)}
                                        className={`p-2 rounded-xl backdrop-blur-md border ${offer.active ? 'bg-green-500/20 border-green-500 text-green-600' : 'bg-gray-500/20 border-gray-500 text-white'}`}
                                    >
                                        {offer.active ? <BsEye size={18} /> : <BsEyeSlash size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-black text-gray-900 mb-2 truncate">{offer.title}</h3>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">{offer.description}</p>

                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400 mb-6 bg-gray-50 p-2 rounded-lg">
                                    <BsLink45Deg size={16} />
                                    <span>Linked to: {offer.linkType} ({offer.linkId})</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(offer)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all border border-gray-200"
                                    >
                                        <BsPencil /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(offer.id)}
                                        className="p-3 bg-red-50 text-secondary rounded-xl hover:bg-red-100 transition-all border border-red-100"
                                    >
                                        <BsTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Offer Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <form onSubmit={handleSubmit} className="p-8">
                                <h2 className="text-2xl font-black text-gray-900 mb-6">
                                    {editingOffer ? 'Edit Offer' : 'Create New Offer'}
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Title</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Huge Monsoon Sale!"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Description</label>
                                        <textarea
                                            required
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 h-24 resize-none"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Get up to 70% off on all items..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Link Type</label>
                                            <select
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                                                value={formData.linkType}
                                                onChange={e => setFormData({ ...formData, linkType: e.target.value, linkId: "" })}
                                            >
                                                <option value="product">Specific Product</option>
                                                <option value="category">Category Page</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Target ID</label>
                                            <select
                                                required
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                                                value={formData.linkId}
                                                onChange={e => setFormData({ ...formData, linkId: e.target.value })}
                                            >
                                                <option value="">Select Target</option>
                                                {formData.linkType === 'category'
                                                    ? categories.map(c => <option key={c} value={c}>{c}</option>)
                                                    : products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Banner Image URL</label>
                                        <div className="space-y-4">
                                            <input
                                                required
                                                type="url"
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                                                value={formData.image}
                                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                                placeholder="https://example.com/banner.jpg"
                                            />
                                            {formData.image && (
                                                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-primary/20">
                                                    <img
                                                        src={formData.image}
                                                        className="w-full h-full object-cover"
                                                        alt="Preview"
                                                        onError={(e) => {
                                                            e.target.src = "https://via.placeholder.com/1200x500?text=Invalid+Image+URL";
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={isSubmitting}
                                        type="submit"
                                        className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-opacity-90 transition-all shadow-xl disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Processing...' : (editingOffer ? 'Save Changes' : 'Create Offer')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOffers;
