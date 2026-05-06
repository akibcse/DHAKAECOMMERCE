import React from 'react';
import { createPortal } from "react-dom";

const MoneyReceiptPrint = ({ data, isActive }) => {
    // ALWAYS MOUNTED: Ensure defaults if data is null
    const safeData = data || {};

    // Default values to prevent crash and ensure "Always Mounted" writes something
    const {
        receiptNo = "N/A",
        date = new Date().toISOString(),
        customerName = "N/A",
        paymentMode = "N/A",
        reference = "",
    } = safeData;

    // Numerical Normalization
    const amount = Number(safeData.amount || 0);
    const remainingDue = Number(safeData.remainingDue || 0);

    return createPortal(
        <div className={isActive ? 'print-component' : 'hidden'}>
            <style type="text/css">
                {`
                    @media print {
                        /* HIDE EVERYTHING ELSE */
                        body {
                            visibility: hidden;
                        }
                        
                        /* SHOW PRINT COMPONENT */
                        .print-component, .print-component * {
                            visibility: visible !important;
                        }

                        /* POSITIONING */
                        .print-component {
                            display: block !important;
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            height: auto !important;
                            z-index: 99999 !important;
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            overflow: visible !important;
                        }
                        
                        /* RESET GLOBAL STYLES THAT MIGHT INTERFERE */
                        html, body, #root {
                            height: auto !important;
                            overflow: visible !important;
                        }
                    }
                `}
            </style>

            <div className="bg-white text-black p-8 font-serif leading-relaxed h-full relative print:p-0">
                <div className="border-4 border-gray-800 p-8 relative">
                    {/* Header */}
                    <div className="text-center border-b-2 border-gray-800 pb-6 mb-8 group">
                        <h1 className="text-4xl font-black uppercase tracking-widest mb-2">DhakaEcommerce</h1>
                        <p className="text-sm font-semibold tracking-wider text-gray-600">PREMIUM FASHION & LIFESTYLE</p>
                        <div className="mt-4 inline-block bg-gray-800 text-white px-8 py-2 text-xl font-bold uppercase tracking-[0.2em]">Money Receipt</div>
                    </div>

                    {/* Receipt Details */}
                    <div className="flex justify-between items-start mb-8 font-semibold">
                        <div className="space-y-2">
                            <div>Receipt No: <span className="font-mono text-lg ml-2">{receiptNo}</span></div>
                            <div>Date: <span className="ml-2">{new Date(date).toLocaleDateString()}</span></div>
                            <div>Ref: <span className="ml-2 uppercase">{reference || 'N/A'}</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Authorized Copy</div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6 mb-12">
                        <div className="flex items-baseline border-b border-gray-300 pb-2">
                            <span className="w-40 font-bold uppercase text-xs tracking-wider text-gray-500">Received With Thanks From</span>
                            <span className="flex-1 font-bold text-xl px-4">{customerName}</span>
                        </div>

                        <div className="flex items-baseline border-b border-gray-300 pb-2">
                            <span className="w-40 font-bold uppercase text-xs tracking-wider text-gray-500">The Sum Of (Taka)</span>
                            <span className="flex-1 font-bold text-xl px-4 italic capitalize">
                                ৳ {amount}
                            </span>
                        </div>

                        <div className="flex items-baseline border-b border-gray-300 pb-2">
                            <span className="w-40 font-bold uppercase text-xs tracking-wider text-gray-500">Payment Mode</span>
                            <span className="flex-1 font-bold text-xl px-4 capitalize">{paymentMode}</span>
                        </div>
                    </div>

                    {/* Financial Summary Box */}
                    <div className="flex justify-end mb-16">
                        <div className="w-1/2 border-2 border-gray-800 p-4 space-y-2">
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span>PAID AMOUNT:</span>
                                <span className="text-xl">৳{amount}</span>
                            </div>
                            <div className="border-t border-gray-400 my-2"></div>
                            <div className="flex justify-between items-center text-xs text-gray-600 font-semibold">
                                <span>Remaining Due:</span>
                                <span>৳{remainingDue}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="flex justify-between items-end mt-auto pt-10">
                        <div className="text-center">
                            <div className="border-t border-gray-400 w-40 mb-2"></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Customer Signature</span>
                        </div>

                        <div className="text-center">
                            <div className="border-t border-gray-400 w-40 mb-2"></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Authorized Signature</span>
                        </div>
                    </div>

                    {/* Print Date Footer */}
                    <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-gray-400 uppercase tracking-widest">
                        Generated by DhakaEcommerce System • {new Date().toLocaleString()}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MoneyReceiptPrint;
