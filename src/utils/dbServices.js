import { ref, push, set, get, update, remove, child, runTransaction, query, orderByChild, equalTo } from "firebase/database";
import { db, auth } from "../firebase/firebase";
import { createNotification } from "./notificationServices";

// --- Helpers ---
export const generateOrderNumber = async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const counterRef = ref(db, `orderCounters/${today}`);

    try {
        const result = await runTransaction(counterRef, (currentValue) => {
            return (currentValue || 0) + 1;
        });

        if (result.committed) {
            const sequence = result.snapshot.val().toString().padStart(7, "0");
            return `${today}${sequence}`;
        }
        throw new Error("Failed to generate atomic sequence");
    } catch (error) {
        console.error("Critical Order Number Error:", error);
        throw error; // Never fallback to random for business IDs
    }
};

// --- Products ---

export const addProduct = async (productData) => {
    try {
        const newProductKey = push(child(ref(db), 'products')).key;
        const productWithId = {
            ...productData,
            id: newProductKey,
            createdAt: new Date().toISOString(),
            visibility: productData.visibility ?? true,
            stock: productData.stock ?? 0
        };

        await set(ref(db, 'products/' + newProductKey), productWithId);
        await createAuditLog('PRODUCT_CREATE', { productId: newProductKey, title: productData.title });
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
        await createAuditLog('PRODUCT_UPDATE', { productId, updates });
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

export const deleteProduct = async (productId) => {
    try {
        await remove(ref(db, 'products/' + productId));
        await createAuditLog('PRODUCT_DELETE', { productId });
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};

export const createOrder = async (orderData) => {
    try {
        const orderNumber = await generateOrderNumber();
        if (!orderNumber || !/^\d{15}$/.test(orderNumber)) {
            throw new Error("Order creation aborted: Invalid order number format.");
        }

        const newOrderKey = push(child(ref(db), 'orders')).key;

        const finalOrder = {
            ...orderData,
            orderId: newOrderKey,
            orderNumber: orderNumber,
            createdAt: new Date().toISOString(),
            orderStatus: orderData.orderStatus || 'pending',
            paymentStatus: orderData.paymentStatus || (orderData.paymentMethod === 'ONLINE' ? 'paid' : 'pending'),
            timeline: [
                { status: 'pending', timestamp: new Date().toISOString(), note: 'Order placed successfully' }
            ],
            // Ensure numeric safety
            subtotal: Number(orderData.subtotal || 0),
            discounts: {
                product: Number(orderData.discounts?.product || 0),
                coupon: Number(orderData.discounts?.coupon || 0),
                flashSale: Number(orderData.discounts?.flashSale || 0)
            },
            walletUsed: Number(orderData.walletUsed || 0),
            deliveryCharge: Number(orderData.deliveryCharge || 0),
            finalAmount: Number(orderData.finalAmount || 0)
        };

        if (finalOrder.finalAmount <= 0) {
            console.warn("Placing an order with 0 amount. Checking data...", finalOrder);
        }

        await set(ref(db, 'orders/' + newOrderKey), finalOrder);
        await createAuditLog('ORDER_CREATE', { orderId: newOrderKey, orderNumber }, 'order', newOrderKey);

        // Notify Admin
        await createNotification('admin', {
            title: 'New Order Placed',
            message: `Order #${orderNumber} has been placed by ${orderData.shippingDetails?.name || 'Customer'}.`,
            type: 'NEW_ORDER',
            link: `/admin/orders`,
            senderId: auth.currentUser?.uid
        });

        // Notify User
        await createNotification(orderData.userId, {
            title: 'Order Confirmed',
            message: `Your order #${orderNumber} has been placed successfully!`,
            type: 'ORDER_UPDATE',
            link: `/orders/${newOrderKey}`,
            senderId: auth.currentUser?.uid
        });

        return { orderId: newOrderKey, orderNumber };
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

export const getUserOrders = async (userId) => {
    try {
        // [FALLBACK FIX] Fetch all orders and filter client-side to bypass potential missing index issues
        const snapshot = await get(ref(db, 'orders'));

        if (snapshot.exists()) {
            const allOrders = Object.values(snapshot.val());
            // Filter by userId
            return allOrders.filter(order => order.userId === userId);
        }
        return [];
    } catch (error) {
        console.error("Error fetching user orders:", error);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    try {
        // First try direct lookup assuming orderId matches key
        const snapshot = await get(ref(db, `orders/${orderId}`));
        if (snapshot.exists()) {
            return snapshot.val();
        }

        // Fallback: search by orderId field if keys are different
        const ordersRef = ref(db, 'orders');
        const orderQuery = query(ordersRef, orderByChild('orderId'), equalTo(orderId));
        const querySnapshot = await get(orderQuery);

        if (querySnapshot.exists()) {
            return Object.values(querySnapshot.val())[0];
        }
        return null;
    } catch (error) {
        console.error("Error fetching order by ID:", error);
        throw error;
    }
};

export const updateOrderStatus = async (orderId, status) => {
    try {
        await update(ref(db, 'orders/' + orderId), { orderStatus: status });
        
        // Fetch order to get userId for notification
        const snapshot = await get(ref(db, 'orders/' + orderId));
        if (snapshot.exists()) {
            const order = snapshot.val();
            await createNotification(order.userId, {
                title: 'Order Status Updated',
                message: `Your order #${order.orderNumber} is now ${status.toUpperCase()}.`,
                type: 'ORDER_UPDATE',
                link: `/orders/${orderId}`,
                senderId: auth.currentUser?.uid
            });
        }
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
};

// --- Users ---

export const deleteOrder = async (orderId) => {
    try {
        await remove(ref(db, 'orders/' + orderId));
        await createAuditLog('ORDER_DELETE', { orderId });
    } catch (error) {
        console.error("Error deleting order:", error);
        throw error;
    }
};

export const updatePaymentStatus = async (orderId, status) => {
    try {
        await update(ref(db, 'orders/' + orderId), { paymentStatus: status });
        await createAuditLog('ORDER_PAYMENT_UPDATE', { orderId, status });

        // Notify User
        const snapshot = await get(ref(db, 'orders/' + orderId));
        if (snapshot.exists()) {
            const order = snapshot.val();
            await createNotification(order.userId, {
                title: 'Payment Status Updated',
                message: `Your payment for order #${order.orderNumber} is now ${status.toUpperCase()}.`,
                type: 'ORDER_UPDATE',
                link: `/orders/${orderId}`,
                senderId: auth.currentUser?.uid
            });
        }
    } catch (error) {
        console.error("Error updating payment status:", error);
        throw error;
    }
};

// --- Users ---

export const getAllUsers = async () => {
    try {
        const snapshot = await get(ref(db, 'users'));
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            return Object.keys(usersData).map(uid => ({
                ...usersData[uid],
                uid: uid
            }));
        } return [];
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const updateUserRole = async (userId, role) => {
    try {
        await update(ref(db, 'users/' + userId), { role });
        await createAuditLog('USER_ROLE_UPDATE', { targetUserId: userId, newRole: role });
    } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
    }
};

export const updateUserStatus = async (userId, disabled) => {
    try {
        await update(ref(db, 'users/' + userId), { disabled });
        await createAuditLog('USER_STATUS_UPDATE', { targetUserId: userId, disabled }, 'user', userId);
    } catch (error) {
        console.error("Error updating user status:", error);
        throw error;
    }
};

export const updateUserProfile = async (userId, profileData) => {
    try {
        const updates = {
            ...profileData,
            updatedAt: new Date().toISOString()
        };

        await update(ref(db, 'users/' + userId), updates);
        await createAuditLog('USER_PROFILE_UPDATE', { updates }, 'user', userId);
        return profileData.photoURL;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};

// --- Offers ---

export const addOffer = async (offerData) => {
    try {
        const newOfferKey = push(child(ref(db), 'offers')).key;
        const offer = { ...offerData, id: newOfferKey, active: true };
        await set(ref(db, 'offers/' + newOfferKey), offer);
        await createAuditLog('OFFER_CREATE', { title: offerData.title }, 'offer', newOfferKey);
        return newOfferKey;
    } catch (error) {
        console.error("Error adding offer:", error);
        throw error;
    }
};

export const getOffers = async () => {
    try {
        const snapshot = await get(ref(db, 'offers'));
        return snapshot.exists() ? Object.values(snapshot.val()) : [];
    } catch (error) {
        console.error("Error fetching offers:", error);
        throw error;
    }
};

export const updateOffer = async (offerId, updates) => {
    try {
        await update(ref(db, 'offers/' + offerId), updates);
        await createAuditLog('OFFER_UPDATE', { updates }, 'offer', offerId);
    } catch (error) {
        console.error("Error updating offer:", error);
        throw error;
    }
};

export const deleteOffer = async (offerId) => {
    try {
        await remove(ref(db, 'offers/' + offerId));
        await createAuditLog('OFFER_DELETE', { offerId }, 'offer', offerId);
    } catch (error) {
        console.error("Error deleting offer:", error);
        throw error;
    }
};

// --- Coupons ---

export const addCoupon = async (couponData) => {
    try {
        const code = couponData.code.toUpperCase();
        await set(ref(db, 'coupons/' + code), {
            ...couponData,
            code,
            used: 0,
            active: true,
            createdAt: new Date().toISOString()
        });
        await createAuditLog('COUPON_CREATE', { code }, 'coupon', code);
    } catch (error) {
        console.error("Error adding coupon:", error);
        throw error;
    }
};

export const getCoupons = async () => {
    try {
        const snapshot = await get(ref(db, 'coupons'));
        return snapshot.exists() ? Object.values(snapshot.val()) : [];
    } catch (error) {
        console.error("Error fetching coupons:", error);
        throw error;
    }
};

export const updateCoupon = async (code, updates) => {
    try {
        await update(ref(db, 'coupons/' + code), updates);
        await createAuditLog('COUPON_UPDATE', { code, updates }, 'coupon', code);
    } catch (error) {
        console.error("Error updating coupon:", error);
        throw error;
    }
};

export const deleteCoupon = async (code) => {
    try {
        await remove(ref(db, 'coupons/' + code));
        await createAuditLog('COUPON_DELETE', { code }, 'coupon', code);
    } catch (error) {
        console.error("Error deleting coupon:", error);
        throw error;
    }
};

export const validateCoupon = async (code, orderAmount) => {
    try {
        const snapshot = await get(ref(db, 'coupons/' + code.toUpperCase()));
        if (!snapshot.exists()) throw new Error("Invalid coupon code");

        const coupon = snapshot.val();
        if (!coupon.active) throw new Error("Coupon is no longer active");
        if (coupon.expiry && new Date(coupon.expiry) < new Date()) throw new Error("Coupon has expired");
        if (coupon.used >= coupon.usageLimit) throw new Error("Coupon usage limit reached");
        if (orderAmount < coupon.minOrder) throw new Error(`Minimum order of ৳${coupon.minOrder} required`);

        return coupon;
    } catch (error) {
        throw error;
    }
};

// --- Taxonomy (Categories & Sub-categories) ---

export const getTaxonomy = async () => {
    try {
        const snapshot = await get(ref(db, 'taxonomy'));
        return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
        console.error("Error fetching taxonomy:", error);
        throw error;
    }
};

export const saveTaxonomy = async (taxonomyData) => {
    try {
        await set(ref(db, 'taxonomy'), taxonomyData);
        await createAuditLog('TAXONOMY_UPDATE', { taxonomyData });
    } catch (error) {
        console.error("Error saving taxonomy:", error);
        throw error;
    }
};

export const deleteTaxonomyCategory = async (categoryName) => {
    try {
        await remove(ref(db, `taxonomy/${categoryName}`));
        await createAuditLog('TAXONOMY_CATEGORY_DELETE', { categoryName });
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
};

// --- Audit Logs ---

export const createAuditLog = async (action, details, targetType = 'system', targetId = 'none') => {
    try {
        const user = auth.currentUser;
        let actorRole = 'guest';

        if (user) {
            const roleSnapshot = await get(ref(db, `users/${user.uid}/role`));
            actorRole = roleSnapshot.exists() ? roleSnapshot.val() : 'user';
        }

        const logRef = push(ref(db, 'auditLogs'));
        await set(logRef, {
            actorId: user?.uid || 'system',
            actorRole: actorRole,
            action,
            details,
            targetType,
            targetId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error creating audit log:", error);
    }
};
