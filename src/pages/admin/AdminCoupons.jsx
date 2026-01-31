import { useState, useEffect } from "react";
import { getCoupons, addCoupon, updateCoupon, deleteCoupon, createAuditLog } from "../../utils/dbServices";
import { BsPlus, BsTrash, BsPencil, BsCheckCircle, BsXCircle, BsTag, BsCalendarEvent } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const AdminCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: "",
        type: "percent",
        value: 0,
        expiry: "",
        minOrder: 0,
        usageLimit: 100,
        active: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const data = await getCoupons();
            setCoupons(data);
        } catch (error) {
            toast.error("Failed to fetch coupons");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData(coupon);
        } else {
            setEditingCoupon(null);
            setFormData({
                code: "",
                type: "percent",
                value: 0,
                expiry: "",
                minOrder: 0,
                usageLimit: 100,
                active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCoupon) {
                await updateCoupon(editingCoupon.code, formData);
                await createAuditLog('COUPON_UPDATE', { code: formData.code }, 'coupon', formData.code);
                toast.success("Coupon updated successfully");
            } else {
                await addCoupon(formData);
                await createAuditLog('COUPON_CREATE', { code: formData.code }, 'coupon', formData.code);
                toast.success("Coupon created successfully");
            }
            setIsModalOpen(false);
            fetchCoupons();
        } catch (error) {
            toast.error(error.message || "Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (code) => {
        if (window.confirm(`Delete coupon ${code} permanently?`)) {
            try {
                await deleteCoupon(code);
                await createAuditLog('COUPON_DELETE', { code }, 'coupon', code);
                toast.success("Coupon deleted");
                fetchCoupons();
            } catch (error) {
                toast.error("Delete failed");
            }
        }
    };

    const toggleStatus = async (coupon) => {
        try {
            await updateCoupon(coupon.code, { active: !coupon.active });
            await createAuditLog('COUPON_TOGGLE', { code: coupon.code, active: !coupon.active }, 'coupon', coupon.code);
            toast.success(`Coupon ${!coupon.active ? 'activated' : 'deactivated'}`);
            fetchCoupons();
        } catch (error) {
            toast.error("Status update failed");
        }
    };

    return (
        <div className="p-4 md:p-0">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Discount Coupons</h1>
                    <p className="text-gray-500 text-sm">Create and manage promotional codes</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
                >
                    <BsPlus size={24} />
                    <span>New Coupon</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.map((coupon) => (
                        <div key={coupon.code} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 p-6 relative group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
                                        <BsTag size={24} />
                                    </div>
                                    <div>
                                        <div className="text-xl font-black text-gray-900 tracking-tight">{coupon.code}</div>
                                        <div className={`text-[10px] font-bold uppercase ${coupon.active ? 'text-green-600' : 'text-gray-400'}`}>
                                            {coupon.active ? 'Active' : 'Disabled'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-primary">
                                        {coupon.type === 'percent' ? `${coupon.value}%` : `৳${coupon.value}`}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase">Discount</div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-xs font-medium text-gray-600">
                                    <span className="flex items-center gap-1.5"><BsCalendarEvent /> Expiry:</span>
                                    <span className="font-bold">{coupon.expiry ? new Date(coupon.expiry).toLocaleDateString() : 'Never'}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-gray-600">
                                    <span>Min. Order:</span>
                                    <span className="font-bold">৳{coupon.minOrder}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-gray-600">
                                    <span>Usage:</span>
                                    <span className="font-bold">{coupon.used} / {coupon.usageLimit}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-secondary h-full transition-all duration-500"
                                        style={{ width: `${Math.min((coupon.used / coupon.usageLimit) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleStatus(coupon)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border ${coupon.active
                                        ? 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-red-50 hover:text-secondary hover:border-red-100'
                                        : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                                        }`}
                                >
                                    {coupon.active ? <BsXCircle /> : <BsCheckCircle />}
                                    {coupon.active ? 'Disable' : 'Enable'}
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(coupon)}
                                        className="p-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-all border border-gray-200"
                                    >
                                        <BsPencil />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(coupon.code)}
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

            {/* Coupon Modal */}
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
                                    {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Coupon Code</label>
                                        <input
                                            required
                                            disabled={!!editingCoupon}
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 disabled:opacity-50 font-bold tracking-widest text-lg"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            placeholder="OFF70"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Discount Type</label>
                                            <select
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="percent">Percentage (%)</option>
                                                <option value="flat">Fixed Amount (৳)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Value</label>
                                            <input
                                                required
                                                type="number"
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                                                value={formData.value}
                                                onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Expiry Date</label>
                                            <input
                                                type="date"
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                                                value={formData.expiry}
                                                onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Min. Order (৳)</label>
                                            <input
                                                required
                                                type="number"
                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                                                value={formData.minOrder}
                                                onChange={e => setFormData({ ...formData, minOrder: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Usage Limit</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                                            value={formData.usageLimit}
                                            onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                                        />
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
                                        {isSubmitting ? 'Processing...' : (editingCoupon ? 'Apply Changes' : 'Create Coupon')}
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

export default AdminCoupons;
