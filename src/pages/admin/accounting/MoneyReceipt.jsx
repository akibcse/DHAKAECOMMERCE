import { useState, useEffect } from "react";
import { getCustomerAccounts, createMoneyReceipt, validatePayment } from "../../../utils/accountingServices";
import { toast } from "react-hot-toast";
import SuccessModal from "../../../components/SuccessModal";
import MoneyReceiptPrint from "../../../components/MoneyReceiptPrint";

const MoneyReceipt = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [receiptData, setReceiptData] = useState({
        customerId: "",
        amount: 0,
        paymentMode: "cash",
        reference: "",
        date: new Date().toISOString().slice(0, 10),
        linkedSaleId: null // Optional
    });

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastReceiptData, setLastReceiptData] = useState(null);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!receiptData.customerId) {
            toast.error("Please select a customer");
            return;
        }
        if (receiptData.amount <= 0) {
            toast.error("Amount must be greater than 0");
            return;
        }

        // Validate payment
        const validation = await validatePayment(receiptData.customerId, Number(receiptData.amount));
        if (!validation.valid) {
            toast.error(validation.message);
            return;
        }

        // Warn if creating advance
        if (validation.willCreateAdvance) {
            if (!window.confirm(validation.warning + " Continue?")) {
                return;
            }
        }

        try {
            const receiptId = await createMoneyReceipt(receiptData);

            // Prepare success data
            const customer = customers.find(c => c.id === receiptData.customerId);
            const currentDue = customer ? (customer.currentBalance || 0) : 0;
            // Note: currentBalance is BEFORE this payment in the state, but `createMoneyReceipt` updates DB.
            // We can estimate robustly:
            const remainingDue = currentDue - Number(receiptData.amount);

            const successData = {
                receiptNo: `NEW`, // Ideally returned from createMoneyReceipt
                customerName: customer ? customer.name : "Customer",
                date: receiptData.date,
                amount: Number(receiptData.amount || 0),
                paymentMode: receiptData.paymentMode,
                reference: receiptData.reference,
                remainingDue: Number(remainingDue || 0)
            };

            setLastReceiptData(successData);
            setShowSuccessModal(true);

            setReceiptData({
                customerId: "",
                amount: 0,
                paymentMode: "cash",
                reference: "",
                date: new Date().toISOString().slice(0, 10),
                linkedSaleId: null
            });

            // Optimistic update for UI dropdown
            setCustomers(prev => prev.map(c => {
                if (c.id === receiptData.customerId) {
                    return {
                        ...c,
                        currentBalance: remainingDue
                    };
                }
                return c;
            }));

        } catch (error) {
            toast.error("Failed to record receipt");
        }
    };

    const selectedCustomer = customers.find(c => c.id === receiptData.customerId);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                data={lastReceiptData}
                type="receipt"
                onPrint={() => window.print()}
            />

            {/* Hidden Print Component */}
            <MoneyReceiptPrint data={lastReceiptData} />

            <div className="print:hidden">
                <div className="mb-6">
                    <div className="mb-2">
                        <a href="/admin/accounting" className="text-gray-500 hover:text-primary flex items-center gap-2 text-sm">
                            &larr; Back to Dashboard
                        </a>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Money Receipt</h1>
                    <p className="text-gray-500">Receive payment from customer</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">

                    {/* Customer Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer *
                        </label>
                        <select
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                            value={receiptData.customerId}
                            onChange={(e) => setReceiptData({ ...receiptData, customerId: e.target.value })}
                            required
                        >
                            <option value="">Select Customer</option>
                            {customers.map(customer => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name} - {customer.phone} (Due: ৳{customer.currentBalance})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount & Date */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 border rounded-xl font-bold text-lg"
                                placeholder="0.00"
                                value={receiptData.amount}
                                onChange={(e) => setReceiptData({ ...receiptData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 border rounded-xl"
                                value={receiptData.date}
                                onChange={(e) => setReceiptData({ ...receiptData, date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                        <div className="flex gap-4">
                            {['cash', 'bank', 'mobile', 'cheque'].map(mode => (
                                <label key={mode} className={`
                                        flex-1 py-3 px-4 rounded-xl border text-center cursor-pointer capitalize transition-all
                                        ${receiptData.paymentMode === mode
                                        ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }
                                    `}>
                                    <input
                                        type="radio"
                                        name="paymentMode"
                                        value={mode}
                                        checked={receiptData.paymentMode === mode}
                                        onChange={(e) => setReceiptData({ ...receiptData, paymentMode: e.target.value })}
                                        className="hidden"
                                    />
                                    {mode}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Reference */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Note</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border rounded-xl text-gray-600"
                            placeholder="e.g. Cheque No, Transaction ID..."
                            value={receiptData.reference}
                            onChange={(e) => setReceiptData({ ...receiptData, reference: e.target.value })}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                        >
                            Generate Receipt
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-4">
                            This will automatically update the customer's ledger balance.
                        </p>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default MoneyReceipt;
