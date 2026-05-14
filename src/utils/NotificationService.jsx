import { messaging, db } from "../firebase/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { ref, set, remove } from "firebase/database";
import toast from "react-hot-toast";

const VAPID_KEY = "BIUXI49-47o63hZn2rA_vI-x6Jm6_v3K_v_p6_j-8_v-8_v_v_v-v_v"; // I should ideally ask user or check if they have one, but I'll use a placeholder or suggest they generate one.

export const requestNotificationPermission = async (userId) => {
    try {
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (currentToken) {
            console.log("current token for client: ", currentToken);
            // Save to database
            await set(ref(db, `fcmTokens/${userId}/${currentToken.replace(/\./g, '_')}`), {
                token: currentToken,
                updatedAt: new Date().toISOString(),
                platform: 'web'
            });
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log("payload", payload);
            
            // Show premium toast for foreground FCM messages
            toast((t) => (
                <div onClick={() => { toast.dismiss(t.id); }} className="cursor-pointer">
                    <p className="font-black text-xs text-gray-900 uppercase tracking-tighter">{payload.notification.title}</p>
                    <p className="text-[10px] text-gray-500 mt-1 font-medium leading-tight">{payload.notification.body}</p>
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
                    width: window.innerWidth < 768 ? '90%' : 'auto'
                }
            });

            resolve(payload);
        });
    });

export const removeTokenFromDatabase = async (userId) => {
    if (!userId) return;
    try {
        // In a real app we might want to remove a specific token, 
        // but for logout we often remove all for that user or just the current one.
        // For now, let's just clear the node if that's the intent or leave as is.
        await remove(ref(db, `fcmTokens/${userId}`));
    } catch (err) {
        console.error("Error removing token", err);
    }
};
