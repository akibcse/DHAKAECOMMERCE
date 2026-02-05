import { useState, useEffect, useRef } from "react";
import { getReceipts, getCustomerAccounts } from "../../../utils/accountingServices";
import { BsPrinter, BsSearch, BsFilter } from "react-icons/bs";
import MoneyReceiptPrint from "../../../components/MoneyReceiptPrint";
import MoneyReceiptHistoryPrint from "../../../components/MoneyReceiptHistoryPrint";

const MoneyReceiptList = () => {
    const [receipts, setReceipts] = useState([]);
    const [customers, setCustomers] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredReceipts, setFilteredReceipts] = useState([]);

    // Print State
    const [printData, setPrintData] = useState(null);
    const [printHistory, setPrintHistory] = useState(false); // State for history print
    const printRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterReceipts();
    }, [receipts, searchTerm, customers]);

    // Watch for printData changes to trigger individual print
    useEffect(() => {
        if (printData && printRef.current) {
            // Short timeout to allow render
            const timer = setTimeout(() => {
                window.print();
                setPrintData(null); // Reset to allow re-printing same receipt
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [printData]);

    // Watch for printHistory changes to trigger list print
    useEffect(() => {
        if (printHistory) {
            const timer = setTimeout(() => {
                window.print();
                setPrintHistory(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [printHistory]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [receiptsData, customersData] = await Promise.all([
                getReceipts(),
                getCustomerAccounts()
            ]);

            // Create customer map for O(1) lookup
            const custMap = {};
            customersData.forEach(c => {
                custMap[c.id] = c;
            });
            setCustomers(custMap);

            // Sort by date desc
            const sortedReceipts = receiptsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setReceipts(sortedReceipts);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterReceipts = () => {
        if (!searchTerm) {
            setFilteredReceipts(receipts);
            return;
        }
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = receipts.filter(r =>
            r.receiptNo.toLowerCase().includes(lowerTerm) ||
            (customers[r.customerId]?.name || "").toLowerCase().includes(lowerTerm) ||
            r.paymentMode.toLowerCase().includes(lowerTerm)
        );
        setFilteredReceipts(filtered);
    };

    const handlePrint = (receipt) => {
        const customer = customers[receipt.customerId];
        const amount = Number(receipt.amount || 0);
        // Estimate remaining due: Current Balance - Amount (Assuming Current Balance includes this payment? No, usually balance is updated. 
        // Wait, currentBalance in `customers` state comes from `getCustomerAccounts` which calculates real-time balance.
        // If we want "Due After Payment", it IS the `currentBalance`.
        // If we want "Due Before Payment", it is `currentBalance + amount`.
        // Let's safe guard.
        const currentBalance = Number(customer?.currentBalance || 0);

        const data = {
            receiptNo: receipt.receiptNo || "N/A",
            customerName: customer ? customer.name : "Unknown Customer",
            date: receipt.date,
            amount: amount,
            paymentMode: receipt.paymentMode,
            reference: receipt.reference || "",
            remainingDue: currentBalance // Showing current balance as remaining due
        };
        setPrintData(data);
    };

    // Function to trigger full history print
    const handlePrintHistory = () => {
        setPrintHistory(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="mb-2">
                        <a href="/admin/accounting" className="text-gray-500 hover:text-primary flex items-center gap-2 text-sm">
                            &larr; Back to Dashboard
                        </a>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">Money Receipts History</h1>
                        <button
                            onClick={handlePrintHistory}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-black transition-all"
                        >
                            <BsPrinter /> Print List
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm">View and print past money receipts</p>
                </div>
                <div className="relative">
                    <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search receipts..."
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Receipt No</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Customer</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Payment Mode</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right text-sm">Paid Amount</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right text-sm">Ref.</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-center text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        Loading receipts...
                                    </td>
                                </tr>
                            ) : filteredReceipts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No receipts found
                                    </td>
                                </tr>
                            ) : (
                                filteredReceipts.map((receipt) => (
                                    <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {new Date(receipt.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800 text-sm">
                                            {receipt.receiptNo}
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 font-medium text-sm">
                                            {customers[receipt.customerId]?.name || "Unknown"}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs uppercase font-bold">
                                                {receipt.paymentMode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600 text-sm">
                                            ৳{Number(receipt.amount || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500 text-xs font-mono">
                                            {receipt.reference || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handlePrint(receipt)}
                                                className="p-2 hover:bg-gray-100 text-gray-600 hover:text-primary rounded-lg transition-colors"
                                                title="Print Receipt"
                                            >
                                                <BsPrinter size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Print Components */}
            <div ref={printRef}>
                {printData && <MoneyReceiptPrint data={printData} />}
            </div>
            {/* Full History Print Component - Conditionally rendered content, but component itself mounts portal if props passed */}
            {printHistory && <MoneyReceiptHistoryPrint receipts={filteredReceipts} customers={customers} />}
        </div>
    );
};

export default MoneyReceiptList;
