importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDHl27DYGqiZsEiK2oBx1apZrAq37oDGEg",
    authDomain: "dhakaecommerce-86c3c.firebaseapp.com",
    projectId: "dhakaecommerce-86c3c",
    storageBucket: "dhakaecommerce-86c3c.firebasestorage.app",
    messagingSenderId: "483517679529",
    appId: "1:483517679529:web:554fe8b78ca66701e826b8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
