import { ref, push, set, get, onValue, query, orderByChild, equalTo, off } from "firebase/database";
import { db, auth } from "../firebase/firebase";
import { createNotification } from "./notificationServices";

/**
 * Send a message for a specific order
 * @param {string} orderId - The order ID
 * @param {string} senderRole - 'user' or 'admin'
 * @param {string} senderEmail - Email of sender
 * @param {string} text - Message content
 */
export const sendMessage = async (orderId, senderRole, senderEmail, text) => {
    try {
        const messageRef = push(ref(db, `messages/${orderId}`));
        await set(messageRef, {
            senderRole,
            senderEmail,
            text,
            timestamp: new Date().toISOString(),
            read: false
        });

        // Notify recipient
        // If sender is user, notify admin. If sender is admin, notify user.
        if (senderRole === 'user') {
            await createNotification('admin', {
                title: 'New Message from Customer',
                message: `New message for Order #${orderId.slice(-8)}`,
                type: 'NEW_MESSAGE',
                link: `/admin/orders`,
                senderId: auth.currentUser?.uid
            });
        } else {
            // Need to get order to find userId
            const orderSnapshot = await get(ref(db, `orders/${orderId}`));
            if (orderSnapshot.exists()) {
                const order = orderSnapshot.val();
                await createNotification(order.userId, {
                    title: 'New Message from Shop',
                    message: `You have a new message for Order #${order.orderNumber}`,
                    type: 'NEW_MESSAGE',
                    link: `/order-messages/${orderId}`,
                    senderId: auth.currentUser?.uid
                });
            }
        }

        return messageRef.key;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

/**
 * Get all messages for an order with real-time listener
 * @param {string} orderId - The order ID
 * @param {function} callback - Callback function to receive messages
 * @returns {function} Unsubscribe function
 */
export const subscribeToMessages = (orderId, callback) => {
    const messagesRef = ref(db, `messages/${orderId}`);

    onValue(messagesRef, (snapshot) => {
        const messages = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                messages.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
        }
        // Sort by timestamp
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        callback(messages);
    });

    // Return unsubscribe function
    return () => off(messagesRef);
};

/**
 * Get unread message count for an order
 * @param {string} orderId - The order ID
 * @param {string} role - 'user' or 'admin' (to count messages from opposite role)
 */
export const getUnreadCount = async (orderId, role) => {
    try {
        const messagesRef = ref(db, `messages/${orderId}`);
        const snapshot = await get(messagesRef);

        if (!snapshot.exists()) return 0;

        let count = 0;
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            // Count unread messages from the opposite role
            if (!message.read && message.senderRole !== role) {
                count++;
            }
        });

        return count;
    } catch (error) {
        console.error("Error getting unread count:", error);
        return 0;
    }
};

/**
 * Mark messages as read
 * @param {string} orderId - The order ID
 * @param {string} role - 'user' or 'admin' (marks messages from opposite role as read)
 */
export const markMessagesAsRead = async (orderId, role) => {
    try {
        const messagesRef = ref(db, `messages/${orderId}`);
        const snapshot = await get(messagesRef);

        if (!snapshot.exists()) return;

        const updates = {};
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            // Mark messages from opposite role as read
            if (!message.read && message.senderRole !== role) {
                updates[`messages/${orderId}/${childSnapshot.key}/read`] = true;
            }
        });

        if (Object.keys(updates).length > 0) {
            const { update } = await import("firebase/database");
            await update(ref(db), updates);
        }
    } catch (error) {
        console.error("Error marking messages as read:", error);
        throw error;
    }
};
