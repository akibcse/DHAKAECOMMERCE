import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BsX, BsDownload, BsPrinter, BsCheck2Circle, BsBoxSeam } from "react-icons/bs";
import { generateInvoicePDF } from "../utils/exportUtils";
import SalesMemoPrint from "./SalesMemoPrint";

const SalesMemo = ({ order, isOpen, onClose }) => {
    if (!order) return null;

    const finalPayable = Number(order.finalAmount || 0) - (order.isAdvanceVerified ? Number(order.advanceRequired || 0) : 0);

    // Determine Parcel Type
    let parcelType = "UNPAID";
    let instruction = "Collect Full Amount (Prod + Del)";
    let typeColor = "text-amber-600 bg-amber-50 border-amber-200";
    
    if (order.isAdvanceVerified) {
        if (Number(order.advanceRequired || 0) === Number(order.finalAmount || 0)) {
            parcelType = "FULLY PAID";
            instruction = "No Collection Required";
            typeColor = "text-green-600 bg-green-50 border-green-200";
        } else {
            parcelType = "ADVANCE PAID";
            instruction = "Collect Product Price Only";
            typeColor = "text-blue-600 bg-blue-50 border-blue-200";
        }
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl h-[92vh] flex flex-col font-sans"
                    >
                        {/* Premium Header */}
                        <div className="flex justify-between items-center p-8 bg-white border-b border-gray-100">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-gray-900 text-white rounded-3xl shadow-xl shadow-gray-200">
                                    <BsBoxSeam size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Invoice Preview</h2>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">System Manifest #{order.orderNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => generateInvoicePDF(order)}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    <BsDownload size={16} /> PDF
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                                >
                                    <BsPrinter size={16} /> Print
                                </button>
                                <button onClick={onClose} className="p-4 bg-white text-gray-400 rounded-2xl hover:text-gray-900 transition-all border border-gray-100">
                                    <BsX size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Beautiful Content Preview */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
                                {/* Customer Info */}
                                <div className="md:col-span-3 p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Shipment Recipient</h3>
                                    <div className="space-y-4">
                                        <p className="text-3xl font-black text-gray-900 tracking-tight">{order.shippingDetails?.name}</p>
                                        <p className="text-xl font-black text-primary">{order.shippingDetails?.phone}</p>
                                        <p className="text-gray-500 leading-relaxed font-bold text-sm uppercase">
                                            {order.shippingDetails?.address}<br />
                                            {order.shippingDetails?.city} - {order.shippingDetails?.zip}
                                        </p>
                                    </div>
                                </div>

                                {/* Parcel Stamp */}
                                <div className={`md:col-span-2 p-10 rounded-[2.5rem] border-[3px] flex flex-col items-center justify-center text-center shadow-sm ${typeColor}`}>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60">Logistics Classification</span>
                                    <h3 className="text-4xl font-black italic tracking-tighter mb-2 leading-none">{parcelType}</h3>
                                    <p className="text-[11px] font-black uppercase tracking-[0.1em] opacity-80">{instruction}</p>
                                </div>
                            </div>

                            {/* Refined Item List */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Details</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Qty</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {Object.values(order.items || {}).map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-gray-50/50 transition-all">
                                                <td className="px-10 py-8 font-black text-gray-900 text-lg leading-tight">{item.name}</td>
                                                <td className="px-10 py-8 font-black text-center text-gray-900 text-lg">{item.quantity}</td>
                                                <td className="px-10 py-8 font-black text-right text-gray-900 text-lg">৳{item.lineTotal}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Premium Payable Section */}
                            <div className="flex flex-col items-center gap-10 py-6 pb-12">
                                <div className="flex flex-col items-center p-14 bg-white border-[4px] border-gray-900 text-gray-900 rounded-[4rem] w-full max-w-3xl shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all">
                                        <BsCheck2Circle size={180} />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.5em] mb-8 text-gray-400">Total Cash Amount To Collect</span>
                                    <div className="flex items-baseline gap-5">
                                        <span className="text-5xl font-black tracking-tighter text-secondary">৳</span>
                                        <span className="text-[10rem] font-black tracking-tighter leading-none">
                                            {finalPayable}
                                        </span>
                                    </div>
                                    {finalPayable === 0 && (
                                        <div className="mt-10 px-10 py-4 bg-green-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-green-100">
                                            <BsCheck2Circle size={20} /> Verified Full Payment
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-6 w-full max-w-3xl">
                                    <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Subtotal</span>
                                        <span className="text-xl font-black text-gray-900">৳{order.subtotal}</span>
                                    </div>
                                    <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fulfillment</span>
                                        <span className="text-xl font-black text-gray-900">৳{order.deliveryCharge}</span>
                                    </div>
                                    <div className="p-8 bg-green-50 rounded-3xl border border-green-100 flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-black text-green-600/50 uppercase tracking-widest">Verified Paid</span>
                                        <span className="text-xl font-black text-green-600">-৳{order.isAdvanceVerified ? order.advanceRequired : 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
            <SalesMemoPrint order={order} />
        </AnimatePresence>
    );
};

export default SalesMemo;
