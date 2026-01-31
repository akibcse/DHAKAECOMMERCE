import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole, updateUserStatus, createAuditLog } from "../../utils/dbServices";
import { useAuth } from "../../context/AuthContext";
import { BsShieldLock, BsPerson, BsTrash, BsBan, BsCheckCircle } from "react-icons/bs";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Fetch Users Error:", error);
        }
        setLoading(false);
    };

    const handleRoleToggle = async (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        if (window.confirm(`Are you sure you want to change ${user.name}'s role to ${newRole}?`)) {
            try {
                await updateUserRole(user.uid, newRole);
                await createAuditLog('ROLE_CHANGE', { targetUser: user.email, newRole }, 'user', user.uid);
                fetchUsers();
            } catch (error) {
                alert("Failed: " + error.message);
            }
        }
    };

    const handleStatusToggle = async (user) => {
        const newStatus = !user.disabled;
        if (window.confirm(`Are you sure you want to ${newStatus ? 'disable' : 'enable'} ${user.name}?`)) {
            try {
                await updateUserStatus(user.uid, newStatus);
                await createAuditLog('USER_STATUS_TOGGLE', { targetUser: user.email, disabled: newStatus }, 'user', user.uid);
                fetchUsers();
            } catch (error) {
                alert("Failed: " + error.message);
            }
        }
    };

    const handleDeleteUser = async (user) => {
        if (user.uid === currentUser.uid) {
            alert("Security Breach: You cannot delete your own admin account.");
            return;
        }

        if (window.confirm(`CRITICAL: Are you sure you want to PERMANENTLY delete ${user.name}? This action cannot be undone.`)) {
            try {
                // In a real app, you'd also delete from Auth via cloud function or Admin SDK
                // For this demo, we'll mark as deleted in DB or remove from DB
                // Since this tool doesn't have a direct deleteUser in dbServices yet, I'll use a generic remove
                // Actually I'll just use the audit log and a status for now if no direct delete is available, 
                // but I'll assume a generic delete is possible or I'll implement it.
                // For now, I'll just use the status disable as a proxy if direct delete is risky without Admin SDK.
                alert("User deletion requires Firebase Admin SDK. For now, please use the Disable feature.");
            } catch (error) {
                alert("Failed: " + error.message);
            }
        }
    };

    return (
        <div className="p-4 md:p-0">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">User Management</h1>
                <p className="text-gray-500 text-sm">Manage user roles, access, and account status</p>
            </div>

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
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map((user) => (
                                    <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden">
                                                    {user.photoURL ? (
                                                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <BsPerson size={20} />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{user.uid?.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleRoleToggle(user)}
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${user.role === 'admin'
                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                                                    }`}
                                            >
                                                {user.role === 'admin' ? <BsShieldLock size={12} /> : <BsPerson size={12} />}
                                                {user.role}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${user.disabled
                                                ? 'bg-gray-100 text-gray-400'
                                                : 'bg-green-50 text-green-600'
                                                }`}>
                                                {user.disabled ? <BsBan size={10} /> : <BsCheckCircle size={10} />}
                                                {user.disabled ? 'Disabled' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleStatusToggle(user)}
                                                    className={`p-2 rounded-lg transition-colors ${user.disabled
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-orange-500 hover:bg-orange-50'
                                                        }`}
                                                    title={user.disabled ? 'Enable User' : 'Disable User'}
                                                >
                                                    <BsBan size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="p-2 text-secondary hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete User"
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
                        {users.map((user) => (
                            <div key={user.uid} className="p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <BsPerson size={24} />
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-base font-black text-gray-900">{user.name}</div>
                                            <div className="text-[11px] text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusToggle(user)}
                                            className={`p-2 rounded-xl border ${user.disabled ? 'border-green-100 text-green-600 bg-green-50' : 'border-orange-100 text-orange-500 bg-orange-50'}`}
                                        >
                                            <BsBan size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user)}
                                            className="p-2 rounded-xl border border-red-100 text-secondary bg-red-50"
                                        >
                                            <BsTrash size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => handleRoleToggle(user)}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex-1 justify-center ${user.role === 'admin'
                                            ? 'bg-red-50 text-red-600 border border-red-100'
                                            : 'bg-primary/5 text-primary border border-primary/10'
                                            }`}
                                    >
                                        {user.role === 'admin' ? <BsShieldLock size={14} /> : <BsPerson size={14} />}
                                        Role: {user.role}
                                    </button>
                                    <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase flex-1 justify-center ${user.disabled
                                        ? 'bg-gray-50 text-gray-400 border border-gray-100'
                                        : 'bg-green-50 text-green-600 border border-green-100'
                                        }`}>
                                        {user.disabled ? <BsBan size={12} /> : <BsCheckCircle size={12} />}
                                        {user.disabled ? 'Disabled' : 'Active'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
