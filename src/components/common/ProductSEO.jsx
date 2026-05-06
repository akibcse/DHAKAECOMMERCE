import { Helmet } from "react-helmet-async";
import { useSettings } from "../../context/SettingsContext";

/**
 * ProductSEO — injects dynamic Open Graph, Twitter Card,
 * and canonical tags for a single product page.
 *
 * Image resolution priority (matches actual Firebase schema):
 *  1. product.seo.shareImage  — admin-set custom OG image URL
 *  2. product.image           — primary image URL field (most products use this)
 *  3. product.images[0]       — fallback for multi-image format
 *  4. settings.seo.defaultShareImage — site-wide fallback
 *
 * ✅ URL-based images only — no Firebase Storage dependency
 */
const ProductSEO = ({ product }) => {
    const { settings } = useSettings();

    if (!product) return null;

    const siteName  = settings?.branding?.brandName    || "DhakaEcommerce";
    const siteUrl   = typeof window !== "undefined" ? window.location.origin : "https://dhakaecommerce-86c3c.web.app";
    const defaultDesc = settings?.seo?.defaultDescription || "Buy products online in Bangladesh";

    // Fallback image must ALWAYS be an absolute HTTPS URL that crawlers can reach.
    // Never use a relative path or localhost — they return 404 to external validators.
    const DEPLOYED_OG_IMAGE = "https://dhakaecommerce-86c3c.web.app/og-default.png";
    const defaultImg =
        settings?.seo?.defaultShareImage  // admin-set site fallback (absolute URL)
        || DEPLOYED_OG_IMAGE;             // guaranteed to exist after deploy

    // --- Resolved values ------------------------------------------------
    const ogTitle = product.seo?.title || product.title || settings?.seo?.defaultTitle || siteName;
    const fullTitle = `${ogTitle} | ${siteName}`;

    const ogDesc = product.seo?.description || product.description || defaultDesc;

    // Priority: seo.shareImage → product.image (primary) → images[0] → site default
    // ⚠️  Only include og:image if the URL is an absolute HTTPS URL
    const rawImage =
        product.seo?.shareImage ||
        product.image ||
        (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null) ||
        defaultImg;

    // Ensure the image URL is absolute — relative URLs cause 404 on crawlers
    const ogImage = rawImage && (rawImage.startsWith("http://") || rawImage.startsWith("https://"))
        ? rawImage
        : DEPLOYED_OG_IMAGE;

    const productUrl = `${siteUrl}/product/${product.id}`;
    const price      = product.discountPrice || product.price;

    return (
        <Helmet>
            {/* Base */}
            <title>{fullTitle}</title>
            <meta name="description" content={ogDesc} />
            {product.seo?.keywords && (
                <meta name="keywords" content={product.seo.keywords} />
            )}
            <link rel="canonical" href={productUrl} />

            {/* Open Graph ------------------------------------------------ */}
            <meta property="og:type"        content="product" />
            <meta property="og:site_name"   content={siteName} />
            <meta property="og:title"       content={ogTitle} />
            <meta property="og:description" content={ogDesc} />
            <meta property="og:url"         content={productUrl} />
            {ogImage && <meta property="og:image"        content={ogImage} />}
            {ogImage && <meta property="og:image:width"  content="1200" />}
            {ogImage && <meta property="og:image:height" content="630" />}
            {ogImage && <meta property="og:image:alt"    content={ogTitle} />}
            {price    && <meta property="product:price:amount"   content={String(price)} />}
            <meta property="product:price:currency" content="BDT" />

            {/* Twitter Card ---------------------------------------------- */}
            <meta name="twitter:card"        content="summary_large_image" />
            <meta name="twitter:title"       content={ogTitle} />
            <meta name="twitter:description" content={ogDesc} />
            {ogImage && <meta name="twitter:image" content={ogImage} />}
            {ogImage && <meta name="twitter:image:alt" content={ogTitle} />}
        </Helmet>
    );
};

export default ProductSEO;
