import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext"; // [NEW]
import { BsCart, BsPerson, BsList, BsX } from "react-icons/bs";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
    const { currentUser, logout, userRole } = useAuth();
    const { cartCount } = useCart();
    const { settings } = useSettings(); // [NEW]
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const brandName = settings?.branding?.brandName || "DhakaEcommerce";

    // Split branding for styling if possible, or just display string
    const renderBrand = () => {
        if (brandName.toLowerCase().includes("ecommerce")) {
            const prefix = brandName.replace(/ecommerce/i, "");
            return <>{prefix}<span className="text-secondary">Ecommerce</span></>;
        }
        return brandName;
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-primary">
                    {renderBrand()}
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                    <Link to="/" className="hover:text-primary transition">Home</Link>
                    <Link to="/shop" className="hover:text-primary transition">Shop</Link>
                    {userRole === 'admin' && (
                        <Link to="/admin" className="text-secondary font-medium hover:text-red-700 transition">Admin Panel</Link>
                    )}
                </div>

                {/* Icons */}
                <div className="hidden md:flex items-center space-x-6">
                    <Link to="/cart" className="relative hover:text-primary transition">
                        <BsCart size={24} />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {currentUser ? (
                        <div className="relative group">
                            <button className="flex items-center hover:text-primary transition">
                                <BsPerson size={24} />
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">My Profile</Link>
                                <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100">My Orders</Link>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Logout</button>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className="bg-primary text-white px-5 py-2 rounded-full hover:bg-green-700 transition">
                            Login
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
                    {isOpen ? <BsX size={30} /> : <BsList size={30} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t"
                    >
                        <div className="flex flex-col p-4 space-y-4">
                            <Link to="/" onClick={() => setIsOpen(false)} className="hover:text-primary">Home</Link>
                            <Link to="/shop" onClick={() => setIsOpen(false)} className="hover:text-primary">Shop</Link>
                            <Link to="/cart" onClick={() => setIsOpen(false)} className="flex items-center justify-between hover:text-primary">
                                Cart
                                <span className="bg-secondary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>
                            </Link>
                            {userRole === 'admin' && (
                                <Link to="/admin" onClick={() => setIsOpen(false)} className="text-secondary">Admin Panel</Link>
                            )}
                            {currentUser ? (
                                <>
                                    <Link to="/profile" onClick={() => setIsOpen(false)} className="hover:text-primary">My Profile</Link>
                                    <Link to="/orders" onClick={() => setIsOpen(false)} className="hover:text-primary">My Orders</Link>
                                    <button onClick={() => { handleLogout(); setIsOpen(false); }} className="text-left text-red-600">Logout</button>
                                </>
                            ) : (
                                <Link to="/login" onClick={() => setIsOpen(false)} className="bg-primary text-white text-center py-2 rounded-full">Login</Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
