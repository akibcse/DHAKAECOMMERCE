const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.database();
const messaging = admin.messaging();

/**
 * Triggered on Order Update
 * Sends notifications on status or payment changes
 */
exports.onOrderUpdate = functions.database.ref("/orders/{orderId}")
    .onWrite(async (change, context) => {
        const orderId = context.params.orderId;
        const beforeData = change.before.val();
        const afterData = change.after.val();

        // If order was deleted
        if (!afterData) {
            console.log(`Order ${orderId} deleted.`);
            // Optionally notify user about cancellation if not done yet
            return null;
        }

        // 1. Get User/Admin Tokens
        const userId = afterData.userId;
        const [tokenSnapshot, adminSnapshot] = await Promise.all([
            db.ref(`fcmTokens/${userId}`).once("value"),
            db.ref("users").orderByChild("role").equalTo("admin").once("value")
        ]);

        const userTokens = tokenSnapshot.exists() ? Object.keys(tokenSnapshot.val()) : [];

        // Collect all admin tokens
        let adminTokens = [];
        if (adminSnapshot.exists()) {
            const admins = adminSnapshot.val();
            const adminIds = Object.keys(admins);
            const adminTokenPromises = adminIds.map(id => db.ref(`fcmTokens/${id}`).once("value"));
            const adminTokenSnapshots = await Promise.all(adminTokenPromises);
            adminTokenSnapshots.forEach(snap => {
                if (snap.exists()) {
                    adminTokens = adminTokens.concat(Object.keys(snap.val()));
                }
            });
        }

        const orderNum = afterData.orderNumber || orderId.slice(-8);

        // CASE 1: New Order (Created)
        if (!beforeData) {
            if (adminTokens.length > 0) {
                await sendPush(adminTokens, "New Order Alert", `Order #${orderNum} has been placed.`);
            }

            // Email Admin
            await sendEmail("admin@dhakaecommerce.com", `New Order #${orderNum}`, `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #000;">New Order Received!</h2>
                    <p>Order Number: <b>#${orderNum}</b></p>
                    <p>Amount: <b>৳${afterData.finalAmount}</b></p>
                    <p>Customer: ${afterData.shippingDetails?.name} (${afterData.userEmail})</p>
                    <hr/>
                    <p>Check the admin panel for details.</p>
                </div>
            `);

            // Email Customer Confirmation
            await sendEmail(afterData.userEmail, `Order Confirmed - #${orderNum}`, `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #000;">Thank you for your order!</h2>
                    <p>Your order <b>#${orderNum}</b> has been placed successfully.</p>
                    <p>Total amount to pay: <b>৳${afterData.finalAmount}</b></p>
                    <p>Payment Method: ${afterData.paymentMethod}</p>
                    <hr/>
                    <p>We will notify you when your order is shipped.</p>
                </div>
            `);
            return null;
        }

        // CASE 2: Status Updated
        if (beforeData.orderStatus !== afterData.orderStatus) {
            const status = afterData.orderStatus.toUpperCase();
            if (userTokens.length > 0) {
                await sendPush(userTokens, "Order Update", `Your order #${orderNum} status is now ${status}`);
            }

            await sendEmail(afterData.userEmail, `Order ${status} - #${orderNum}`, `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Your Order Status Updated!</h2>
                    <p>Your order <b>#${orderNum}</b> is now <b>${status}</b>.</p>
                    <p>Visit your profile to track progress.</p>
                </div>
            `);
        }

        // CASE 3: Payment Status Updated
        if (beforeData.paymentStatus !== afterData.paymentStatus) {
            if (userTokens.length > 0) {
                await sendPush(userTokens, "Payment Update", `Your order #${orderNum} payment is now ${afterData.paymentStatus.toUpperCase()}`);
            }
        }

        return null;
    });

/**
 * Triggered on New Message
 * Sends notification to recipient
 */
exports.onNewMessage = functions.database.ref("/messages/{orderId}/{messageId}")
    .onCreate(async (snapshot, context) => {
        const orderId = context.params.orderId;
        const messageData = snapshot.val();
        const senderRole = messageData.senderRole;

        // Get Order Owner
        const orderSnapshot = await db.ref(`orders/${orderId}`).once("value");
        if (!orderSnapshot.exists()) return null;
        const orderData = orderSnapshot.val();
        const orderOwnerId = orderData.userId;
        const orderNum = orderData.orderNumber || orderId.slice(-8);

        if (senderRole === "user") {
            // Notify Admins
            const adminSnapshot = await db.ref("users").orderByChild("role").equalTo("admin").once("value");
            if (adminSnapshot.exists()) {
                const admins = adminSnapshot.val();
                let adminTokens = [];
                for (const adminId of Object.keys(admins)) {
                    const tokenSnap = await db.ref(`fcmTokens/${adminId}`).once("value");
                    if (tokenSnap.exists()) adminTokens = adminTokens.concat(Object.keys(tokenSnap.val()));
                }
                if (adminTokens.length > 0) {
                    await sendPush(adminTokens, "New Support Message", `Customer sent a message regarding Order #${orderNum}`);
                }
            }
        } else {
            // Notify User
            const userTokenSnap = await db.ref(`fcmTokens/${orderOwnerId}`).once("value");
            if (userTokenSnap.exists()) {
                const userTokens = Object.keys(userTokenSnap.val());
                await sendPush(userTokens, "Shop Support", `A new message was sent regarding your order #${orderNum}`);
            }

            // Email User for message (since they might be offline)
            await sendEmail(orderData.userEmail, "New Message from Support", `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>New Support Message</h2>
                    <p>Support has responded to your inquiry regarding Order <b>#${orderNum}</b>.</p>
                    <p><i>"${messageData.text}"</i></p>
                    <p>Please log in to reply.</p>
                </div>
            `);
        }

        return null;
    });

/**
 * Helper to send Email via Brevo (Free Tier)
 */
async function sendEmail(to, subject, htmlContent) {
    const BREVO_API_KEY = functions.config().brevo?.key || "YOUR_BREVO_API_KEY_HERE";
    if (BREVO_API_KEY === "YOUR_BREVO_API_KEY_HERE") {
        console.warn("Brevo API Key not configured. Skipping email.");
        return;
    }

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": BREVO_API_KEY,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: { name: "DhakaEcommerce", email: "noreply@dhakaecommerce.com" },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent
            })
        });
        const result = await response.json();
        console.log("Brevo Email Response:", result);

        // Log to database
        await db.ref("notificationLogs").push({
            type: "email",
            recipient: to,
            subject: subject,
            timestamp: new Date().toISOString(),
            status: response.ok ? "success" : "failed"
        });
    } catch (error) {
        console.error("Error sending email via Brevo:", error);
    }
}

/**
 * Helper to send FCM message
 */
async function sendPush(tokens, title, body) {
    if (!tokens || tokens.length === 0) return;

    const message = {
        notification: { title, body },
        tokens: tokens
    };

    try {
        const response = await messaging.sendMulticast(message);
        console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} messages failed.`);

        // Log to database
        await db.ref("notificationLogs").push({
            type: "push",
            recipients: tokens.length,
            title: title,
            body: body,
            timestamp: new Date().toISOString(),
            successCount: response.successCount,
            failureCount: response.failureCount
        });
    } catch (error) {
        console.error("Error sending FCM message:", error);
    }
}
