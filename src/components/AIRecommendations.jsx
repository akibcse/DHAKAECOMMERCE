import { useState, useEffect } from "react";
import { getRecommendations } from "../utils/RecommendationService";
import ProductCard from "./ProductCard";
import { motion } from "framer-motion";

const AIRecommendations = ({ type, params, title }) => {
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecs = async () => {
            setLoading(true);
            const data = await getRecommendations(type, params);
            setRecs(data);
            setLoading(false);
        };
        fetchRecs();
    }, [type, JSON.stringify(params)]);

    if (loading) return null;
    if (recs.length === 0) return null;

    return (
        <section className="mt-20">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h2>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">AI-Powered Suggestion</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {recs.map((product, index) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <ProductCard product={product} />
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default AIRecommendations;
