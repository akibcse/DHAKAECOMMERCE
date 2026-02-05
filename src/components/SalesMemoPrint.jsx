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

    return createPortal(
        <div className="print-only-container w-full bg-white text-black p-8 hidden print:block print:fixed print:top-0 print:left-0 print:w-full print:h-full print:z-[9999] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                <div>
                    <h1 className="text-4xl font-bold uppercase tracking-tighter mb-1">{BRANDING.name}</h1>
                    <p className="text-sm font-medium text-gray-600 tracking-[0.3em] uppercase">Sales Memo / Invoice</p>
                </div>
                <div className="text-right">
                    {qrCodeUrl && <img src={qrCodeUrl} alt="Order QR" className="w-24 h-24 mb-2 ml-auto" />}
                    <div className="text-xl font-bold">#{order.orderNumber}</div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-12 mb-8">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 border-b border-gray-200 pb-1">Customer Details</h3>
                    <div className="font-bold text-lg">{order.shippingDetails?.name}</div>
                    <div className="text-sm mb-1">{order.shippingDetails?.phone}</div>
                    <div className="text-sm leading-relaxed text-gray-600">
                        {order.shippingDetails?.address}<br />
                        {order.shippingDetails?.city} - {order.shippingDetails?.zip}
                    </div>
                </div>
                <div className="text-right">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 border-b border-gray-200 pb-1">Order Info</h3>
                    <div className="text-sm font-medium mb-1"><span className="text-gray-500">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</div>
                    <div className="text-sm font-medium mb-1"><span className="text-gray-500">Status:</span> <span className="uppercase">{order.orderStatus}</span></div>
                    <div className="text-sm font-medium"><span className="text-gray-500">Payment:</span> {order.paymentMethod}</div>
                </div>
            </div>

            {/* Item Table */}
            <table className="w-full mb-8 border-collapse">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left py-2 text-xs font-bold uppercase tracking-widest">Product</th>
                        <th className="text-center py-2 text-xs font-bold uppercase tracking-widest">Price</th>
                        <th className="text-center py-2 text-xs font-bold uppercase tracking-widest">Qty</th>
                        <th className="text-right py-2 text-xs font-bold uppercase tracking-widest">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {Object.values(order.items || {}).map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-3 text-sm font-bold">{item.name}</td>
                            <td className="py-3 text-center text-sm">{Number(item.discountPrice || item.price)}</td>
                            <td className="py-3 text-center text-sm font-bold">{item.quantity}</td>
                            <td className="py-3 text-right text-sm font-bold">{Number(item.lineTotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Summary */}
            <div className="flex justify-end border-t-2 border-black pt-6">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span>Subtotal</span>
                        <span>{Number(order.subtotal)}</span>
                    </div>
                    {Number(order.discounts?.product) > 0 && (
                        <div className="flex justify-between text-sm font-medium text-gray-600">
                            <span>Product Discount</span>
                            <span>-{Number(order.discounts.product)}</span>
                        </div>
                    )}
                    {Number(order.discounts?.coupon) > 0 && (
                        <div className="flex justify-between text-sm font-medium text-gray-600">
                            <span>Coupon Discount</span>
                            <span>-{Number(order.discounts.coupon)}</span>
                        </div>
                    )}
                    {Number(order.walletUsed) > 0 && (
                        <div className="flex justify-between text-sm font-medium text-gray-600">
                            <span>Wallet Credit</span>
                            <span>-{Number(order.walletUsed)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm font-medium text-gray-600 border-b border-gray-200 pb-2">
                        <span>Delivery</span>
                        <span>{Number(order.deliveryCharge)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 text-black">
                        <span>TOTAL</span>
                        <span>{Number(order.finalAmount)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-100 text-center text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                Generated by {BRANDING.name} • {new Date().toLocaleString()}
            </div>
        </div>,
        document.body
    );
};

export default SalesMemoPrint;
