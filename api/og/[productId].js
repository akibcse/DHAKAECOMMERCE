import https from "https";

const SITE_NAME   = "DhakaEcommerce";
const DB_URL      = "https://dhakaecommerce-86c3c-default-rtdb.firebaseio.com";

function escapeHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

const BOTS = ["facebookexternalhit","facebot","twitterbot","whatsapp","telegrambot",
    "linkedinbot","slackbot","discordbot","googlebot","bingbot","applebot","pinterest"];

function isCrawler(ua = "") {
    const l = ua.toLowerCase();
    return BOTS.some(b => l.includes(b));
}

function fetchText(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "dhakaecommerce-og/1.0" } }, res => {
            let d = "";
            res.on("data", c => d += c);
            res.on("end", () => resolve(d));
            res.on("error", reject);
        }).on("error", reject);
    });
}

export default async function handler(req, res) {
    const { productId } = req.query;
    const proto   = req.headers["x-forwarded-proto"] || "https";
    const host    = req.headers.host;
    const SITE    = `${proto}://${host}`;
    const DEF_IMG = `${SITE}/og-default.jpg`;
    const ogUrl   = `${SITE}/product/${productId}`;

    let ogTitle = `${SITE_NAME} — Online Shopping in Bangladesh`;
    let ogDesc  = "Buy authentic products online in Bangladesh with fast delivery.";
    let ogImage = DEF_IMG;
    let ogPrice = "";

    // ── Fetch product from Firebase REST API (no auth — .read: true) ─────
    try {
        const raw     = await fetchText(`${DB_URL}/products/${encodeURIComponent(productId)}.json`);
        const product = JSON.parse(raw);

        if (product) {
            ogTitle = product.seo?.title       || product.title       || ogTitle;
            ogDesc  = product.seo?.description || product.description || ogDesc;

            const rawImg =
                product.seo?.shareImage ||
                product.image ||
                (Array.isArray(product.images) && product.images[0]) ||
                DEF_IMG;

            ogImage = (rawImg && (rawImg.startsWith("https://") || rawImg.startsWith("http://")))
                ? rawImg : DEF_IMG;

            const p = product.discountPrice || product.price;
            if (p) ogPrice = String(p);
        }
    } catch (e) {
        console.error("[og-handler] fetch error:", e.message);
    }

    const T = escapeHtml(ogTitle);
    const D = escapeHtml(ogDesc);
    const I = escapeHtml(ogImage);
    const U = escapeHtml(ogUrl);

    const ogBlock = `
  <title>${T} | ${escapeHtml(SITE_NAME)}</title>
  <meta name="description" content="${D}" />
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
  ${ogPrice ? `<meta property="product:price:amount" content="${ogPrice}" />` : ""}
  <meta property="product:price:currency" content="BDT" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${T}" />
  <meta name="twitter:description" content="${D}" />
  <meta name="twitter:image"       content="${I}" />
  <meta name="twitter:image:alt"   content="${T}" />
  <link rel="canonical" href="${U}" />`;

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.setHeader("Content-Type", "text/html; charset=utf-8");

    // ── Crawlers: lightweight OG-only HTML ───────────────────────────────
    if (isCrawler(req.headers["user-agent"])) {
        return res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
${ogBlock}
</head><body>
<h1>${T}</h1><p>${D}</p>${ogPrice ? `<p>Price: ৳${ogPrice}</p>` : ""}
<a href="${U}">View on DhakaEcommerce</a>
</body></html>`);
    }

    // ── Browsers: fetch the SPA shell, inject OG tags, return full app ──
    try {
        let spa = await fetchText(`${SITE}/`);
        spa = spa.replace(/<title>[^<]*<\/title>/i, "");
        spa = spa.includes("<head>")
            ? spa.replace("<head>", `<head>\n${ogBlock}`)
            : `<!DOCTYPE html><html><head>${ogBlock}</head><body><div id="root"></div></body></html>`;
        return res.send(spa);
    } catch {
        // last-resort: JS redirect so the React SPA still loads
        return res.send(`<!DOCTYPE html>
<html><head>${ogBlock}
<script>window.history.replaceState({},"","${U}");window.location.reload();</script>
</head><body><div id="root"></div></body></html>`);
    }
}
