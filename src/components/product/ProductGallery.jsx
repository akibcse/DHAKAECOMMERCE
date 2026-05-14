import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';
import { motion, AnimatePresence } from 'framer-motion';
import { BsArrowsFullscreen } from 'react-icons/bs';

const ProductGallery = ({ image, gallery = [] }) => {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // If no gallery provided, use the main image
    const images = gallery.length > 0 ? gallery : [image];

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Main Image Slider */}
            <div className="relative group rounded-[2.5rem] overflow-hidden bg-white shadow-2xl shadow-gray-100 border border-gray-100">
                <Swiper
                    spaceBetween={10}
                    navigation={true}
                    pagination={{ clickable: true }}
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                    modules={[FreeMode, Navigation, Thumbs, Pagination]}
                    className="product-swiper aspect-square"
                >
                    {images.map((img, idx) => (
                        <SwiperSlide key={idx} className="flex items-center justify-center p-4">
                            <motion.img 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={img || "https://via.placeholder.com/500"} 
                                alt={`Product ${idx}`} 
                                className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                                onClick={() => setIsFullscreen(true)}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
                
                <button 
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-6 right-6 z-10 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
                >
                    <BsArrowsFullscreen className="text-gray-900" />
                </button>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <Swiper
                    onSwiper={setThumbsSwiper}
                    spaceBetween={12}
                    slidesPerView={4}
                    freeMode={true}
                    watchSlidesProgress={true}
                    modules={[FreeMode, Navigation, Thumbs]}
                    className="thumbs-swiper w-full px-2"
                >
                    {images.map((img, idx) => (
                        <SwiperSlide key={idx} className="cursor-pointer rounded-2xl overflow-hidden border-2 border-transparent transition-all opacity-60 [.swiper-slide-thumb-active_&]:border-primary [.swiper-slide-thumb-active_&]:opacity-100">
                            <div className="aspect-square bg-gray-50 flex items-center justify-center p-2">
                                <img src={img} alt={`Thumb ${idx}`} className="max-h-full object-contain" />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}

            {/* Fullscreen Overlay */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
                        onClick={() => setIsFullscreen(false)}
                    >
                        <motion.img 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            src={images[0]} 
                            className="max-h-full max-w-full object-contain" 
                        />
                        <button className="absolute top-8 right-8 text-white text-4xl font-light hover:rotate-90 transition-transform">&times;</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductGallery;
