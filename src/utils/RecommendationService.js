import { ref, get, query, limitToLast, orderByKey } from "firebase/database";
import { db } from "../firebase/firebase";

/**
 * Smart Recommendation Engine logic
 */
export const getRecommendations = async (type, params = {}) => {
    try {
        const productsSnapshot = await get(ref(db, 'products'));
        const allProducts = productsSnapshot.exists() ? Object.values(productsSnapshot.val()) : [];

        const ordersSnapshot = await get(ref(db, 'orders'));
        const allOrders = ordersSnapshot.exists() ? Object.values(ordersSnapshot.val()) : [];

        switch (type) {
            case 'TRENDING':
                // Most sold products in all orders
                const salesCount = {};
                allOrders.forEach(order => {
                    Object.values(order.items || {}).forEach(item => {
                        salesCount[item.productId] = (salesCount[item.productId] || 0) + item.quantity;
                    });
                });
                return allProducts
                    .map(p => ({ ...p, sales: salesCount[p.id] || 0 }))
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 8);

            case 'BOUGHT_TOGETHER':
                // Products that appear in the same order as params.productId
                const coOccurrences = {};
                allOrders.forEach(order => {
                    const items = Object.values(order.items || {});
                    if (items.some(i => i.productId === params.productId)) {
                        items.forEach(i => {
                            if (i.productId !== params.productId) {
                                coOccurrences[i.productId] = (coOccurrences[i.productId] || 0) + 1;
                            }
                        });
                    }
                });
                return allProducts
                    .filter(p => coOccurrences[p.id])
                    .sort((a, b) => coOccurrences[b.id] - coOccurrences[a.id])
                    .slice(0, 4);

            case 'FOR_YOU':
                // Based on user's category affinity (most bought categories)
                if (!params.userId) return allProducts.sort(() => 0.5 - Math.random()).slice(0, 4);

                const userOrders = allOrders.filter(o => o.userId === params.userId);
                const categoryAffinity = {};
                userOrders.forEach(order => {
                    Object.values(order.items || {}).forEach(item => {
                        const product = allProducts.find(p => p.id === item.productId);
                        if (product && product.category) {
                            categoryAffinity[product.category] = (categoryAffinity[product.category] || 0) + 1;
                        }
                    });
                });

                const topCategory = Object.keys(categoryAffinity).sort((a, b) => categoryAffinity[b] - categoryAffinity[a])[0];
                return allProducts
                    .filter(p => p.category === topCategory)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 4);

            case 'SIMILAR':
                // Products in the same category
                const currentProduct = allProducts.find(p => p.id === params.productId);
                if (!currentProduct) return [];
                return allProducts
                    .filter(p => p.category === currentProduct.category && p.id !== params.productId)
                    .slice(0, 4);

            default:
                return allProducts.slice(0, 4);
        }
    } catch (error) {
        console.error("Recommendation Error:", error);
        return [];
    }
};
