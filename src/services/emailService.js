import { ref, push, set } from 'firebase/database';
import { db } from '../firebase/firebase';

/**
 * Brevo Email Service
 * Sends emails using Brevo API (formerly Sendinblue)
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = import.meta.env.VITE_BREVO_SMTP_KEY;
// IMPORTANT: Use the email you verified with Brevo
const SENDER_EMAIL = import.meta.env.VITE_SENDER_EMAIL || 'mdakibhasan2026@gmail.com'; // Fallback to a likely personal email for testing if env missing
const SENDER_NAME = import.meta.env.VITE_SENDER_NAME || 'DhakaEcommerce';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@dhakaecommerce.com';

/**
 * Send email via Brevo API
 */
async function sendBrevoEmail({ to, subject, htmlContent, textContent }) {
    console.log(`📧 Attempting to send email to: ${to} from: ${SENDER_EMAIL}`);
    try {
        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: SENDER_NAME,
                    email: SENDER_EMAIL
                },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent,
                textContent: textContent || subject
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Brevo API Error:', data);
            throw new Error(data.message || 'Email sending failed');
        }

        console.log('✅ Brevo API Success:', data);
        return data;
    } catch (error) {
        console.error('Brevo email error:', error);
        throw error;
    }
}

/**
 * Log email to Firebase
 */
async function logEmail({ type, to, subject, status, error, referenceId }) {
    try {
        const logRef = push(ref(db, 'emailLogs'));
        await set(logRef, {
            id: logRef.key,
            type,
            to,
            subject,
            status,
            error: error || null,
            referenceId: referenceId || null,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Email logging error:', err);
    }
}

/**
 * Send email with fail-safe handling
 */
export async function sendEmailSafe({ type, to, subject, htmlContent, textContent, referenceId }) {
    try {
        await sendBrevoEmail({ to, subject, htmlContent, textContent });
        await logEmail({ type, to, subject, status: 'sent', referenceId });
        console.log(`✅ Email sent: ${type} to ${to}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Email failed: ${type} to ${to}`, error);
        await logEmail({ type, to, subject, status: 'failed', error: error.message, referenceId });
        return { success: false, error: error.message };
    }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userEmail, userName) {
    const subject = `Welcome to ${SENDER_NAME}!`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to ${SENDER_NAME}!</h2>
            <p>Hi ${userName || 'there'},</p>
            <p>Thank you for registering with ${SENDER_NAME}. We're excited to have you on board!</p>
            <p>You can now:</p>
            <ul>
                <li>Browse our products</li>
                <li>Place orders</li>
                <li>Track your order history</li>
            </ul>
            <p>If you have any questions, feel free to contact us.</p>
            <p>Best regards,<br>${SENDER_NAME} Team</p>
        </div>
    `;

    return sendEmailSafe({
        type: 'registration',
        to: userEmail,
        subject,
        htmlContent,
        textContent: `Welcome to ${SENDER_NAME}! Thank you for registering.`
    });
}

/**
 * Send order confirmation to customer
 */
export async function sendOrderConfirmation(order, customerEmail, customerName) {
    const subject = `Order Confirmation - ${order.orderNumber}`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Order Confirmed!</h2>
            <p>Hi ${customerName || 'Customer'},</p>
            <p>Your order has been successfully placed.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Total Amount:</strong> ৳${order.totalAmount}</p>
                ${order.discount > 0 ? `<p><strong>Discount:</strong> ৳${order.discount}</p>` : ''}
                <p><strong>Net Amount:</strong> ৳${order.netAmount || order.totalAmount}</p>
                <p><strong>Paid:</strong> ৳${order.paidAmount}</p>
                <p><strong>Due:</strong> ৳${order.dueAmount}</p>
                <p><strong>Status:</strong> ${order.orderStatus || 'Pending'}</p>
            </div>
            <p>Thank you for your order!</p>
            <p>Best regards,<br>${SENDER_NAME} Team</p>
        </div>
    `;

    return sendEmailSafe({
        type: 'order',
        to: customerEmail,
        subject,
        htmlContent,
        textContent: `Order ${order.orderNumber} confirmed. Total: ৳${order.totalAmount}`,
        referenceId: order.id
    });
}

/**
 * Send order alert to admin
 */
export async function sendAdminOrderAlert(order, customerName) {
    const subject = `New Order Received - ${order.orderNumber}`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF9800;">New Order Alert</h2>
            <p>A new order has been placed.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Total Amount:</strong> ৳${order.totalAmount}</p>
                <p><strong>Due Amount:</strong> ৳${order.dueAmount}</p>
                <p><strong>Source:</strong> ${order.source || 'offline'}</p>
            </div>
            <p>Please process this order.</p>
        </div>
    `;

    return sendEmailSafe({
        type: 'admin_alert',
        to: ADMIN_EMAIL,
        subject,
        htmlContent,
        textContent: `New order ${order.orderNumber} from ${customerName}`,
        referenceId: order.id
    });
}

/**
 * Send order status update to customer
 */
export async function sendOrderStatusUpdate(order, customerEmail, customerName, newStatus) {
    const subject = `Order Status Update - ${order.orderNumber}`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2196F3;">Order Status Updated</h2>
            <p>Hi ${customerName || 'Customer'},</p>
            <p>Your order status has been updated.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>New Status:</strong> <span style="color: #4CAF50; font-weight: bold;">${newStatus}</span></p>
            </div>
            <p>Thank you for your patience!</p>
            <p>Best regards,<br>${SENDER_NAME} Team</p>
        </div>
    `;

    return sendEmailSafe({
        type: 'status',
        to: customerEmail,
        subject,
        htmlContent,
        textContent: `Order ${order.orderNumber} status: ${newStatus}`,
        referenceId: order.id
    });
}

/**
 * Send payment confirmation to customer
 */
export async function sendPaymentConfirmation(receipt, customerEmail, customerName, currentDue) {
    const subject = `Payment Received - Receipt ${receipt.receiptNo}`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Payment Received</h2>
            <p>Hi ${customerName || 'Customer'},</p>
            <p>We have received your payment.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Receipt Number:</strong> ${receipt.receiptNo}</p>
                <p><strong>Amount Paid:</strong> ৳${receipt.amount}</p>
                <p><strong>Payment Mode:</strong> ${receipt.paymentMode}</p>
                <p><strong>Date:</strong> ${new Date(receipt.date).toLocaleDateString()}</p>
                ${currentDue !== undefined ? `<p><strong>Current Due:</strong> ৳${currentDue}</p>` : ''}
            </div>
            <p>Thank you for your payment!</p>
            <p>Best regards,<br>${SENDER_NAME} Team</p>
        </div>
    `;

    return sendEmailSafe({
        type: 'payment',
        to: customerEmail,
        subject,
        htmlContent,
        textContent: `Payment of ৳${receipt.amount} received. Receipt: ${receipt.receiptNo}`,
        referenceId: receipt.id
    });
}
