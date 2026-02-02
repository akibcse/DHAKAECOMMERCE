import { Link } from "react-router-dom";
import { BsPeople, BsCartPlus, BsCashCoin, BsFileText, BsArrowRight } from "react-icons/bs";

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <Link
                        key={idx}
                        to={card.path}
                        className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className={`w-12 h-12 ${card.color} text-white rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            {card.icon}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{card.title}</h3>
                        <p className="text-sm text-gray-400 mb-4">{card.desc}</p>
                        <div className="flex items-center text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                            Open <BsArrowRight className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Link>
                ))}
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
