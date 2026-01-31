import { Link, useLocation } from "react-router-dom";
import { BsHouse, BsBag, BsCart, BsPerson, BsBagCheck } from "react-icons/bs";
import { useCart } from "../context/CartContext";

const BottomNav = () => {
    const location = useLocation();
    const { cartCount } = useCart();

    const navItems = [
        { path: "/", label: "Home", icon: BsHouse },
        { path: "/shop", label: "Shop", icon: BsBag },
        { path: "/cart", label: "Cart", icon: BsCart, badge: cartCount },
        { path: "/orders", label: "Orders", icon: BsBagCheck },
        { path: "/profile", label: "Profile", icon: BsPerson },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? "text-primary" : "text-gray-500"
                                }`}
                        >
                            <div className="relative">
                                <Icon size={24} />
                                {item.badge > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-secondary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
