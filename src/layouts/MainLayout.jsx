import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { useSettings } from "../context/SettingsContext"; // [NEW]

const MainLayout = ({ children }) => {
    const { settings } = useSettings();
    const brandName = settings?.branding?.brandName || "DhakaEcommerce";

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
                {children}
            </main>
            <BottomNav />
            <footer className="bg-dark text-white py-8 mb-16 md:mb-0">
                <div className="container mx-auto px-4 text-center">
                    <p>&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
