const functions = require("firebase-functions");
const admin = require("firebase-admin");
const https = require("https");
admin.initializeApp();

const db = admin.database();
const messaging = admin.messaging();

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/** Known social-media / SEO crawler user-agent substrings */
const CRAWLER_AGENTS = [
    "facebookexternalhit",
    "facebot",
    "twitterbot",
    "whatsapp",
    "telegrambot",
    "linkedinbot",
    "slackbot",
    "discordbot",
    "googlebot",
    "bingbot",
    "applebot",
    "pinterest",
    "vkshare",
    "w3c_validator",
    "ia_archiver",
];

function isCrawler(userAgent = "") {
    const ua = userAgent.toLowerCase();
    return CRAWLER_AGENTS.some((bot) => ua.includes(bot));
}

/** Fetch a URL and return the response body as a string */
function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, { headers: { "User-Agent": "dhakaecommerce-function/1.0" } }, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => resolve(data));
                res.on("error", reject);
            })
            .on("error", reject);
    });
}

// ---------------------------------------------------------------------------
// productMeta — SSR-like OG tag injection for /product/:id
// ---------------------------------------------------------------------------
/**
 * Intercepts requests to /product/** from Firebase Hosting.
 * For social-media crawlers   → returns a minimal HTML page with full OG tags.
 * For regular browsers        → fetches the SPA shell, injects OG tags, and
 *                               returns it so React can hydrate normally.
 *
 * This ensures rich previews on Facebook, WhatsApp, Telegram, Twitter, etc.
 * while keeping the full React SPA experience for human visitors.
 */
exports.productMeta = functions.https.onRequest(async (req, res) => {
    // Cache for 5 min at edge, 10 min at CDN
    res.set("Cache-Control", "public, max-age=300, s-maxage=600");

    // ── 1. Extract productId from path (/product/<id>) ──────────────────────
    const pathParts = req.path.split("/").filter(Boolean);
    // pathParts = ['product', '<id>']
    const productId = pathParts[1] || null;

    // ── 2. Site-level defaults ───────────────────────────────────────────────
    // Use the project's default hosting URL for internal SPA fetches
    const HOSTING_URL   = "https://dhakaecommerce-86c3c.web.app";
    const SITE_NAME     = "DhakaEcommerce";
    const DEFAULT_TITLE = `${SITE_NAME} — Online Shopping in Bangladesh`;
    const DEFAULT_DESC  = "Buy authentic products online in Bangladesh with fast delivery.";
    const DEFAULT_IMAGE = `${HOSTING_URL}/og-default.jpg`;

    // Resolved values (will be overwritten from Firebase)
    let ogTitle   = DEFAULT_TITLE;
    let ogDesc    = DEFAULT_DESC;
    let ogImage   = DEFAULT_IMAGE;
    let ogPrice   = "";
    const ogUrl   = `${HOSTING_URL}/product/${productId || ""}`;

    // ── 3. Fetch product from Firebase RTDB ─────────────────────────────────
    try {
        if (productId) {
            const snap = await db.ref(`products/${productId}`).once("value");

            if (snap.exists()) {
                const p = snap.val();

                // Title priority: seo.title → title → default
                ogTitle = p.seo?.title || p.title || DEFAULT_TITLE;

                // Description priority: seo.description → description → default
                ogDesc = p.seo?.description || p.description || DEFAULT_DESC;

                // Image priority: seo.shareImage → images[0] → image → default
                ogImage =
                    p.seo?.shareImage ||
                    (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null) ||
                    p.image ||
                    DEFAULT_IMAGE;

                // Price (for product: schema)
                const price = p.discountPrice || p.price;
                if (price) ogPrice = String(price);
            }
        }
    } catch (err) {
        console.error("[productMeta] Firebase fetch error:", err);
        // Fall through with defaults — never crash for crawlers
    }

    // ── 4. Build the OG meta block ──────────────────────────────────────────
    const safeTitle = escapeHtml(ogTitle);
    const safeDesc  = escapeHtml(ogDesc);
    const safeImg   = escapeHtml(ogImage);
    const fullTitle = `${safeTitle} | ${escapeHtml(SITE_NAME)}`;

    const ogBlock = `
    <!-- Injected by productMeta Cloud Function -->
    <title>${fullTitle}</title>
    <meta name="description" content="${safeDesc}" />

    <!-- Open Graph -->
    <meta property="og:type"              content="product" />
    <meta property="og:site_name"         content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:title"             content="${safeTitle}" />
    <meta property="og:description"       content="${safeDesc}" />
    <meta property="og:url"               content="${escapeHtml(ogUrl)}" />
    <meta property="og:image"             content="${safeImg}" />
    <meta property="og:image:secure_url"  content="${safeImg}" />
    <meta property="og:image:width"       content="1200" />
    <meta property="og:image:height"      content="630" />
    <meta property="og:image:alt"         content="${safeTitle}" />
    ${ogPrice ? `<meta property="product:price:amount"   content="${ogPrice}" />` : ""}
    <meta property="product:price:currency" content="BDT" />

    <!-- Twitter Card -->
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image"       content="${safeImg}" />
    <meta name="twitter:image:alt"   content="${safeTitle}" />

    <!-- Canonical -->
    <link rel="canonical" href="${escapeHtml(ogUrl)}" />
    <!-- End injection -->`;

    // ── 5a. Crawler → return lightweight OG HTML (no JS) ───────────────────
    if (isCrawler(req.headers["user-agent"])) {
        const crawlerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${ogBlock}
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${safeDesc}</p>
  ${ogPrice ? `<p>Price: ৳${ogPrice}</p>` : ""}
  <a href="${escapeHtml(ogUrl)}">View Product</a>
</body>
</html>`;

        res.set("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(crawlerHtml);
    }

    // ── 5b. Regular browser → fetch SPA shell, inject OG, return full app ──
    try {
        // Fetch the root index.html (not /product/... to avoid rewrite loop)
        let spaHtml = await fetchHtml(`${HOSTING_URL}/`);

        // Remove the default <title> so our injected one takes over
        spaHtml = spaHtml.replace(/<title>[^<]*<\/title>/i, "");

        // Inject OG block immediately after <head>
        if (spaHtml.includes("<head>")) {
            spaHtml = spaHtml.replace("<head>", `<head>\n${ogBlock}`);
        } else {
            // Fallback: prepend to document
            spaHtml = `<!DOCTYPE html><html><head>${ogBlock}</head><body></body></html>`;
        }

        res.set("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(spaHtml);
    } catch (fetchErr) {
        console.error("[productMeta] SPA fetch error:", fetchErr);

        // Last resort: redirect browser to the live site
        return res.redirect(302, ogUrl);
    }
});

// ---------------------------------------------------------------------------
// onOrderUpdate — notifications on order status / payment change
// ---------------------------------------------------------------------------
exports.onOrderUpdate = functions.database.ref("/orders/{orderId}")
    .onWrite(async (change, context) => {
        const orderId   = context.params.orderId;
        const beforeData = change.before.val();
        const afterData  = change.after.val();

        if (!afterData) {
            console.log(`Order ${orderId} deleted.`);
            return null;
        }

        const userId = afterData.userId;
        const [tokenSnapshot, adminSnapshot] = await Promise.all([
            db.ref(`fcmTokens/${userId}`).once("value"),
            db.ref("users").orderByChild("role").equalTo("admin").once("value")
        ]);

        const userTokens = tokenSnapshot.exists() ? Object.keys(tokenSnapshot.val()) : [];

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

// ---------------------------------------------------------------------------
// onNewMessage — notifications on new support messages
// ---------------------------------------------------------------------------
exports.onNewMessage = functions.database.ref("/messages/{orderId}/{messageId}")
    .onCreate(async (snapshot, context) => {
        const orderId    = context.params.orderId;
        const messageData = snapshot.val();
        const senderRole  = messageData.senderRole;

        const orderSnapshot = await db.ref(`orders/${orderId}`).once("value");
        if (!orderSnapshot.exists()) return null;
        const orderData   = orderSnapshot.val();
        const orderOwnerId = orderData.userId;
        const orderNum    = orderData.orderNumber || orderId.slice(-8);

        if (senderRole === "user") {
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
            const userTokenSnap = await db.ref(`fcmTokens/${orderOwnerId}`).once("value");
            if (userTokenSnap.exists()) {
                const userTokens = Object.keys(userTokenSnap.val());
                await sendPush(userTokens, "Shop Support", `A new message was sent regarding your order #${orderNum}`);
            }

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

// ---------------------------------------------------------------------------
// Helper: send email via Brevo
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helper: send FCM push notification
// ---------------------------------------------------------------------------
async function sendPush(tokens, title, body) {
    if (!tokens || tokens.length === 0) return;

    const message = {
        notification: { title, body },
        tokens: tokens
    };

    try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} messages failed.`);

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
