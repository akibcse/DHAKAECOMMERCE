import { useState, useEffect } from "react";
import { getCustomerAccounts, createOfflineSale } from "../../../utils/accountingServices";
import { toast } from "react-hot-toast";

const OfflineSales = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saleData, setSaleData] = useState({
        customerId: "",
        items: [],
        totalAmount: 0,
        paidAmount: 0,
        discount: 0,
        date: new Date().toISOString().slice(0, 10),
        note: ""
    });

    // Simple item adder state
    const [currentItem, setCurrentItem] = useState({ name: "", price: 0, quantity: 1 });

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

    const addItem = () => {
        if (!currentItem.name || currentItem.price <= 0) return;
        const newItem = { ...currentItem, total: currentItem.price * currentItem.quantity };
        const updatedItems = [...saleData.items, newItem];

        // Recalculate totals
        const newTotal = updatedItems.reduce((acc, item) => acc + item.total, 0);

        setSaleData({
            ...saleData,
            items: updatedItems,
            totalAmount: newTotal
        });
        setCurrentItem({ name: "", price: 0, quantity: 1 });
    };

    const removeItem = (index) => {
        const updatedItems = saleData.items.filter((_, i) => i !== index);
        const newTotal = updatedItems.reduce((acc, item) => acc + item.total, 0);
        setSaleData({ ...saleData, items: updatedItems, totalAmount: newTotal });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!saleData.customerId) {
            toast.error("Please select a customer");
            return;
        }
        if (saleData.totalAmount <= 0) {
            toast.error("Sale amount must be greater than 0");
            return;
        }

        try {
            await createOfflineSale(saleData);
            toast.success("Offline Sale Recorded Successfully");
            // Reset form
            setSaleData({
                customerId: "",
                items: [],
                totalAmount: 0,
                paidAmount: 0,
                discount: 0,
                date: new Date().toISOString().slice(0, 10),
                note: ""
            });
        } catch (error) {
            toast.error("Failed to record sale");
        }
    };

    const dueAmount = saleData.totalAmount - saleData.discount - saleData.paidAmount;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">New Offline Sale</h1>
                <p className="text-gray-500">Record a manual sale entry for accounting</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Customer & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                        <select
                            className="w-full px-4 py-2 border rounded-xl"
                            value={saleData.customerId}
                            onChange={(e) => setSaleData({ ...saleData, customerId: e.target.value })}
                            required
                        >
                            <option value="">-- Choose Customer --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border rounded-xl"
                            value={saleData.date}
                            onChange={(e) => setSaleData({ ...saleData, date: e.target.value })}
                            required
                        />
                    </div>
                </div>

                {/* 2. Items */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Sale Items</h3>

                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500">Item Name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Product name"
                                value={currentItem.name}
                                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-xs text-gray-500">Price</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="0"
                                value={currentItem.price}
                                onChange={(e) => setCurrentItem({ ...currentItem, price: Number(e.target.value) })}
                            />
                        </div>
                        <div className="w-20">
                            <label className="text-xs text-gray-500">Qty</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                value={currentItem.quantity}
                                onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                        >
                            Add
                        </button>
                    </div>

                    <div className="mt-4">
                        {saleData.items.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-4">No items added yet</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Item</th>
                                        <th className="px-3 py-2 text-right">Price</th>
                                        <th className="px-3 py-2 text-right">Qty</th>
                                        <th className="px-3 py-2 text-right">Total</th>
                                        <th className="px-3 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {saleData.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-2">{item.name}</td>
                                            <td className="px-3 py-2 text-right">{item.price}</td>
                                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                                            <td className="px-3 py-2 text-right">{item.total}</td>
                                            <td className="px-3 py-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(idx)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* 3. Payment & Totals */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Reference</label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-xl"
                                    rows="3"
                                    value={saleData.note}
                                    onChange={(e) => setSaleData({ ...saleData, note: e.target.value })}
                                    placeholder="Optional notes about this sale..."
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-80 space-y-3">
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Subtotal:</span>
                                <span>৳{saleData.totalAmount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Discount:</span>
                                <input
                                    type="number"
                                    className="w-24 text-right px-2 py-1 border rounded"
                                    value={saleData.discount}
                                    onChange={(e) => setSaleData({ ...saleData, discount: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-between items-center text-secondary font-bold border-t pt-2">
                                <span>Net Payable:</span>
                                <span>৳{saleData.totalAmount - saleData.discount}</span>
                            </div>
                            <div className="flex justify-between items-center text-green-600">
                                <span>Paid Now:</span>
                                <input
                                    type="number"
                                    className="w-24 text-right px-2 py-1 border rounded"
                                    value={saleData.paidAmount}
                                    onChange={(e) => setSaleData({ ...saleData, paidAmount: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-between items-center text-red-500 font-black text-xl border-t pt-2">
                                <span>DUE:</span>
                                <span>৳{dueAmount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                        Record Sale
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OfflineSales;
