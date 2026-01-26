import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getProducts } from "../../utils/dbServices"; // Need getProductById ideally
import { useCart } from "../../context/CartContext";
import { BsCartPlus } from "react-icons/bs";

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        // Optimally, dbServices should have getProductById. 
        // For now, fetching all and filtering (Realtime DB pattern for small datasets)
        const fetchProduct = async () => {
            const allProducts = await getProducts();
            const found = allProducts.find(p => p.id === id);
            setProduct(found);
            setLoading(false);
        };
        fetchProduct();
    }, [id]);

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!product) return <div className="text-center py-20">Product not found.</div>;

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden my-10">
            <div className="md:flex">
                <div className="md:flex-shrink-0 md:w-1/2 bg-gray-100 flex items-center justify-center h-96">
                    <img
                        className="h-full w-full object-contain"
                        src={product.image || "https://via.placeholder.com/500"}
                        alt={product.title}
                    />
                </div>
                <div className="p-8 md:w-1/2 flex flex-col justify-center">
                    <div className="uppercase tracking-wide text-sm text-secondary font-semibold">{product.category}</div>
                    <h1 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900">{product.title}</h1>
                    <p className="mt-4 text-xl text-gray-500">{product.description}</p>

                    <div className="mt-8 flex items-center justify-between">
                        <span className="text-3xl font-bold text-primary">৳{product.price}</span>
                        <button
                            onClick={() => addToCart(product)}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-green-700 transition shadow-lg transform hover:-translate-y-1"
                        >
                            <BsCartPlus size={24} /> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
