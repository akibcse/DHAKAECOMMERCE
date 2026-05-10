import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Standardized CSV Export
 */
export const exportToCSV = (headers, rows, fileName) => {
    // ... (CSV logic remains unchanged) ...
    // Escape commas and wrap in quotes for safety
    const formatCell = (cell) => {
        const stringValue = String(cell ?? "");
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    const headerRow = headers.join(",");
    const csvRows = rows.map(row => row.map(formatCell).join(","));
    const csvContent = "\uFEFF" + headerRow + "\n" + csvRows.join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Generate Invoice/Sales Memo PDF
 */
export const generateInvoicePDF = (order, brandName = "DhakaEcommerce") => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // TIMESTAMP GENERATION (YYYYMMDDHHmmss)
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14); // 20260128000000
    const fileName = `${brandName}_Invoice_${timestamp}.pdf`;

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(brandName, 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Online Shopping Platform", 14, 28);

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
        head: [['Product', 'Unit Price', 'Qty', 'Line Total']],
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
    let currentY = finalY;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Subtotal:", summaryX, currentY);
    doc.text(String(Number(order.subtotal)), pageWidth - 14, currentY, { align: "right" });
    currentY += 6;

    if (Number(order.discounts?.product) > 0) {
        doc.text("Product Discount:", summaryX, currentY);
        doc.text(`-${Number(order.discounts.product)}`, pageWidth - 14, currentY, { align: "right" });
        currentY += 6;
    }
    
    doc.text("Delivery Charge:", summaryX, currentY);
    doc.text(String(Number(order.deliveryCharge || 0)), pageWidth - 14, currentY, { align: "right" });
    currentY += 8;

    // Verified Deduction
    if (order.isAdvanceVerified) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 197, 94); // Green
        doc.text("Advance Paid:", summaryX, currentY);
        doc.text(`-${Number(order.advanceRequired || 0)}`, pageWidth - 14, currentY, { align: "right" });
        currentY += 10;
    }

    // Parcel Type Stamp
    let parcelType = "UNPAID";
    let instruction = "Collect Full Amount (Prod + Del)";
    doc.setTextColor(0, 0, 0);

    if (order.isAdvanceVerified) {
        if (Number(order.advanceRequired || 0) === Number(order.finalAmount || 0)) {
            parcelType = "FULLY PAID";
            instruction = "No Collection Required";
            doc.setLineWidth(1.5);
            doc.setDrawColor(0, 0, 0);
            doc.rect(14, currentY, pageWidth - 28, 22); 
        } else {
            parcelType = "ADVANCE PAID";
            instruction = "Collect Product Price Only";
            doc.setLineWidth(1);
            doc.rect(14, currentY, pageWidth - 28, 22);
        }
    } else {
        doc.setDrawColor(180, 180, 180);
        doc.setLineDash([2, 2], 0);
        doc.rect(14, currentY, pageWidth - 28, 22);
        doc.setLineDash([]);
        doc.setTextColor(100, 100, 100);
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PARCEL CLASSIFICATION", pageWidth / 2, currentY + 7, { align: "center", charSpace: 1 });
    doc.setFontSize(16);
    doc.text(parcelType, pageWidth / 2, currentY + 14, { align: "center", charSpace: 2 });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(instruction.toUpperCase(), pageWidth / 2, currentY + 19, { align: "center", charSpace: 1 });
    
    currentY += 32;

    // MASSIVE FINAL PAYABLE - Beautiful & Refined
    const finalPayable = Number(order.finalAmount || 0) - (order.isAdvanceVerified ? Number(order.advanceRequired || 0) : 0);
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(2);
    doc.rect(14, currentY, pageWidth - 28, 45); 
    doc.setTextColor(0, 0, 0);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL CASH TO COLLECT", pageWidth / 2, currentY + 10, { align: "center", charSpace: 2 });
    
    doc.setFontSize(50);
    doc.text(`TK ${finalPayable}`, pageWidth / 2, currentY + 35, { align: "center" });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.setFont("helvetica", "bold");
    const footerText = `DHAKAECOMMERCE LOGISTICS MANIFEST | GENERATED AT ${new Date().toLocaleTimeString()}`;
    doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center", charSpace: 1 });

    doc.save(fileName);
};

/**
 * Standardized Report PDF Export
 */
export const exportReportPDF = (title, headers, body, metrics, fileName, brandName = "DhakaEcommerce") => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // TIMESTAMP GENERATION (YYYYMMDDHHmmss) - For strict filenames
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14); // 20260128000000
    // Clean fileName from arguments to separate prefix
    const cleanFileName = fileName.replace(/_Report$/, '');
    const finalFileName = `${brandName}_${cleanFileName}_Report_${timestamp}.pdf`;

    // Branding Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(brandName, 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Online Shopping Platform", 14, 25);

    // Report Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), pageWidth - 14, 20, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 14, 25, { align: "right" });

    autoTable(doc, {
        startY: 35,
        head: headers,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Summary Totals if metrics provided
    if (metrics) {
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        Object.entries(metrics).forEach(([key, value], idx) => {
            doc.text(`${key}: ${value}`, 14, finalY + (idx * 6));
        });
    }

    doc.save(finalFileName);
};
