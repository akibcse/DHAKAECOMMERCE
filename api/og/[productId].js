import https from "https";
import http from "http";

const SITE_NAME = "DhakaEcommerce";
const DB_URL    = "https://dhakaecommerce-86c3c-default-rtdb.firebaseio.com";

// Reliable fallback — always accessible, correct format
const EXTERNAL_FALLBACK = "https://placehold.co/1200x630/006A4E/FFFFFF.png?text=DhakaEcommerce";

function escapeHtml(s) {
    if (!s) return "";
    return String(s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const BOTS = [
    "facebookexternalhit","facebot","twitterbot","whatsapp","telegrambot",
    "linkedinbot","slackbot","discordbot","googlebot","bingbot","applebot","pinterest",
];
function isCrawler(ua = "") {
    return BOTS.some(b => ua.toLowerCase().includes(b));
}

/** Fetch text content from a URL */
function fetchText(url, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith("https") ? https : http;
        const req = lib.get(url, { headers: { "User-Agent": "dhakaecommerce-og/1.0" } }, res => {
            let d = "";
            res.on("data", c => d += c);
            res.on("end", () => resolve(d));
            res.on("error", reject);
        });
        req.on("error", reject);
        req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error("timeout")); });
    });
}

/**
 * Verify image URL is publicly accessible (HEAD request).
 * Returns the url if it works, otherwise returns the fallback.
 */
function verifyImage(url, fallback) {
    if (!url || !(url.startsWith("https://") || url.startsWith("http://"))) return Promise.resolve(fallback);

    return new Promise(resolve => {
        const lib = url.startsWith("https") ? https : http;
        try {
            const req = lib.request(url, { method: "HEAD", headers: { "User-Agent": "dhakaecommerce-og/1.0" } }, res => {
                const ok = res.statusCode >= 200 && res.statusCode < 400;
                resolve(ok ? url : fallback);
            });
            req.on("error", () => resolve(fallback));
            req.setTimeout(3000, () => { req.destroy(); resolve(fallback); });
            req.end();
        } catch {
            resolve(fallback);
        }
    });
}

export default async function handler(req, res) {
    const { productId } = req.query;

    const proto  = req.headers["x-forwarded-proto"] || "https";
    const host   = req.headers.host || "dhakaecommerce-86c3c.web.app";
    const SITE   = `${proto}://${host}`;
    // Use the .png extension so Content-Type matches actual file format
    const DEF_IMG_LOCAL = `${SITE}/og-default.png`;
    const ogUrl  = `${SITE}/product/${productId}`;

    let ogTitle = `${SITE_NAME} — Online Shopping in Bangladesh`;
    let ogDesc  = "Buy authentic products online in Bangladesh with fast delivery.";
    let ogImage = DEF_IMG_LOCAL;
    let ogPrice = "";

    // ── 1. Fetch product from Firebase REST API (products: .read = true) ──
    try {
        const raw     = await fetchText(`${DB_URL}/products/${encodeURIComponent(productId)}.json`);
        const product = JSON.parse(raw);

        if (product && typeof product === "object") {
            ogTitle = product.seo?.title       || product.title       || ogTitle;
            ogDesc  = product.seo?.description || product.description || ogDesc;

            const candidate =
                product.seo?.shareImage ||
                product.image ||
                (Array.isArray(product.images) && product.images.length ? product.images[0] : null);

            if (candidate) ogImage = candidate;

            const p = product.discountPrice || product.price;
            if (p) ogPrice = String(p);
        }
    } catch (e) {
        console.error("[og] Firebase fetch error:", e.message);
    }

    // ── 2. Verify image is publicly reachable — prevents 404 og:image ────
    // Use local og-default.png → then external placehold.co as last resort
    const verifiedImage = await verifyImage(
        ogImage,
        await verifyImage(DEF_IMG_LOCAL, EXTERNAL_FALLBACK)
    );

    const T = escapeHtml(ogTitle);
    const D = escapeHtml(ogDesc);
    const I = escapeHtml(verifiedImage);
    const U = escapeHtml(ogUrl);

    const ogBlock = `
  <title>${T} | ${escapeHtml(SITE_NAME)}</title>
  <meta name="description"              content="${D}" />
  <meta property="og:type"              content="product" />
  <meta property="og:site_name"         content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:title"             content="${T}" />
  <meta property="og:description"       content="${D}" />
  <meta property="og:url"               content="${U}" />
  <meta property="og:image"             content="${I}" />
  <meta property="og:image:secure_url"  content="${I}" />
  <meta property="og:image:width"       content="1200" />
  <meta property="og:image:height"      content="630" />
  <meta property="og:image:alt"         content="${T}" />
  ${ogPrice ? `<meta property="product:price:amount"   content="${ogPrice}" />` : ""}
  <meta property="product:price:currency" content="BDT" />
  <meta name="twitter:card"             content="summary_large_image" />
  <meta name="twitter:title"            content="${T}" />
  <meta name="twitter:description"      content="${D}" />
  <meta name="twitter:image"            content="${I}" />
  <meta name="twitter:image:alt"        content="${T}" />
  <link rel="canonical"                 href="${U}" />`;

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.setHeader("Content-Type", "text/html; charset=utf-8");

    // ── 3a. Crawlers → lightweight OG-only page (no JS) ─────────────────
    if (isCrawler(req.headers["user-agent"])) {
        return res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
${ogBlock}
</head><body>
<h1>${T}</h1><p>${D}</p>
${ogPrice ? `<p>Price: ৳${ogPrice}</p>` : ""}
<a href="${U}">View on DhakaEcommerce</a>
</body></html>`);
    }

    // ── 3b. Browsers → fetch SPA shell, inject OG, return full React app ─
    try {
        let spa = await fetchText(`${SITE}/`);
        spa = spa.replace(/<title>[^<]*<\/title>/i, "");
        spa = spa.includes("<head>")
            ? spa.replace("<head>", `<head>\n${ogBlock}`)
            : `<!DOCTYPE html><html><head>${ogBlock}</head><body><div id="root"></div></body></html>`;
        return res.send(spa);
    } catch {
        // Last resort: serve OG tags + JS reload so React still hydrates
        return res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
${ogBlock}
</head><body><div id="root"></div>
<script>window.__OG_FALLBACK__=true;</script>
</body></html>`);
    }
}
