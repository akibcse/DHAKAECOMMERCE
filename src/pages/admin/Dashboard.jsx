import { useEffect, useState } from "react";
import { getOrders, getAllUsers, getProducts } from "../../utils/dbServices";
import { BsCart, BsCurrencyDollar, BsPeople, BsBoxSeam } from "react-icons/bs";

const Dashboard = () => {
    const [stats, setStats] = useState({
        orders: 0,
        revenue: 0,
        users: 0,
        products: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            const orders = await getOrders();
            const users = await getAllUsers();
            const products = await getProducts();

            const revenue = orders.reduce((acc, order) => acc + (Number(order.totalAmount) || 0), 0);

            setStats({
                orders: orders.length,
                revenue: revenue,
                users: users.length,
                products: products.length
            });
        };

        fetchData();
    }, []);

    const cards = [
        { label: "Total Revenue", value: `৳${stats.revenue}`, icon: <BsCurrencyDollar size={30} />, color: "bg-green-100 text-green-600" },
        { label: "Total Orders", value: stats.orders, icon: <BsCart size={30} />, color: "bg-blue-100 text-blue-600" },
        { label: "Total Users", value: stats.users, icon: <BsPeople size={30} />, color: "bg-purple-100 text-purple-600" },
        { label: "Total Products", value: stats.products, icon: <BsBoxSeam size={30} />, color: "bg-yellow-100 text-yellow-600" },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow flex items-center">
                        <div className={`p-4 rounded-full ${card.color} mr-4`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{card.label}</p>
                            <h3 className="text-2xl font-bold">{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
