import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC3M3pNbVqyHQuJCiUU3J4SjKQ-lhgbLLM",
  authDomain: "trainerfirm-49407.firebaseapp.com",
  projectId: "trainerfirm-49407",
  storageBucket: "trainerfirm-49407.firebasestorage.app",
  messagingSenderId: "1034726705873",
  appId: "1:1034726705873:web:e7bbdc416b015a86c853f0"
};

let app;
let auth;

try {
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export { auth };
