import { Link } from "react-router-dom";
import { BsPeople, BsCartPlus, BsCashCoin, BsFileText, BsArrowRight, BsReceipt, BsJournalText, BsClockHistory } from "react-icons/bs";

const AccountingDashboard = () => {
    const cards = [
        {
            title: "Offline Sales",
            desc: "Record manual sales & generate invoices",
            icon: <BsCartPlus size={24} />,
            path: "/admin/accounting/offline-sales",
            color: "bg-blue-500"
        },
        {
            title: "Money Receipt",
            desc: "Receive payments & update ledgers",
            icon: <BsCashCoin size={24} />,
            path: "/admin/accounting/money-receipt",
            color: "bg-green-500"
        },
        {
            title: "Customer Accounts",
            desc: "View ledgers, dues & balances",
            icon: <BsPeople size={24} />,
            path: "/admin/accounting/customers",
            color: "bg-purple-500"
        },
        {
            title: "Reports & Export",
            desc: "Tally CSV, Sales Register & more",
            icon: <BsFileText size={24} />,
            path: "/admin/accounting/reports",
            color: "bg-orange-500"
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Accounting Module</h1>
                <p className="text-gray-500 mt-2">Manage finances, ledgers, and manual transactions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link to="/admin/accounting/offline-sales" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                            <BsCartPlus size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800">New Offline Sale</h3>
                    </div>
                    <p className="text-sm text-gray-500">Record a manual sale entry</p>
                </Link>

                <Link to="/admin/accounting/money-receipt" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                            <BsReceipt size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800">New Money Receipt</h3>
                    </div>
                    <p className="text-sm text-gray-500">Receive payment from customer</p>
                </Link>

                <Link to="/admin/accounting/sales-history" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                            <BsJournalText size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800">Sales History</h3>
                    </div>
                    <p className="text-sm text-gray-500">View all sales records</p>
                </Link>

                <Link to="/admin/accounting/receipts-history" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform">
                            <BsClockHistory size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800">Receipts History</h3>
                    </div>
                    <p className="text-sm text-gray-500">View payment history</p>
                </Link>

                <Link to="/admin/accounting/customers" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                            <BsPeople size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800">Customer Accounts</h3>
                    </div>
                    <p className="text-sm text-gray-500">View ledgers, dues & balances</p>
                </Link>

                <Link to="/admin/accounting/reports" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
                            <BsFileText size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800">Reports & Export</h3>
                    </div>
                    <p className="text-sm text-gray-500">Tally CSV, Sales Register & more</p>
                </Link>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                <h3 className="font-bold text-blue-800 mb-2">Accounting Safety Info</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc px-4">
                    <li>This module is designed to work alongside the existing online order system.</li>
                    <li>Offline sales do <strong>not</strong> break online order sequences (uses separate ID).</li>
                    <li>Ledger updates are atomic and safe.</li>
                    <li>Always use the "Reports" section to export data for Tally/Audit.</li>
                </ul>
            </div>
        </div>
    );
};

export default AccountingDashboard;
