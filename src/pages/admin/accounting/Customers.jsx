import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCustomerAccounts, createCustomerAccount } from "../../../utils/accountingServices";
import { BsPlus, BsSearch, BsPerson, BsCashStack } from "react-icons/bs";
import { toast } from "react-hot-toast";

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", address: "", openingBalance: 0 });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await getCustomerAccounts();
            setCustomers(data);
        } catch (error) {
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createCustomerAccount(newCustomer);
            toast.success("Customer created successfully");
            setShowModal(false);
            setNewCustomer({ name: "", phone: "", address: "", openingBalance: 0 });
            loadCustomers();
        } catch (error) {
            toast.error("Error creating customer");
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Customer Accounts</h1>
                    <p className="text-gray-500">Manage customer ledgers and balances</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                >
                    <BsPlus size={20} />
                    New Customer
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Customer</th>
                            <th className="px-6 py-4 font-semibold">Phone</th>
                            <th className="px-6 py-4 font-semibold text-right">Opening Balance</th>
                            <th className="px-6 py-4 font-semibold text-right">Current Due</th>
                            <th className="px-6 py-4 font-semibold text-right">Total Sales</th>
                            <th className="px-6 py-4 font-semibold text-right">Total Paid</th>
                            <th className="px-6 py-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-8">Loading accounts...</td></tr>
                        ) : filteredCustomers.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-8 text-gray-500">No customers found</td></tr>
                        ) : (
                            filteredCustomers.map(customer => (
                                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <BsPerson />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-800">{customer.name}</div>
                                                <div className="text-xs text-gray-400">{customer.address}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-mono">{customer.phone}</td>
                                    <td className="px-6 py-4 text-right text-gray-600">৳{customer.openingBalance}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${customer.currentBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        ৳{customer.currentBalance}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-600">৳{customer.totalSales || 0}</td>
                                    <td className="px-6 py-4 text-right text-gray-600">৳{customer.totalPaid || 0}</td>
                                    <td className="px-6 py-4 text-center">
                                        <Link
                                            to={`/admin/accounting/ledger/${customer.id}`}
                                            className="text-primary hover:text-primary/80 font-semibold text-sm"
                                        >
                                            View Ledger
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Add New Customer Account</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-xl"
                                    value={newCustomer.name}
                                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-xl"
                                    value={newCustomer.phone}
                                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-xl"
                                    value={newCustomer.address}
                                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance (Due)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 border rounded-xl"
                                    value={newCustomer.openingBalance}
                                    onChange={e => setNewCustomer({ ...newCustomer, openingBalance: e.target.value })}
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400 mt-1">Positive value means customer owes money (Due).</p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
