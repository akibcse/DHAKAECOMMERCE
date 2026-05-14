import { useState } from "react";
import { toast } from "react-hot-toast";
import {
    BsFacebook,
    BsWhatsapp,
    BsTelegram,
    BsTwitterX,
    BsLinkedin,
    BsLink45Deg,
    BsCheck2,
} from "react-icons/bs";

/**
 * ShareButtons — social share row for a product page.
 *
 * Props:
 *  product  – the product object (title, price, discountPrice, id)
 *  compact  – if true, show icon-only buttons (mobile)
 */
const ShareButtons = ({ product, compact = false }) => {
    const [copied, setCopied] = useState(false);

    if (!product) return null;

    const productUrl  = `${window.location.origin}/product/${product.id}`;
    const price       = product.discountPrice || product.price;
    const priceLabel  = price ? `৳${price}` : "";

    // WhatsApp message body
    const waText = encodeURIComponent(
        `🛍️ Check out this product on DhakaEcommerce!\n\n*${product.title}*\n${priceLabel ? `💰 ${priceLabel}` : ""}\n\n🔗 ${productUrl}`
    );

    // Twitter / X tweet
    const tweetText = encodeURIComponent(
        `${product.title}${priceLabel ? ` — ${priceLabel}` : ""} | DhakaEcommerce`
    );

    const platforms = [
        {
            id:    "facebook",
            label: "Facebook",
            icon:  <BsFacebook size={18} />,
            color: "bg-[#1877F2] hover:bg-[#166FE5]",
            url:   `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
        },
        {
            id:    "whatsapp",
            label: "WhatsApp",
            icon:  <BsWhatsapp size={18} />,
            color: "bg-[#25D366] hover:bg-[#20BD5A]",
            url:   `https://wa.me/?text=${waText}`,
        },
        {
            id:    "telegram",
            label: "Telegram",
            icon:  <BsTelegram size={18} />,
            color: "bg-[#229ED9] hover:bg-[#1D8DC2]",
            url:   `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(product.title)}`,
        },
        {
            id:    "twitter",
            label: "X / Twitter",
            icon:  <BsTwitterX size={18} />,
            color: "bg-[#0F1419] hover:bg-[#272D33]",
            url:   `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${tweetText}`,
        },
        {
            id:    "linkedin",
            label: "LinkedIn",
            icon:  <BsLinkedin size={18} />,
            color: "bg-[#0A66C2] hover:bg-[#0959AB]",
            url:   `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`,
        },
    ];

    const openShare = (url) => {
        window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(productUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!", {
                icon: "🔗",
                style: {
                    borderRadius: "12px",
                    background: "#333",
                    color: "#fff",
                },
            });
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast.error("Failed to copy link.");
        }
    };

    return (
        <div className="mt-6">
            {/* Section header */}
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-4 h-[2px] bg-primary rounded-full"></span>
                Share this product
            </p>

            <div className={`flex flex-wrap ${compact ? "gap-2" : "gap-3"}`}>
                {platforms.map((p, index) => (
                    <button
                        key={p.id}
                        id={`share-${p.id}`}
                        onClick={() => openShare(p.url)}
                        aria-label={`Share on ${p.label}`}
                        title={p.label}
                        className={`
                            flex items-center gap-2 text-white text-[11px] font-black uppercase tracking-widest
                            px-4 py-3 rounded-2xl transition-all duration-300
                            active:scale-95 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-0.5
                            ${p.color}
                            ${compact ? "px-4" : ""}
                            animate-fade-in
                        `}
                        style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                    >
                        {p.icon}
                        {!compact && (
                            <span className="hidden sm:inline">{p.label}</span>
                        )}
                    </button>
                ))}

                {/* Copy Link */}
                <button
                    id="share-copy-link"
                    onClick={copyLink}
                    aria-label="Copy product link"
                    title="Copy Link"
                    className={`
                        flex items-center gap-2 text-gray-700 text-[11px] font-black uppercase tracking-widest
                        px-4 py-3 rounded-2xl transition-all duration-300
                        active:scale-95 border-2 hover:shadow-xl hover:-translate-y-0.5 animate-fade-in
                        ${copied
                            ? "bg-green-50 border-green-200 text-green-700 shadow-green-100"
                            : "bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200 shadow-gray-200/50"}
                    `}
                    style={{ animationDelay: `${platforms.length * 100}ms`, animationFillMode: 'both' }}
                >
                    {copied ? <BsCheck2 size={18} /> : <BsLink45Deg size={18} />}
                    {!compact && (
                        <span className="hidden sm:inline">
                            {copied ? "Copied!" : "Copy Link"}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ShareButtons;
