import { useState, useEffect } from "react";
import { addProduct, getProducts, deleteProduct } from "../../utils/dbServices";
import { BsPlus, BsTrash, BsPencil } from "react-icons/bs";

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Electronics");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            await addProduct({
                title,
                price: Number(price),
                category,
                description,
                stock: true
            }, imageUrl);
            setShowModal(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error("Add Product Error:", error);
            alert("Failed to add product: " + error.message);
        }
        setUploading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            await deleteProduct(id);
            fetchProducts();
        }
    };

    const resetForm = () => {
        setTitle("");
        setPrice("");
        setCategory("Electronics");
        setDescription("");
        setImageUrl("");
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Products</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
                >
                    <BsPlus size={24} /> Add Product
                </button>
            </div>

            {loading ? (
                <p>Loading products...</p>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover" src={product.image || "https://via.placeholder.com/150"} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{product.title}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ৳{product.price}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 ml-4">
                                            <BsTrash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-full max-w-lg">
                        <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <input
                                type="text" placeholder="Product Title" required
                                className="w-full border p-2 rounded"
                                value={title} onChange={e => setTitle(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number" placeholder="Price" required
                                    className="w-full border p-2 rounded"
                                    value={price} onChange={e => setPrice(e.target.value)}
                                />
                                <select
                                    className="w-full border p-2 rounded"
                                    value={category} onChange={e => setCategory(e.target.value)}
                                >
                                    <option>Electronics</option>
                                    <option>Fashion</option>
                                    <option>Home</option>
                                    <option>Beauty</option>
                                </select>
                            </div>
                            <textarea
                                placeholder="Description" required
                                className="w-full border p-2 rounded"
                                value={description} onChange={e => setDescription(e.target.value)}
                            ></textarea>
                            <input
                                type="url"
                                placeholder="Image URL (e.g., https://example.com/image.jpg)"
                                required
                                className="w-full border p-2 rounded"
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                            />

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" disabled={uploading} className="px-4 py-2 bg-primary text-white rounded hover:bg-green-700">
                                    {uploading ? "Saving..." : "Save Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
