import { ref, push, set, get, update, runTransaction, query, orderByChild, equalTo } from "firebase/database";
import { db, auth } from "../firebase/firebase";
import { createAuditLog } from "./dbServices"; // Reuse existing audit log

// --- Accounts ---

export const createCustomerAccount = async (customerData) => {
    try {
        const newAccountRef = push(ref(db, 'accounts'));
        const accountId = newAccountRef.key;

        const account = {
            id: accountId,
            name: customerData.name,
            phone: customerData.phone,
            address: customerData.address || "",
            openingBalance: Number(customerData.openingBalance || 0),
            currentBalance: Number(customerData.openingBalance || 0), // Positive = Due, Negative = Advance
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await set(newAccountRef, account);
        await createAuditLog('ACCOUNT_CREATE', { accountId, name: customerData.name }, 'account', accountId);
        return accountId;
    } catch (error) {
        console.error("Error creating customer account:", error);
        throw error;
    }
};

export const getCustomerAccounts = async () => {
    try {
        const snapshot = await get(ref(db, 'accounts'));
        if (!snapshot.exists()) return [];

        const accounts = Object.values(snapshot.val());

        // Calculate current balance from ledger for each account
        const accountsWithBalance = await Promise.all(
            accounts.map(async (account) => {
                const calculatedBalance = await calculateCustomerBalance(account.id);
                return {
                    ...account,
                    currentBalance: calculatedBalance
                };
            })
        );

        return accountsWithBalance;
    } catch (error) {
        console.error("Error fetching accounts:", error);
        throw error;
    }
};

export const getAccountById = async (accountId) => {
    try {
        const snapshot = await get(ref(db, `accounts/${accountId}`));
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error("Error fetching account:", error);
        throw error;
    }
};

// --- Balance Calculation (Ledger-Based) ---

/**
 * Calculate customer balance from ledger entries
 * Balance = Opening Balance + Total Debits - Total Credits
 */
export const calculateCustomerBalance = async (customerId) => {
    try {
        // Get account for opening balance
        const account = await getAccountById(customerId);
        if (!account) return 0;

        const openingBalance = Number(account.openingBalance || 0);

        // Get all ledger transactions
        const ledgerEntries = await getCustomerLedger(customerId);

        let totalDebits = 0;
        let totalCredits = 0;

        ledgerEntries.forEach(entry => {
            if (entry.type === 'DEBIT') {
                totalDebits += Number(entry.amount || 0);
            } else if (entry.type === 'CREDIT') {
                totalCredits += Number(entry.amount || 0);
            }
        });

        // Balance = Opening + Debits - Credits
        // Positive = Customer owes (Due), Negative = Customer has advance
        return openingBalance + totalDebits - totalCredits;
    } catch (error) {
        console.error("Error calculating balance:", error);
        return 0;
    }
};

/**
 * Get customer ledger with running balance
 */
export const getCustomerLedgerWithBalance = async (customerId) => {
    try {
        const account = await getAccountById(customerId);
        if (!account) return [];

        const openingBalance = Number(account.openingBalance || 0);
        const ledgerEntries = await getCustomerLedger(customerId);

        let runningBalance = openingBalance;
        const ledgerWithBalance = ledgerEntries.map(entry => {
            if (entry.type === 'DEBIT') {
                runningBalance += Number(entry.amount || 0);
            } else if (entry.type === 'CREDIT') {
                runningBalance -= Number(entry.amount || 0);
            }

            return {
                ...entry,
                runningBalance
            };
        });

        return ledgerWithBalance;
    } catch (error) {
        console.error("Error getting ledger with balance:", error);
        return [];
    }
};

/**
 * Validate payment amount against customer balance
 */
export const validatePayment = async (customerId, paymentAmount) => {
    const currentBalance = await calculateCustomerBalance(customerId);

    if (paymentAmount <= 0) {
        return { valid: false, message: "Payment amount must be greater than 0" };
    }

    // Allow over-payment (advance) but warn
    if (paymentAmount > currentBalance && currentBalance > 0) {
        return {
            valid: true,
            warning: `Payment exceeds current due (৳${currentBalance}). This will create an advance balance.`,
            willCreateAdvance: true
        };
    }

    return { valid: true };
};

/**
 * Get customer summary with simplified business terms
 * Returns: openingDue, totalSales, totalPayments, currentDue
 */
export const getCustomerSummary = async (customerId) => {
    try {
        const account = await getAccountById(customerId);
        if (!account) return null;

        const ledger = await getCustomerLedger(customerId);

        let totalSales = 0;
        let totalPayments = 0;

        ledger.forEach(entry => {
            if (entry.type === 'DEBIT') {
                totalSales += Number(entry.amount || 0);
            } else if (entry.type === 'CREDIT') {
                totalPayments += Number(entry.amount || 0);
            }
        });

        const openingDue = Number(account.openingBalance || 0);
        const currentDue = openingDue + totalSales - totalPayments;

        return {
            openingDue,
            totalSales,
            totalPayments,
            currentDue
        };
    } catch (error) {
        console.error("Error getting customer summary:", error);
        return null;
    }
};

// --- Offline Sales ---

export const createOfflineSale = async (saleData) => {
    // saleData: { customerId, items: [], totalAmount, paidAmount, discount, date, note }
    try {
        const saleRef = push(ref(db, 'salesLedger'));
        const saleId = saleRef.key;

        // Generate a pseudo-order number for offline sale
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderNumber = `OFF-${dateStr}-${randomSuffix}`;

        // Calculate net amount after discount
        const netAmount = Number(saleData.totalAmount) - Number(saleData.discount || 0);
        const dueAmount = netAmount - Number(saleData.paidAmount);

        const saleEntry = {
            id: saleId,
            orderNumber, // Unique identifier for the sale
            source: 'offline',
            customerId: saleData.customerId,
            items: saleData.items,
            totalAmount: Number(saleData.totalAmount),
            paidAmount: Number(saleData.paidAmount),
            dueAmount: dueAmount,
            discount: Number(saleData.discount || 0),
            netAmount: netAmount, // Add net amount field
            date: saleData.date || new Date().toISOString(),
            note: saleData.note || "",
            createdAt: new Date().toISOString()
        };

        // Atomic update: Record Sale + Update Customer Balance + Log Transaction
        await runTransaction(ref(db), (root) => {
            if (!root) return root;

            // 1. Record Sale
            if (!root.salesLedger) root.salesLedger = {};
            root.salesLedger[saleId] = saleEntry;

            // 2. Update Account
            if (root.accounts && root.accounts[saleData.customerId]) {
                const account = root.accounts[saleData.customerId];
                account.currentBalance = (account.currentBalance || 0) + dueAmount; // Sales increase balance (Due)
                account.totalSales = (account.totalSales || 0) + netAmount; // Use net amount for total sales
                account.updatedAt = new Date().toISOString();
            }

            // 3. Ledger Transaction (Debit the customer for the full sale amount)
            const txnId = push(ref(db, 'ledgerTransactions')).key; // This push just generates a key, doesn't write
            // Ideally we'd push inside transaction but Firebase RTDB JSON transaction is whole-tree or subtree.
            // For simplicity in this large object, let's append to a transaction lists if feasible, 
            // OR simply handle transactions separately if atomic strictness allows small gaps. 
            // For simplicity and safety against massive root reads, we often split. 
            // BUT, for precise balance, we use the transaction above for balance.
            // We will write the log entries AFTER the transaction succeeds to avoid clogging the transaction payload with array pushes if lists are long.

            return root;
        });

        // Write Ledger Transactions (After balance update succeeds)
        // 1. Debit Customer (Net Sales Amount after discount)
        await recordLedgerTransaction({
            type: 'DEBIT',
            ledgerId: saleData.customerId,
            amount: netAmount, // Use net amount instead of totalAmount
            referenceId: saleId,
            referenceType: 'SALES',
            description: `Offline Sale ${orderNumber}${saleData.discount > 0 ? ` (Discount: ৳${saleData.discount})` : ''}`,
            date: saleData.date
        });

        // 2. Credit Sales Account (Logic handled implicitly in reports, but we track the payment if any)
        if (Number(saleData.paidAmount) > 0) {
            // Create a Receipt for the immediate payment
            await createMoneyReceipt({
                customerId: saleData.customerId,
                amount: Number(saleData.paidAmount),
                paymentMode: 'cash', // Default for offline mostly
                reference: `Initial pay for ${orderNumber}`,
                date: saleData.date,
                linkedSaleId: saleId
            });
        }

        await createAuditLog('OFFLINE_SALE_CREATE', { saleId, orderNumber }, 'sale', saleId);
        return saleId;

    } catch (error) {
        console.error("Error creating offline sale:", error);
        throw error;
    }
};

// --- Money Receipts ---

export const createMoneyReceipt = async (receiptData) => {
    // receiptData: { customerId, amount, paymentMode, reference, date, linkedSaleId }
    try {
        const receiptRef = push(ref(db, 'receipts'));
        const receiptId = receiptRef.key;

        // Generate Receipt No
        const dateStr = new Date().toISOString().slice(2, 8).replace(/-/g, ""); // YYMMDD
        const receiptNo = `RCPT-${dateStr}-${Math.floor(Math.random() * 1000)}`;

        const receiptEntry = {
            id: receiptId,
            receiptNo,
            customerId: receiptData.customerId,
            amount: Number(receiptData.amount),
            paymentMode: receiptData.paymentMode,
            reference: receiptData.reference || "",
            date: receiptData.date || new Date().toISOString(),
            linkedSaleId: receiptData.linkedSaleId || null,
            createdAt: new Date().toISOString()
        };

        await runTransaction(ref(db), (root) => {
            if (!root) return root;

            // 1. Record Receipt
            if (!root.receipts) root.receipts = {};
            root.receipts[receiptId] = receiptEntry;

            // 2. Update Account
            if (root.accounts && root.accounts[receiptData.customerId]) {
                const account = root.accounts[receiptData.customerId];
                account.currentBalance = (account.currentBalance || 0) - Number(receiptEntry.amount); // Payment reduces Due
                account.totalPaid = (account.totalPaid || 0) + Number(receiptEntry.amount);
                account.updatedAt = new Date().toISOString();
            }

            return root;
        });

        // Record Ledger Transaction (Credit Customer)
        await recordLedgerTransaction({
            type: 'CREDIT',
            ledgerId: receiptData.customerId,
            amount: Number(receiptEntry.amount),
            referenceId: receiptId,
            referenceType: 'RECEIPT',
            description: `Receipt ${receiptNo} (${receiptData.paymentMode})`,
            date: receiptData.date
        });

        await createAuditLog('RECEIPT_CREATE', { receiptId, receiptNo }, 'receipt', receiptId);
        return receiptId;

    } catch (error) {
        console.error("Error creating receipt:", error);
        throw error;
    }
};

// --- Ledger & Reports ---

export const recordLedgerTransaction = async (txnData) => {
    // txnData: { type: 'DEBIT'|'CREDIT', ledgerId, amount, referenceId, referenceType, description, date }
    try {
        const txnRef = push(ref(db, 'ledgerTransactions'));
        const txnEntry = {
            ...txnData,
            id: txnRef.key,
            createdAt: new Date().toISOString()
        };
        await set(txnRef, txnEntry);
        console.log('✅ Ledger transaction recorded:', txnEntry);
    } catch (error) {
        console.error('❌ Error recording ledger transaction:', error);
        throw error;
    }
};

export const getCustomerLedger = async (customerId) => {
    try {
        console.log('🔍 Fetching ledger for customer:', customerId);
        const snapshot = await get(query(ref(db, 'ledgerTransactions'), orderByChild('ledgerId'), equalTo(customerId)));
        if (snapshot.exists()) {
            const entries = Object.values(snapshot.val()).sort((a, b) => new Date(a.date) - new Date(b.date));
            console.log(`✅ Found ${entries.length} ledger entries for customer ${customerId}:`, entries);
            return entries;
        }
        console.log('⚠️ No ledger entries found for customer:', customerId);
        return [];
    } catch (error) {
        console.error('❌ Error fetching ledger:', error);
        throw error;
    }
};

export const getSalesLedger = async () => {
    try {
        const snapshot = await get(ref(db, 'salesLedger'));
        if (snapshot.exists()) return Object.values(snapshot.val());
        return [];
    } catch (error) {
        console.error("Error fetching sales ledger:", error);
        throw error;
    }
};

export const getReceipts = async () => {
    try {
        const snapshot = await get(ref(db, 'receipts'));
        if (snapshot.exists()) return Object.values(snapshot.val());
        return [];
    } catch (error) {
        console.error("Error fetching receipts:", error);
        throw error;
    }
};
