import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { BRANDING } from "../config/branding";

const SalesMemoPrint = ({ order }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState("");

    useEffect(() => {
        if (order) {
            QRCode.toDataURL(`https://dhakaecommerce.com/track/${order.orderNumber}`)
                .then(url => setQrCodeUrl(url))
                .catch(err => console.error("QR Env Error", err));
        }
    }, [order]);

    if (!order) return null;

    const finalPayable = Number(order.finalAmount || 0) - (order.isAdvanceVerified ? Number(order.advanceRequired || 0) : 0);
    
    // Determine Parcel Type
    let parcelType = "UNPAID";
    let instruction = "Collect Full Amount (Prod + Del)";
    let typeClass = "border-[3px] border-black";
    
    if (order.isAdvanceVerified) {
        if (Number(order.advanceRequired || 0) === Number(order.finalAmount || 0)) {
            parcelType = "FULLY PAID";
            instruction = "No Collection Required";
            typeClass = "border-[3px] border-black bg-gray-50";
        } else {
            parcelType = "ADVANCE PAID";
            instruction = "Collect Product Price Only";
            typeClass = "border-[3px] border-black";
        }
    }

    return createPortal(
        <div className="print-only-container w-full bg-white text-black p-10 hidden print:block print:fixed print:top-0 print:left-0 print:w-full print:h-full print:z-[9999] overflow-y-auto font-sans">
            {/* Header */}
            <div className="flex justify-between items-center border-b-[3px] border-black pb-8 mb-10">
                <div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{BRANDING.name}</h1>
                    <p className="text-sm font-bold text-gray-500 tracking-[0.4em] uppercase">Official Sales Memo & Invoice</p>
                </div>
                <div className="text-right">
                    {qrCodeUrl && <img src={qrCodeUrl} alt="Order QR" className="w-24 h-24 mb-2 ml-auto" />}
                    <div className="text-2xl font-black tracking-tight">#{order.orderNumber}</div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-16 mb-12">
                <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 border-b border-gray-200 pb-2">Customer Recipient</h3>
                    <div className="font-black text-2xl text-gray-900 mb-1">{order.shippingDetails?.name}</div>
                    <div className="text-lg font-black text-black mb-3">{order.shippingDetails?.phone}</div>
                    <div className="text-[13px] leading-relaxed font-bold text-gray-600 uppercase">
                        {order.shippingDetails?.address}<br />
                        {order.shippingDetails?.city} - {order.shippingDetails?.zip}
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 border-b border-gray-200 pb-2 w-full">Order Manifest</h3>
                    <div className="text-sm font-bold mb-2"><span className="opacity-50 uppercase tracking-widest text-[10px] mr-2">Issue Date</span> {new Date(order.createdAt).toLocaleDateString()}</div>
                    <div className="text-sm font-bold mb-2"><span className="opacity-50 uppercase tracking-widest text-[10px] mr-2">Process</span> <span className="uppercase">{order.orderStatus}</span></div>
                    <div className="text-sm font-bold"><span className="opacity-50 uppercase tracking-widest text-[10px] mr-2">Method</span> {order.paymentMethod}</div>
                </div>
            </div>

            {/* Item Table */}
            <div className="mb-10">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-[3px] border-black">
                            <th className="text-left py-4 text-[11px] font-black uppercase tracking-[0.2em]">Product Specification</th>
                            <th className="text-center py-4 text-[11px] font-black uppercase tracking-[0.2em]">Rate</th>
                            <th className="text-center py-4 text-[11px] font-black uppercase tracking-[0.2em]">Qty</th>
                            <th className="text-right py-4 text-[11px] font-black uppercase tracking-[0.2em]">Line Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-100">
                        {Object.values(order.items || {}).map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-5 text-[15px] font-black text-gray-900 leading-snug pr-8">{item.name}</td>
                                <td className="py-5 text-center text-sm font-bold text-gray-600">{Number(item.discountPrice || item.price)}</td>
                                <td className="py-5 text-center text-base font-black">{item.quantity}</td>
                                <td className="py-5 text-right text-base font-black">৳{Number(item.lineTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary & Logistics */}
            <div className="grid grid-cols-5 gap-12 pt-6 border-t-[3px] border-black">
                {/* Parcel Stamp */}
                <div className={`col-span-2 p-6 rounded-3xl text-center flex flex-col justify-center ${typeClass}`}>
                    <span className="block text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-50">Logistics Parcel Type</span>
                    <h2 className="text-3xl font-black tracking-tighter mb-1 leading-none">{parcelType}</h2>
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 mt-2">{instruction}</p>
                </div>

                <div className="col-span-3 space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                        <span>Items Subtotal</span>
                        <span>৳{Number(order.subtotal)}</span>
                    </div>
                    {Number(order.discounts?.product) > 0 && (
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span>Markdown Discount</span>
                            <span>-৳{Number(order.discounts.product)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-gray-100">
                        <span>Fulfillment Fee</span>
                        <span>৳{Number(order.deliveryCharge || 0)}</span>
                    </div>
                    
                    {order.isAdvanceVerified && (
                        <div className="flex justify-between text-sm font-black text-green-600 uppercase tracking-widest pt-1">
                            <span>Verified Pre-Payment</span>
                            <span>-৳{Number(order.advanceRequired || 0)}</span>
                        </div>
                    )}

                    {/* MASSIVE FINAL PAYABLE */}
                    <div className="pt-4 border-t-[3px] border-black mt-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] mb-2 text-gray-400">Total Cash To Collect</span>
                            <div className="flex items-baseline gap-3 text-black">
                                <span className="text-3xl font-black tracking-tighter">৳</span>
                                <span className="text-8xl font-black tracking-tighter leading-none">
                                    {finalPayable}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legal Footer */}
            <div className="mt-16 pt-10 border-t border-gray-100 flex justify-between items-end">
                <div className="text-[9px] uppercase font-black tracking-[0.3em] text-gray-300">
                    Logistics ID: {order.orderId.slice(-12).toUpperCase()}
                </div>
                <div className="text-center text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">
                    Generated by {BRANDING.name} Fulfillment Center
                </div>
                <div className="text-[9px] uppercase font-black tracking-[0.3em] text-gray-300 text-right">
                    {new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SalesMemoPrint;
