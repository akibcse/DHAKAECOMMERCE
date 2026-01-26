import { ref, push, set, get, update, remove, child } from "firebase/database";
import { db } from "../firebase/firebase";

// --- Products ---

export const addProduct = async (productData, imageUrl) => {
    try {
        const newProductKey = push(child(ref(db), 'products')).key;

        await set(ref(db, 'products/' + newProductKey), {
            ...productData,
            id: newProductKey,
            image: imageUrl || "",
            createdAt: new Date().toISOString()
        });

        return newProductKey;
    } catch (error) {
        console.error("Error adding product:", error);
        throw error;
    }
};

export const getProducts = async () => {
    try {
        const snapshot = await get(ref(db, 'products'));
        if (snapshot.exists()) {
            return Object.values(snapshot.val());
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

export const updateProduct = async (productId, updates) => {
    try {
        await update(ref(db, 'products/' + productId), updates);
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

export const deleteProduct = async (productId) => {
    try {
        await remove(ref(db, 'products/' + productId));
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};

export const createOrder = async (orderData) => {
    try {
        const newOrderKey = push(child(ref(db), 'orders')).key;
        await set(ref(db, 'orders/' + newOrderKey), {
            ...orderData,
            orderId: newOrderKey,
            createdAt: new Date().toISOString(),
            orderStatus: 'pending',
            paymentStatus: orderData.paymentMethod === 'ONLINE' ? 'paid' : 'pending' // Simulating online payment success
        });
        return newOrderKey;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

// --- Orders ---

export const getOrders = async () => {
    try {
        const snapshot = await get(ref(db, 'orders'));
        if (snapshot.exists()) {
            return Object.values(snapshot.val());
        } return [];
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

export const updateOrderStatus = async (orderId, status) => {
    try {
        await update(ref(db, 'orders/' + orderId), { orderStatus: status });
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
};

// --- Users ---

export const getAllUsers = async () => {
    try {
        const snapshot = await get(ref(db, 'users'));
        if (snapshot.exists()) {
            return Object.values(snapshot.val());
        } return [];
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};
