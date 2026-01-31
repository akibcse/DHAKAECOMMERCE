import { useAuth } from "../../context/AuthContext";
import { BsPencilSquare } from "react-icons/bs";
import MyInfo from "../../components/profile/MyInfo";

const Profile = () => {
    const { currentUser, userData, userRole } = useAuth();

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
            {/* User Header */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative group/photo">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 flex items-center justify-center text-primary text-4xl font-black">
                            {userData?.photoURL ? (
                                <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                                userData?.displayName || userData?.name ? (userData.displayName || userData.name)[0].toUpperCase() : currentUser?.email[0].toUpperCase()
                            )}
                        </div>
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">
                            {userData?.displayName || userData?.name || "E-Commerce User"}
                        </h1>
                        <p className="text-gray-500 font-medium mb-4">{currentUser?.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <span className="px-5 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                                Status: {userRole}
                            </span>
                            <span className="px-5 py-1.5 bg-red-50 text-secondary rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                                Verified Customer
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <MyInfo />
        </div>
    );
};

export default Profile;
