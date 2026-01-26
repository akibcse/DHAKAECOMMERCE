import { useState, useEffect } from "react";
import { getProducts } from "../../utils/dbServices";
import ProductCard from "../../components/ProductCard";

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            const data = await getProducts();
            setProducts(data);
            setLoading(false);
        };
        fetchAll();
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">All Products</h1>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                    {products.length === 0 && <p className="text-center col-span-4 text-gray-500">No products found.</p>}
                </div>
            )}
        </div>
    );
};

export default Shop;
