import { ref, push, set, onValue, off, update, get, query, orderByChild, equalTo } from "firebase/database";
import { db } from "../firebase/firebase";

/**
 * Create a notification for a specific user or admin
 */
export const createNotification = async (userId, { title, message, type, link }) => {
    try {
        const notifRef = push(ref(db, `notifications/${userId}`));
        await set(notifRef, {
            title,
            message,
            type,
            link,
            read: false,
            timestamp: new Date().toISOString()
        });
        return notifRef.key;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

/**
 * Subscribe to notifications for a specific user
 */
export const subscribeToNotifications = (userId, callback) => {
    const notifRef = ref(db, `notifications/${userId}`);
    
    onValue(notifRef, (snapshot) => {
        const notifications = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                notifications.push({
                    id: child.key,
                    ...child.val()
                });
            });
        }
        // Newest first
        notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        callback(notifications);
    });

    return () => off(notifRef);
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (userId, notifId) => {
    try {
        await update(ref(db, `notifications/${userId}/${notifId}`), { read: true });
    } catch (error) {
        console.error("Error marking as read:", error);
    }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllRead = async (userId) => {
    try {
        const notifRef = ref(db, `notifications/${userId}`);
        const snapshot = await get(notifRef);
        if (!snapshot.exists()) return;

        const updates = {};
        snapshot.forEach((child) => {
            if (!child.val().read) {
                updates[`notifications/${userId}/${child.key}/read`] = true;
            }
        });

        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
        }
    } catch (error) {
        console.error("Error marking all read:", error);
    }
};
