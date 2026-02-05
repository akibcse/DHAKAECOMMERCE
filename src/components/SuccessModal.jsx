import React from 'react';
import { BsCheckCircle, BsPrinter, BsX } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";

const SuccessModal = ({ isOpen, onClose, data, type, onPrint }) => {
    if (!isOpen || !data) return null;

    const isSale = type === 'sale';
    const isReceipt = type === 'receipt';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 text-center"
                >
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        <BsX size={24} />
                    </button>

                    <div className="mb-6 flex justify-center">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-lg shadow-green-100/50">
                            <BsCheckCircle size={40} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                        {isSale ? 'Sale Recorded Successfully' : 'Payment Received Successfully'}
                    </h2>
                    
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-6 space-y-3">
                        {isSale && (
                            <>
                                <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2 mb-2">
                                    <span className="text-gray-500 font-medium">Invoice No</span>
                                    <span className="font-bold text-gray-900 font-mono">{data.orderNumber}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Total Amount</span>
                                    <span className="font-black text-gray-900">৳{data.netAmount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Paid</span>
                                    <span className="font-bold text-green-600">৳{data.paidAmount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 mt-2">
                                    <span className="text-gray-500 font-medium">Due</span>
                                    <span className="font-bold text-red-500">৳{data.dueAmount}</span>
                                </div>
                            </>
                        )}

                        {isReceipt && (
                            <>
                                <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2 mb-2">
                                    <span className="text-gray-500 font-medium">Receipt No</span>
                                    <span className="font-bold text-gray-900 font-mono">{data.receiptNo}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Customer</span>
                                    <span className="font-bold text-gray-900">{data.customerName}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Paid Amount</span>
                                    <span className="font-black text-green-600 text-lg">৳{data.amount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 mt-2">
                                    <span className="text-gray-500 font-medium">Remaining Due</span>
                                    <span className="font-bold text-red-500">
                                        ৳{data.remainingDue}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                        {onPrint && (
                            <button
                                onClick={onPrint}
                                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg hover:-translate-y-1"
                            >
                                <BsPrinter size={18} /> Print
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SuccessModal;
