import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BsBell, BsCheck2All, BsInbox, BsChatText, BsTruck, BsBagCheck } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, markAsRead, markAllRead } from '../utils/notificationServices';

const NotificationCenter = () => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!currentUser) return;

        // Subscribe to user specific notifications
        const unsubscribeUser = subscribeToNotifications(currentUser.uid, (data) => {
            setNotifications(prev => {
                // Combine with existing admin notifications if any
                const userNotifs = data;
                const adminNotifs = prev.filter(n => n.recipient === 'admin');
                return [...userNotifs, ...adminNotifs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            });
        });

        // If admin, also subscribe to admin notifications
        let unsubscribeAdmin = () => {};
        if (currentUser.role === 'admin') {
            unsubscribeAdmin = subscribeToNotifications('admin', (data) => {
                const adminData = data.map(n => ({ ...n, recipient: 'admin' }));
                setNotifications(prev => {
                    const userNotifs = prev.filter(n => n.recipient !== 'admin');
                    return [...userNotifs, ...adminData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                });
            });
        }

        return () => {
            unsubscribeUser();
            unsubscribeAdmin();
        };
    }, [currentUser]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = (notif) => {
        markAsRead(notif.recipient === 'admin' ? 'admin' : currentUser.uid, notif.id);
    };

    const handleMarkAllRead = () => {
        markAllRead(currentUser.uid);
        if (currentUser.role === 'admin') markAllRead('admin');
    };

    const getIcon = (type) => {
        switch (type) {
            case 'ORDER_UPDATE': return <BsTruck className="text-blue-500" />;
            case 'NEW_ORDER': return <BsBagCheck className="text-green-500" />;
            case 'NEW_MESSAGE': return <BsChatText className="text-purple-500" />;
            default: return <BsBell className="text-gray-400" />;
        }
    };

    if (!currentUser) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-primary transition-colors focus:outline-none"
            >
                <BsBell size={22} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in origin-top-right">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                            <BsInbox /> Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                <BsCheck2All /> Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <BsBell className="mx-auto text-gray-200 mb-2" size={30} />
                                <p className="text-xs text-gray-400 font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <Link
                                    key={notif.id}
                                    to={notif.link}
                                    onClick={() => {
                                        handleMarkAsRead(notif);
                                        setShowDropdown(false);
                                    }}
                                    className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className="mt-1 p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-xs font-black truncate ${!notif.read ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {notif.title}
                                            </p>
                                            <span className="text-[8px] text-gray-400 font-bold whitespace-nowrap ml-2">
                                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-2 leading-relaxed">
                                            {notif.message}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
