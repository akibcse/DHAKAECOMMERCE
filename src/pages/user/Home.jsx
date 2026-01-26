import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getProducts } from "../../utils/dbServices";
import ProductCard from "../../components/ProductCard";

const Home = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchFeatured = async () => {
            const data = await getProducts();
            setProducts(data.slice(0, 4)); // Show first 4 products
        };
        fetchFeatured();
    }, []);

    return (
        <div>
            {/* Hero Section */}
            <section className="bg-primary text-white rounded-2xl overflow-hidden shadow-lg mb-12 relative">
                <div className="container mx-auto px-6 py-16 md:py-24 relative z-10">
                    <div className="md:w-1/2">
                        <motion.h1
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
                        >
                            Discover the Best <br /> of <span className="text-accent">Bangladesh</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-lg mb-8 text-gray-200"
                        >
                            Premium quality products delivered straight to your doorstep. Experience shopping like never before with DhakaEcommerce.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Link to="/shop" className="bg-secondary text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition shadow-lg transform hover:-translate-y-1 inline-block">
                                Shop Now
                            </Link>
                        </motion.div>
                    </div>
                </div>
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
            </section>

            {/* Featured Products */}
            <section className="mb-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Featured Products</h2>
                        <div className="h-1 w-20 bg-secondary mt-2 rounded"></div>
                    </div>
                    <Link to="/shop" className="text-primary font-semibold hover:underline">View All &rarr;</Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {products.length > 0 ? (
                        products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p className="text-gray-500 col-span-4 text-center py-10">Loading products...</p>
                    )}
                </div>
            </section>

            {/* Benefits Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <h3 className="font-bold text-lg mb-2 text-primary">Fast Delivery</h3>
                    <p className="text-gray-600 text-sm">We deliver across Bangladesh within 24-48 hours.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <h3 className="font-bold text-lg mb-2 text-primary">Secure Payment</h3>
                    <p className="text-gray-600 text-sm">100% secure payment methods including COD.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <h3 className="font-bold text-lg mb-2 text-primary">24/7 Support</h3>
                    <p className="text-gray-600 text-sm">Our support team is always ready to help you.</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
