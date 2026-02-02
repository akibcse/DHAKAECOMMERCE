import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { BsGrid, BsBoxSeam, BsCartCheck, BsPeople, BsHouse, BsList, BsX, BsImages, BsTag, BsGraphUp, BsFileEarmarkBarGraph, BsFileEarmarkSpreadsheet, BsGear } from "react-icons/bs";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const AdminLayout = () => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const menuItems = [
        { path: "/admin", label: "Dashboard", icon: <BsGrid /> },
        { path: "/admin/analytics", label: "Analytics", icon: <BsGraphUp /> },
        { path: "/admin/sales-report", label: "Sales Report", icon: <BsFileEarmarkBarGraph /> },
        { path: "/admin/products", label: "Products", icon: <BsBoxSeam /> },
        { path: "/admin/orders", label: "Orders", icon: <BsCartCheck /> },
        { path: "/admin/users", label: "Users", icon: <BsPeople /> },
        { path: "/admin/offers", label: "Banners", icon: <BsImages /> },
        { path: "/admin/coupons", label: "Coupons", icon: <BsTag /> },
        { path: "/admin/accounting", label: "Accounting", icon: <BsFileEarmarkSpreadsheet /> },
        { path: "/admin/settings", label: "Settings", icon: <BsGear /> },
    ];

    const closeSidebar = () => setIsSidebarOpen(false);

    const SidebarContent = () => (
        <>
            <div className="p-6 border-b border-gray-800">
                <Link to="/admin" onClick={closeSidebar} className="text-2xl font-black text-white tracking-tight">
                    Admin<span className="text-secondary">Panel</span>
                </Link>
            </div>
            <nav className="mt-6 flex-1 px-4 space-y-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeSidebar}
                        className={clsx(
                            "flex items-center px-4 py-3 rounded-xl transition-all font-bold group",
                            location.pathname === item.path
                                ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                                : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        )}
                    >
                        <span className={clsx(
                            "mr-3 text-xl transition-transform group-hover:scale-110",
                            location.pathname === item.path ? "text-white" : "text-gray-500"
                        )}>
                            {item.icon}
                        </span>
                        {item.label}
                    </Link>
                ))}

                <div className="pt-8 border-t border-gray-800">
                    <Link
                        to="/"
                        onClick={closeSidebar}
                        className="flex items-center px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-all rounded-xl font-bold group"
                    >
                        <span className="mr-3 text-xl text-gray-500 group-hover:scale-110"><BsHouse /></span>
                        Back to Shop
                    </Link>
                </div>
            </nav>
        </>
    );

    return (
        <div className="min-h-screen flex bg-gray-50 overflow-x-hidden">
            {/* Desktop Sidebar */}
            <aside className="w-72 bg-dark text-white flex-shrink-0 hidden lg:flex flex-col border-r border-gray-800">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-dark text-white flex items-center justify-between px-6 z-[60] border-b border-gray-800">
                <Link to="/admin" className="text-xl font-black tracking-tight">
                    Admin<span className="text-secondary">Panel</span>
                </Link>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 bg-gray-800 rounded-xl text-white"
                >
                    <BsList size={24} />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeSidebar}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-80 bg-dark text-white z-[80] lg:hidden flex flex-col"
                        >
                            <div className="absolute top-4 right-4">
                                <button onClick={closeSidebar} className="p-2 bg-gray-800 rounded-full text-white">
                                    <BsX size={24} />
                                </button>
                            </div>
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 w-full flex flex-col">
                <div className={clsx(
                    "p-4 md:p-8 lg:p-10 transition-all w-full max-w-[1600px] mx-auto",
                    "mt-16 lg:mt-0" // Add margin for fixed mobile header
                )}>
                    {/* Add a subtle top bar for Desktop */}
                    <div className="hidden lg:flex justify-end mb-8 items-center gap-4">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">A</div>
                            <span className="text-sm font-bold text-gray-700">Administrator</span>
                        </div>
                    </div>

                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
