import { ref, get, update, push, set } from "firebase/database";
import { db, auth } from "../firebase/firebase";
import { createAuditLog } from "./dbServices";

/**
 * Rules Engine for Fraud Detection
 */
export const calculateFraudScore = async (userId, orderData) => {
    try {
        const userOrdersSnapshot = await get(ref(db, `orders`));
        const allOrders = userOrdersSnapshot.exists() ? Object.values(userOrdersSnapshot.val()) : [];
        const userOrders = allOrders.filter(o => o.userId === userId);

        const fraudLogsSnapshot = await get(ref(db, `fraudScores/${userId}`));
        let currentFraud = fraudLogsSnapshot.exists() ? fraudLogsSnapshot.val() : { score: 0, flags: [] };

        let additionalScore = 0;
        const newFlags = [];

        // Rule 1: Multiple COD orders with high cancellation risk
        const pendingCod = userOrders.filter(o => o.paymentMethod === 'COD' && o.orderStatus === 'pending').length;
        if (pendingCod > 3) {
            additionalScore += 30;
            newFlags.push('excessive_pending_cod');
        }

        // Rule 2: High value order from a relatively new account
        const userSnapshot = await get(ref(db, `users/${userId}`));
        const userData = userSnapshot.val();
        const accountAgeDays = (new Date() - new Date(userData.createdAt)) / (1000 * 60 * 60 * 24);
        if (accountAgeDays < 7 && orderData.finalAmount > 20000) {
            additionalScore += 50;
            newFlags.push('new_account_high_value');
        }

        // Rule 3: Repeated cancellations (Order farming / abuse)
        const cancelledCount = userOrders.filter(o => o.orderStatus === 'cancelled').length;
        if (cancelledCount > 5) {
            additionalScore += 25;
            newFlags.push('frequent_cancellations');
        }

        // Rule 4: Coupon Abuse (Multiple orders with same coupon in short time - Simplified)
        if (orderData.discounts.coupon > (orderData.subtotal * 0.5)) {
            additionalScore += 40;
            newFlags.push('coupon_abuse_attempt');
        }

        const finalScore = Math.min(100, currentFraud.score + additionalScore);
        const finalFlags = Array.from(new Set([...currentFraud.flags, ...newFlags]));

        const fraudUpdate = {
            score: finalScore,
            flags: finalFlags,
            lastUpdated: new Date().toISOString()
        };

        await update(ref(db, `fraudScores/${userId}`), fraudUpdate);

        if (additionalScore > 0) {
            await createAuditLog('FRAUD_SCORE_UPDATE', { userId, scoreInc: additionalScore, flags: newFlags }, 'user', userId);
        }

        return fraudUpdate;
    } catch (error) {
        console.error("Fraud Check Error:", error);
        return { score: 0, flags: [] };
    }
};

export const isCodAllowed = (fraudScore) => {
    return fraudScore < 70;
};
