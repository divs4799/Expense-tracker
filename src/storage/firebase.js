import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// TODO: Replace the following with your app's Firebase project configuration
// You can find this in your Firebase Console: Project Settings > Your apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyCtrHINCTGMwf0nSiFnOjeTX-Fy-OVsv9M",
  authDomain: "expense-tracker-2d45d.firebaseapp.com",
  projectId: "expense-tracker-2d45d",
  storageBucket: "expense-tracker-2d45d.firebasestorage.app",
  messagingSenderId: "563262393753",
  appId: "1:563262393753:web:aa54ecc960ad3320f99708",
  measurementId: "G-Y3L24MNVH9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances for use in the app
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
