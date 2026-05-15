import https from "https";
import http from "http";

const SITE_NAME = "DhakaEcommerce";
const DB_URL    = "https://dhakaecommerce-86c3c-default-rtdb.firebaseio.com";

// Reliable fallback — always accessible, correct format
const EXTERNAL_FALLBACK = "https://placehold.co/1200x630/006A4E/FFFFFF.png?text=DhakaEcommerce";

/**
 * If the URL is a Cloudinary image, automatically transform it to
 * 1200×630 crop — perfect OG dimensions, no manual editing needed.
 */
function optimizeForOG(url) {
    if (!url) return url;
    
    // Auto-fix ImgBB viewer links to direct links if possible
    // Viewer: https://ibb.co/XXXXX -> we can't easily guess direct without API
    // but if it's already i.ibb.co, it's good.
    if (url.includes("ibb.co") && !url.includes("i.ibb.co")) {
        // We can't fix it reliably here, but we'll at least not break it further.
        return url;
    }

    const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/);
    if (!match) return url;
    const base = match[1];
    const rest = match[2];
    const cleanRest = rest.replace(/^[a-z_,/0-9]+\//, m => /^[a-z]_/.test(m.split(",")[0]) ? "" : m);
    return `${base}c_fill,w_1200,h_630,f_jpg,q_auto/${cleanRest}`;
}

function escapeHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const BOTS = ["facebookexternalhit","facebot","twitterbot","whatsapp","telegrambot","linkedinbot","slackbot","discordbot","googlebot","bingbot","applebot","pinterest"];
function isCrawler(ua = "") {
    return BOTS.some(b => ua.toLowerCase().includes(b));
}

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function fetchText(url, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith("https") ? https : http;
        const req = lib.get(url, { headers: { "User-Agent": USER_AGENT } }, res => {
            let d = "";
            res.on("data", c => d += c);
            res.on("end", () => resolve(d));
            res.on("error", reject);
        });
        req.on("error", reject);
        req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error("timeout")); });
    });
}

function verifyImage(url, fallback) {
    if (!url || !(url.startsWith("https://") || url.startsWith("http://"))) return Promise.resolve(fallback);
    
    // If it's a direct ImgBB link or Cloudinary, they are usually reliable.
    // We only verify to ensure it's not a 404, but we'll be more lenient with methods.
    if (url.includes("i.ibb.co") || url.includes("cloudinary.com")) {
        return Promise.resolve(url);
    }

    return new Promise(resolve => {
        const lib = url.startsWith("https") ? https : http;
        try {
            // Some CDNs block HEAD, so we try a GET with a small range or just trust the URL
            // for common image hosting sites.
            const options = { 
                method: "GET", 
                headers: { 
                    "User-Agent": USER_AGENT,
                    "Range": "bytes=0-0" // Just check if we can get the first byte
                } 
            };
            const req = lib.request(url, options, res => {
                const ok = res.statusCode >= 200 && res.statusCode < 400;
                resolve(ok ? url : fallback);
            });
            req.on("error", () => resolve(fallback));
            req.setTimeout(3000, () => { req.destroy(); resolve(fallback); });
            req.end();
        } catch { resolve(fallback); }
    });
}

export default async function handler(req, res) {
    // productId is now passed via query ?productId=... from vercel.json rewrite
    const { productId } = req.query;

    const proto  = req.headers["x-forwarded-proto"] || "https";
    const host   = req.headers.host || "dhakaecommerce-86c3c.web.app";
    const SITE   = `${proto}://${host}`;
    const DEF_IMG_LOCAL = `${SITE}/og-default.png`;
    const ogUrl  = `${SITE}/product/${productId}`;

    let ogTitle = `${SITE_NAME} — Online Shopping in Bangladesh`;
    let ogDesc  = "Buy authentic products online in Bangladesh with fast delivery.";
    let ogImage = DEF_IMG_LOCAL;
    let ogPrice = "";

    try {
        if (productId) {
            const raw = await fetchText(`${DB_URL}/products/${encodeURIComponent(productId)}.json`);
            const product = JSON.parse(raw);

            if (product && typeof product === "object") {
                ogTitle = product.seo?.title || product.title || ogTitle;
                ogDesc  = product.seo?.description || product.description || ogDesc;
                const candidate = product.seo?.shareImage || product.image || (Array.isArray(product.images) && product.images.length ? product.images[0] : null);
                if (candidate) ogImage = optimizeForOG(candidate);
                const p = product.discountPrice || product.price;
                if (p) ogPrice = String(p);
            }
        }
    } catch (e) {
        console.error("[og] fetch error:", e.message);
    }

    const verifiedImage = await verifyImage(ogImage, await verifyImage(DEF_IMG_LOCAL, EXTERNAL_FALLBACK));

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

    try {
        let spa = await fetchText(`${SITE}/`);
        spa = spa.replace(/<title>[^<]*<\/title>/i, "");
        spa = spa.includes("<head>")
            ? spa.replace("<head>", `<head>\n${ogBlock}`)
            : `<!DOCTYPE html><html><head>${ogBlock}</head><body><div id="root"></div></body></html>`;
        return res.send(spa);
    } catch {
        return res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
${ogBlock}
</head><body><div id="root"></div>
<script>window.__OG_FALLBACK__=true;</script>
</body></html>`);
    }
}
