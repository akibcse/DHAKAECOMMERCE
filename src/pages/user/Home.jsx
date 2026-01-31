import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getProducts } from "../../utils/dbServices";
import ProductCard from "../../components/ProductCard";
import OfferSlider from "../../components/OfferSlider";
import AIRecommendations from "../../components/AIRecommendations";
import { useAuth } from "../../context/AuthContext";

const Home = () => {
    const [products, setProducts] = useState([]);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchFeatured = async () => {
            const data = await getProducts();
            setProducts(data.slice(0, 4)); // Show first 4 products
        };
        fetchFeatured();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Dynamic Offer Slider (Hero) */}
            <OfferSlider />

            {/* AI Recommendations */}
            <AIRecommendations
                type="TRENDING"
                title="Trending Now"
            />

            {currentUser && (
                <AIRecommendations
                    type="FOR_YOU"
                    params={{ userId: currentUser.uid }}
                    title="Recommended for You"
                />
            )}

            {/* Featured Products */}
            <section className="mt-20">
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
