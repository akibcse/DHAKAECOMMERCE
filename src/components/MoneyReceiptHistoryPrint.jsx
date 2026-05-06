import React from 'react';
import { createPortal } from "react-dom";

const MoneyReceiptHistoryPrint = ({ receipts, customers, isActive }) => {
    // receipts: Array of receipt objects
    // customers: Map of customerId -> Customer object
    // isActive: Boolean to control print visibility

    // Always mounted, but hidden if not active
    const safeReceipts = receipts || [];

    return createPortal(
        <div className={isActive ? 'print-portal' : 'hidden'}>
            <style type="text/css">
                {`
                    @media print {
                        html, body, #root {
                            height: auto !important;
                            min-height: auto !important;
                            overflow: visible !important;
                        }
                        body > *:not(.print-portal) {
                            display: none !important;
                        }
                        .print-portal {
                            display: block !important;
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 100% !important;
                            height: auto !important;
                            z-index: 9999 !important;
                            background: white !important;
                            color: black !important;
                        }
                    }
                `}
            </style>

            <div className="bg-white p-8 font-sans">
                {/* Header */}
                <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
                    <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">DhakaEcommerce</h1>
                    <p className="text-sm font-semibold tracking-wider text-gray-600">Money Receipt History</p>
                    <p className="text-xs text-gray-500 mt-2">Generated: {new Date().toLocaleString()}</p>
                </div>

                {/* Table */}
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="px-2 py-2 text-sm font-bold uppercase">Date</th>
                            <th className="px-2 py-2 text-sm font-bold uppercase">Receipt No</th>
                            <th className="px-2 py-2 text-sm font-bold uppercase">Customer</th>
                            <th className="px-2 py-2 text-sm font-bold uppercase">Mode</th>
                            <th className="px-2 py-2 text-sm font-bold uppercase text-right">Amount</th>
                            <th className="px-2 py-2 text-sm font-bold uppercase text-right">Ref</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {safeReceipts.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-2 py-4 text-center text-gray-500 italic">No receipts to display</td>
                            </tr>
                        ) : (
                            safeReceipts.map((receipt, idx) => {
                                const amount = Number(receipt.amount || 0);
                                return (
                                    <tr key={receipt.id || idx}>
                                        <td className="px-2 py-2 text-sm">{new Date(receipt.date).toLocaleDateString()}</td>
                                        <td className="px-2 py-2 text-sm font-mono">{receipt.receiptNo}</td>
                                        <td className="px-2 py-2 text-sm">{customers[receipt.customerId]?.name || "Unknown"}</td>
                                        <td className="px-2 py-2 text-sm capitalize">{receipt.paymentMode}</td>
                                        <td className="px-2 py-2 text-sm font-bold text-right">৳{amount.toFixed(2)}</td>
                                        <td className="px-2 py-2 text-xs text-right">{receipt.reference || "-"}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {safeReceipts.length > 0 && (
                        <tfoot>
                            <tr className="border-t-2 border-black">
                                <td colSpan="4" className="px-2 py-3 text-right font-bold uppercase">Total Collected:</td>
                                <td className="px-2 py-3 text-right font-bold text-lg">
                                    ৳{safeReceipts.reduce((acc, r) => acc + Number(r.amount || 0), 0).toFixed(2)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>,
        document.body
    );
};

export default MoneyReceiptHistoryPrint;
