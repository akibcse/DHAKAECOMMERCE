import { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, db } from "../firebase/firebase";
import { createAuditLog } from "../utils/dbServices";
import { requestNotificationPermission, removeTokenFromDatabase, onMessageListener } from "../utils/NotificationService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null); // Full profile from DB
    const [userRole, setUserRole] = useState(null); // 'user' or 'admin'
    const [loading, setLoading] = useState(true);

    // Signup
    const signup = async (email, password, name) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Realtime DB
        await set(ref(db, 'users/' + user.uid), {
            displayName: name,
            email: email,
            role: 'user', // Default role
            createdAt: new Date().toISOString()
        });

        await createAuditLog('USER_SIGNUP', { email, name }, 'user', user.uid);
        return user;
    };

    // Login
    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await createAuditLog('USER_LOGIN', { email }, 'user', userCredential.user.uid);
        return userCredential;
    };

    // Logout
    const logout = async () => {
        const user = auth.currentUser;
        if (user) {
            await removeTokenFromDatabase(user.uid);
            await createAuditLog('USER_LOGOUT', { email: user.email }, 'user', user.uid);
        }
        return signOut(auth);
    };

    // Fetch Full Profile
    const fetchUserData = async (uid) => {
        try {
            const snapshot = await get(ref(db, 'users/' + uid));
            if (snapshot.exists()) {
                const data = snapshot.val();
                setUserData(data);
                setUserRole(data.role || 'user');
            } else {
                setUserData(null);
                setUserRole('user');
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const refreshUserData = () => {
        if (currentUser) fetchUserData(currentUser.uid);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                await fetchUserData(user.uid);
                // Register for push notifications
                requestNotificationPermission(user.uid);

                // Listen for foreground notifications
                onMessageListener().then(payload => {
                    console.log("Foreground message received:", payload);
                }).catch(err => console.log('failed: ', err));
            } else {
                setUserData(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userData,
        userRole,
        signup,
        login,
        logout,
        refreshUserData,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
