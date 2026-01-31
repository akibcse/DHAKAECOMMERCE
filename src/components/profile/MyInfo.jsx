import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateUserProfile } from "../../utils/dbServices";
import { BsPerson, BsPencilSquare, BsSave } from "react-icons/bs";
import toast from "react-hot-toast";

const MyInfo = () => {
    const { currentUser, userData, refreshUserData } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        displayName: "",
        phoneNumber: "",
        address: "",
        photoURL: ""
    });

    useEffect(() => {
        if (userData) {
            setFormData({
                displayName: userData.displayName || userData.name || "",
                phoneNumber: userData.phoneNumber || userData.phone || "",
                address: userData.address || "",
                photoURL: userData.photoURL || ""
            });
        }
    }, [userData]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateUserProfile(currentUser.uid, formData);
            refreshUserData();
            setIsEditing(false);
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (!userData) return <div className="animate-pulse bg-white p-8 rounded-3xl h-64 border border-gray-100"></div>;

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Personal Details</h2>
                    <p className="text-gray-500 font-medium">Manage your name, contact, and delivery info</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 rounded-2xl font-bold hover:bg-gray-100 transition-all border border-gray-100"
                    >
                        <BsPencilSquare /> Edit Profile
                    </button>
                )}
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                        <input
                            disabled={!isEditing}
                            type="text"
                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 disabled:opacity-70 font-bold"
                            value={formData.displayName}
                            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                        <input
                            disabled={!isEditing}
                            type="tel"
                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 disabled:opacity-70 font-bold"
                            value={formData.phoneNumber}
                            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="+880 123456789"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Profile Photo URL</label>
                        <input
                            disabled={!isEditing}
                            type="url"
                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 disabled:opacity-70 font-bold"
                            value={formData.photoURL}
                            onChange={e => setFormData({ ...formData, photoURL: e.target.value })}
                            placeholder="https://example.com/photo.jpg"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Delivery Address</label>
                    <textarea
                        disabled={!isEditing}
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 disabled:opacity-70 font-bold h-32 resize-none"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street, District, ZIP..."
                    />
                </div>

                {isEditing && (
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    displayName: userData.displayName || userData.name || "",
                                    phoneNumber: userData.phoneNumber || userData.phone || "",
                                    address: userData.address || "",
                                    photoURL: userData.photoURL || ""
                                });
                            }}
                            className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-opacity-90 transition-all shadow-xl disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : <><BsSave /> Update Profile</>}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default MyInfo;
