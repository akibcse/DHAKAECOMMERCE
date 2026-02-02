import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAccountById, getCustomerLedgerWithBalance } from "../../../utils/accountingServices";
import { BsArrowLeft, BsPrinter } from "react-icons/bs";
import { toast } from "react-hot-toast";

const CustomerLedgerView = () => {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [customerId]);

    const loadData = async () => {
        try {
            const accountData = await getAccountById(customerId);
            const ledgerData = await getCustomerLedgerWithBalance(customerId);
            setCustomer(accountData);
            setLedger(ledgerData);
        } catch (error) {
            toast.error("Failed to load ledger");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="text-center py-8">Loading ledger...</div>;
    if (!customer) return <div className="text-center py-8">Customer not found</div>;

    const currentBalance = ledger.length > 0 ? ledger[ledger.length - 1].runningBalance : customer.openingBalance;

    return (
        <div className="max-w-5xl mx-auto space-y-6 ledger-print-container">
            {/* Print Header - Only visible when printing */}
            <div className="hidden print:block text-center mb-4">
                <h1 className="text-xl font-bold">DhakaEcommerce - Customer Ledger Statement</h1>
                <p className="text-sm">Printed: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center print:hidden">
                <button
                    onClick={() => navigate('/admin/accounting/customers')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                    <BsArrowLeft /> Back to Customers
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700"
                >
                    <BsPrinter /> Print Statement
                </button>
            </div>

            {/* Customer Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Customer Ledger Statement</h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-xs text-gray-500">Customer Name</div>
                        <div className="font-semibold">{customer.name}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <div className="font-semibold font-mono">{customer.phone}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Opening Balance</div>
                        <div className="font-semibold">৳{customer.openingBalance}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Current Balance</div>
                        <div className={`font-bold text-lg ${currentBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            ৳{currentBalance.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Description</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Sale</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Payment</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Due</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* Opening Balance Row */}
                        <tr className="bg-blue-50">
                            <td className="px-4 py-3 text-gray-600">{new Date(customer.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 font-semibold">Opening</td>
                            <td className="px-4 py-3 text-gray-600">Opening Due</td>
                            <td className="px-4 py-3 text-right">-</td>
                            <td className="px-4 py-3 text-right">-</td>
                            <td className="px-4 py-3 text-right font-bold">৳{customer.openingBalance}</td>
                        </tr>

                        {ledger.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                                    No transactions yet
                                </td>
                            </tr>
                        ) : (
                            ledger.map((entry, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(entry.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${entry.type === 'DEBIT' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {entry.type === 'DEBIT' ? 'Sale' : 'Payment'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{entry.description}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                                        {entry.type === 'DEBIT' ? `৳${entry.amount}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                                        {entry.type === 'CREDIT' ? `৳${entry.amount}` : '-'}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold ${entry.runningBalance > 0 ? 'text-red-500' : 'text-green-500'
                                        }`}>
                                        ৳{entry.runningBalance.toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
                <div className="text-sm text-gray-600 mb-2">Ledger Summary</div>
                <div className="text-2xl font-black text-gray-800">
                    {currentBalance > 0 ? 'Amount Due' : currentBalance < 0 ? 'Advance Balance' : 'Settled'}
                    <span className={`ml-3 ${currentBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        ৳{Math.abs(currentBalance).toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CustomerLedgerView;
