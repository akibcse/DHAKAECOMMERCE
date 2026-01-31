import { useRef } from 'react';
import { BsPrinter, BsDownload } from "react-icons/bs";
import { BRAND_NAME, BRANDING } from "../config/branding"; // [FIX IMPORT]
import { jsPDF } from "jspdf"; // [FIX IMPORT]
import autoTable from "jspdf-autotable";

const SalesMemo = ({ order, isOpen, onClose }) => {
    const printRef = useRef();

    if (!isOpen || !order) return null;

    const handlePrint = () => {
        // The dedicated <SalesMemoPrint /> component in Orders.jsx will handle the printing layout via CSS
        window.print();
    };

    // Strict Filename Helper
    const getStrictFileName = () => {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        return `${BRANDING.name}_Invoice_${timestamp}.pdf`;
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(BRANDING.name.toUpperCase(), 14, 22);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(BRANDING.tagline, 14, 28);

        // Memo Info
        doc.setFontSize(10);
        doc.text("SALES MEMO / INVOICE", pageWidth - 14, 22, { align: "right" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(59, 130, 246); // Primary Color
        doc.text(`#${order.orderNumber}`, pageWidth - 14, 30, { align: "right" });
        doc.setTextColor(0, 0, 0);

        // Customer & Order Details
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("CUSTOMER DETAILS", 14, 45);
        doc.setFont("helvetica", "normal");
        doc.text(order.shippingDetails?.name || "N/A", 14, 50);
        doc.text(order.shippingDetails?.phone || "N/A", 14, 55);
        doc.text(`${order.shippingDetails?.address || ""}`, 14, 60);
        doc.text(`${order.shippingDetails?.city || ""} - ${order.shippingDetails?.zip || ""}`, 14, 65);

        doc.setFont("helvetica", "bold");
        doc.text("ORDER INFO", pageWidth - 60, 45);
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, pageWidth - 60, 50);
        doc.text(`Status: ${order.orderStatus.toUpperCase()}`, pageWidth - 60, 55);
        doc.text(`Payment: ${order.paymentMethod}`, pageWidth - 60, 60);

        // Items Table
        const tableData = Object.values(order.items || {}).map(item => [
            item.name,
            Number(item.discountPrice || item.price),
            item.quantity,
            Number(item.lineTotal)
        ]);

        autoTable(doc, {
            startY: 75,
            head: [['Item Description', 'Price', 'Qty', 'Line Total']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [31, 41, 55] },
            columnStyles: {
                3: { halign: 'right' },
                2: { halign: 'center' },
                1: { halign: 'center' }
            }
        });

        // Summary
        const finalY = doc.lastAutoTable.finalY + 10;
        const summaryX = pageWidth - 70;

        doc.setFontSize(10);
        doc.text("Subtotal:", summaryX, finalY);
        doc.text(String(Number(order.subtotal)), pageWidth - 14, finalY, { align: "right" });

        let currentY = finalY + 6;
        if (Number(order.discounts?.product) > 0) {
            doc.text("Product Discount:", summaryX, currentY);
            doc.text(`-${Number(order.discounts.product)}`, pageWidth - 14, currentY, { align: "right" });
            currentY += 6;
        }
        if (Number(order.discounts?.coupon) > 0) {
            doc.text("Coupon Discount:", summaryX, currentY);
            doc.text(`-${Number(order.discounts.coupon)}`, pageWidth - 14, currentY, { align: "right" });
            currentY += 6;
        }
        if (Number(order.walletUsed) > 0) {
            doc.text("Wallet Deduction:", summaryX, currentY);
            doc.text(`-${Number(order.walletUsed)}`, pageWidth - 14, currentY, { align: "right" });
            currentY += 6;
        }

        doc.text("Delivery Charge:", summaryX, currentY);
        doc.text(String(Number(order.deliveryCharge)), pageWidth - 14, currentY, { align: "right" });
        currentY += 10;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(59, 130, 246);
        doc.text("TOTAL PAID:", summaryX, currentY);
        doc.text(String(Number(order.finalAmount)), pageWidth - 14, currentY, { align: "right" });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        const footerText = `Thank you for shopping at ${BRANDING.name} | Generated on ${new Date().toLocaleString()}`;
        doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

        doc.save(getStrictFileName());
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 print:hidden">
            <div className="absolute inset-0 bg-dark/80 backdrop-blur-md" onClick={onClose} />
            <div id="sales-memo-content" className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] lg:h-auto">
                {/* Header Actions - Hidden in Print via CSS above (body * none) or explicit print:hidden */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 print:hidden">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Sales Memo Preview</h2>
                    <div className="flex gap-3">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all">
                            <BsPrinter size={16} /> Print
                        </button>
                        <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20">
                            <BsDownload size={16} /> PDF
                        </button>
                        <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-300 transition-all">
                            Close
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto p-12" ref={printRef}>
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">{BRANDING.name.toUpperCase()}</h1>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">{BRANDING.tagline}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sales Memo No</div>
                            <div className="text-2xl font-black text-primary tracking-tighter">#{order.orderNumber}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer Details</h3>
                            <div className="font-black text-gray-900 text-lg mb-1">{order.shippingDetails?.name}</div>
                            <div className="text-sm text-gray-500 font-bold mb-2">{order.shippingDetails?.phone}</div>
                            <div className="text-sm text-gray-600 font-medium leading-loose">
                                {order.shippingDetails?.address}<br />
                                {order.shippingDetails?.city} - {order.shippingDetails?.zip}
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Order Info</h3>
                            <div className="text-sm font-bold text-gray-900 mb-1">Date: {new Date(order.createdAt).toLocaleDateString()}</div>
                            <div className="text-sm font-bold text-gray-900 mb-1 text-primary lowercase">Status: {order.orderStatus.toUpperCase()}</div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mt-4">Payment Method</div>
                            <div className="text-sm font-bold text-gray-900">{order.paymentMethod}</div>
                        </div>
                    </div>

                    <table className="w-full mb-12 border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-900">
                                <th className="text-left py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Description</th>
                                <th className="text-center py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                                <th className="text-center py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                                <th className="text-right py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Line Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(order.items || {}).map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="py-5 font-bold text-gray-900">{item.name}</td>
                                    <td className="py-5 text-center font-bold text-gray-600">৳{Number(item.discountPrice || item.price)}</td>
                                    <td className="py-5 text-center font-bold text-gray-900">{item.quantity}</td>
                                    <td className="py-5 text-right font-black text-gray-900">৳{Number(item.lineTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end pr-0">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>Subtotal</span>
                                <span>৳{Number(order.subtotal)}</span>
                            </div>
                            {Number(order.discounts?.product) > 0 && (
                                <div className="flex justify-between text-sm font-bold text-green-600">
                                    <span>Product Discount</span>
                                    <span>-৳{Number(order.discounts.product)}</span>
                                </div>
                            )}
                            {Number(order.discounts?.coupon) > 0 && (
                                <div className="flex justify-between text-sm font-bold text-green-600">
                                    <span>Coupon Discount</span>
                                    <span>-৳{Number(order.discounts.coupon)}</span>
                                </div>
                            )}
                            {Number(order.walletUsed) > 0 && (
                                <div className="flex justify-between text-sm font-bold text-yellow-600">
                                    <span>Wallet Deduction</span>
                                    <span>-৳{Number(order.walletUsed)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>Delivery Charge</span>
                                <span>৳{Number(order.deliveryCharge)}</span>
                            </div>
                            <div className="flex justify-between text-2xl font-black text-primary pt-4 border-t-2 border-primary mt-2">
                                <span>TOTAL</span>
                                <span>৳{Number(order.finalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 border-t border-gray-50 pt-8 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <div>Thank you for shopping at {BRAND_NAME}</div>
                        <div>Generated on {new Date().toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesMemo;
