import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import { getOffers } from "../utils/dbServices";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const OfferSlider = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const data = await getOffers();
                setOffers(data.filter(o => o.active));
            } catch (error) {
                console.error("Slider Fetch Error:", error);
            }
            setLoading(false);
        };
        fetchOffers();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-[400px] md:h-[500px] bg-gray-100 animate-pulse rounded-2xl mb-12"></div>
        );
    }

    if (offers.length === 0) return null;

    return (
        <section className="mb-12 rounded-2xl overflow-hidden shadow-2xl relative">
            <Swiper
                modules={[Autoplay, Pagination, EffectFade]}
                effect="fade"
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                className="w-full h-[400px] md:h-[500px]"
            >
                {offers.map((offer) => (
                    <SwiperSlide key={offer.id}>
                        <div className="relative w-full h-full overflow-hidden flex items-center">
                            {/* Background Image */}
                            <img
                                src={offer.image}
                                alt={offer.title}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

                            {/* Content */}
                            <div className="container mx-auto px-6 md:px-12 relative z-10 text-white max-w-2xl">
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                >
                                    <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight tracking-tight">
                                        {offer.title}
                                    </h2>
                                    <p className="text-sm md:text-lg mb-8 text-gray-200 font-medium">
                                        {offer.description}
                                    </p>
                                    <Link
                                        to={offer.linkType === 'category' ? `/shop?category=${offer.linkId}` : `/product/${offer.linkId}`}
                                        className="bg-secondary text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl inline-block hover:scale-105"
                                    >
                                        Shop Now
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
};

export default OfferSlider;
