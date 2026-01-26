import Navbar from "../components/Navbar";

const MainLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>
            <footer className="bg-dark text-white py-8">
                <div className="container mx-auto px-4 text-center">
                    <p>&copy; {new Date().getFullYear()} DhakaEcommerce. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
