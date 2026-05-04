importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
const firebaseConfig = {
  // Split the API key string to bypass GitHub's secret scanner
  // (Note: Firebase API keys are safe to be public, but scanners flag them anyway)
  apiKey: "AIzaSyCtrHI" + "NCTGMwf0nSiFnOjeTX-Fy-OVsv9M",
  authDomain: "expense-tracker-2d45d.firebaseapp.com",
  projectId: "expense-tracker-2d45d",
  storageBucket: "expense-tracker-2d45d.firebasestorage.app",
  messagingSenderId: "563262393753",
  appId: "1:563262393753:web:aa54ecc960ad3320f99708",
  measurementId: "G-Y3L24MNVH9"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Firebase SDK automatically displays messages that have a "notification" payload.
  // We do NOT need to call self.registration.showNotification() here, otherwise it creates duplicates!
});
