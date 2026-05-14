import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BsBell, BsCheck2All, BsInbox, BsChatText, BsTruck, BsBagCheck } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, markAsRead, markAllRead } from '../utils/notificationServices';
import toast from 'react-hot-toast';

const NOTIFICATION_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

// Strict tracking to prevent duplicate toasts across listeners/re-renders
const notifiedIds = new Set();

const NotificationCenter = ({ darkMode = false }) => {
    const { currentUser, userRole } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const lastNotifRef = useRef(null);
    const isInitialLoad = useRef(true);

    const unreadCount = notifications.filter(n => !n.read).length;

    const audioRef = useRef(new Audio(NOTIFICATION_SOUND));
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

    useEffect(() => {
        const unlockAudio = () => {
            if (isAudioUnlocked) return;
            
            // Play and immediately pause to unlock the audio context
            audioRef.current.play()
                .then(() => {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    setIsAudioUnlocked(true);
                    console.log("Audio context unlocked for mobile");
                })
                .catch(err => console.log("Audio unlock failed, waiting for next interaction", err));
        };

        window.addEventListener('click', unlockAudio, { once: true });
        window.addEventListener('touchstart', unlockAudio, { once: true });

        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
    }, [isAudioUnlocked]);

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => {
                console.log("Audio play blocked by browser. User must interact with the page first.");
                // If it failed and we thought it was unlocked, reset the state
                setIsAudioUnlocked(false);
            });
        }
    };

    const handleNewNotification = (notif) => {
        if (isInitialLoad.current) return;
        
        // Final guard against duplicates
        if (!notifiedIds.has(notif.id)) {
            notifiedIds.add(notif.id);

            // Skip own notifications (sender is current user)
            if (notif.senderId === currentUser.uid) return;
            
            // Toast Popup
            toast((t) => (
                <div onClick={() => { toast.dismiss(t.id); setShowDropdown(true); }} className="cursor-pointer">
                    <p className="font-black text-xs text-gray-900 uppercase tracking-tighter">{notif.title}</p>
                    <p className="text-[10px] text-gray-500 mt-1 font-medium leading-tight">{notif.message}</p>
                </div>
            ), {
                icon: '🔔',
                duration: 6000,
                position: window.innerWidth < 768 ? 'top-center' : 'top-right',
                style: {
                    borderRadius: '1.5rem',
                    background: '#ffffff',
                    color: '#000000',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #f3f4f6',
                    padding: '16px',
                    width: window.innerWidth < 768 ? '90%' : 'auto',
                    marginTop: window.innerWidth < 768 ? '10px' : '0'
                }
            });

            playNotificationSound();
        }
    };

    useEffect(() => {
        if (!currentUser) return;

        let userUnread = [];
        let adminUnread = [];

        const updateAll = (userData, adminData) => {
            const combined = [...userData, ...adminData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Check for new notifications
            if (combined.length > 0) {
                if (isInitialLoad.current) {
                    // On initial load, mark all existing unread as already notified to avoid mass notification
                    combined.forEach(notif => {
                        if (!notif.read) notifiedIds.add(notif.id);
                    });
                    isInitialLoad.current = false;
                } else {
                    // Find all unread notifications not yet processed
                    const newNotifications = combined.filter(n => !n.read && !notifiedIds.has(n.id));
                    // Process from oldest to newest among the new ones
                    newNotifications.reverse().forEach(handleNewNotification);
                }
            }
            
            setNotifications(combined);
        };

        // Subscribe to user specific notifications
        const unsubscribeUser = subscribeToNotifications(currentUser.uid, (data) => {
            userUnread = data;
            updateAll(userUnread, adminUnread);
        });

        // If admin, also subscribe to admin notifications
        let unsubscribeAdmin = () => {};
        if (userRole === 'admin') {
            unsubscribeAdmin = subscribeToNotifications('admin', (data) => {
                adminUnread = data.map(n => ({ ...n, recipient: 'admin' }));
                updateAll(userUnread, adminUnread);
            });
        }

        return () => {
            unsubscribeUser();
            unsubscribeAdmin();
        };
    }, [currentUser, userRole]);

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
        if (userRole === 'admin') markAllRead('admin');
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
                className={`relative p-2 transition-colors focus:outline-none ${darkMode ? 'text-white hover:text-secondary' : 'text-gray-600 hover:text-primary'}`}
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
