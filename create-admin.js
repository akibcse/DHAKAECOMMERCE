import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";

// Copying config directly to avoid import issues with relative paths or environment differences if not careful
const firebaseConfig = {
    apiKey: "AIzaSyDHl27DYGqiZsEiK2oBx1apZrAq37oDGEg",
    authDomain: "dhakaecommerce-86c3c.firebaseapp.com",
    projectId: "dhakaecommerce-86c3c",
    storageBucket: "dhakaecommerce-86c3c.firebasestorage.app",
    messagingSenderId: "483517679529",
    appId: "1:483517679529:web:554fe8b78ca66701e826b8",
    measurementId: "G-TEDN1EGC58"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const email = "roadyakib@gmail.com";
const password = "jd750c";

const createAdmin = async () => {
    console.log(`Attempting to set up admin user: ${email}`);
    let user;

    try {
        // Try to create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        console.log("User created successfully.");
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("User already exists. Logging in...");
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
                console.log("Logged in successfully.");
            } catch (loginError) {
                console.error("Login failed:", loginError.message);
                process.exit(1);
            }
        } else {
            console.error("Error creating user:", error.message);
            process.exit(1);
        }
    }

    if (user) {
        try {
            console.log(`Setting admin role for UID: ${user.uid}`);
            await set(ref(db, 'users/' + user.uid), {
                email: email,
                name: "Admin User",
                role: "admin",
                createdAt: new Date().toISOString()
            });
            console.log("SUCCESS: User is now an Admin.");
        } catch (dbError) {
            console.error("Database error:", dbError.message);
        }
    }

    // Force exit because Firebase keeps connection open
    process.exit(0);
};

createAdmin();
