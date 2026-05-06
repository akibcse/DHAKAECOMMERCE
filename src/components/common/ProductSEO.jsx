import { Helmet } from "react-helmet-async";
import { useSettings } from "../../context/SettingsContext";

/**
 * ProductSEO — injects dynamic Open Graph, Twitter Card,
 * and canonical tags for a single product page.
 *
 * Priority order (per spec):
 *  title       : seo.title       → product.title       → site default
 *  description : seo.description → product.description → site default
 *  image       : seo.shareImage  → images[0]           → image → site default
 */
const ProductSEO = ({ product }) => {
    const { settings } = useSettings();

    if (!product) return null;

    const siteName  = settings?.branding?.brandName    || "DhakaEcommerce";
    const siteUrl   = typeof window !== "undefined" ? window.location.origin : "https://dhakaecommerce-86c3c.web.app";
    const defaultDesc  = settings?.seo?.defaultDescription || "Buy products online in Bangladesh";
    const defaultImg   = settings?.seo?.defaultShareImage   || "";

    // --- Resolved values ------------------------------------------------
    const ogTitle = product.seo?.title || product.title || settings?.seo?.defaultTitle || siteName;
    const fullTitle = `${ogTitle} | ${siteName}`;

    const ogDesc = product.seo?.description || product.description || defaultDesc;

    const ogImage =
        product.seo?.shareImage ||
        (Array.isArray(product.images) && product.images[0]) ||
        product.image ||
        defaultImg;

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
