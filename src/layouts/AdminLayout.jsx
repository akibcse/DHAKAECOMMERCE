import { Link, Outlet, useLocation } from "react-router-dom";
import { BsGrid, BsBoxSeam, BsCartCheck, BsPeople, BsHouse } from "react-icons/bs";
import clsx from "clsx";

const AdminLayout = () => {
    const location = useLocation();

    const menuItems = [
        { path: "/admin", label: "Dashboard", icon: <BsGrid /> },
        { path: "/admin/products", label: "Products", icon: <BsBoxSeam /> },
        { path: "/admin/orders", label: "Orders", icon: <BsCartCheck /> },
        { path: "/admin/users", label: "Users", icon: <BsPeople /> },
    ];

    return (
        <div className="min-h-screen flex bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-dark text-white flex-shrink-0 hidden md:block">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white">
                        Admin<span className="text-secondary">Panel</span>
                    </h2>
                </div>
                <nav className="mt-6">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition",
                                location.pathname === item.path && "bg-secondary text-white"
                            )}
                        >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                    <div className="mt-8 border-t border-gray-700 pt-4">
                        <Link to="/" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition">
                            <span className="mr-3 text-lg"><BsHouse /></span>
                            Back to Shop
                        </Link>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
