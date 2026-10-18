import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check required Firebase values
const hasFirebaseConfig =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.authDomain) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);

let app = null;
let auth = null;
let db = null;
let storage = null;

if (hasFirebaseConfig) {
  try {
    // Initialize Firebase app
    app = getApps().length > 0
      ? getApps()[0]
      : initializeApp(firebaseConfig);

    // Initialize Auth
    auth = getAuth(app);

    // Initialize Firestore
    db = getFirestore(app);

    console.log("✅ Firebase App initialized");
    console.log("✅ Firebase Auth initialized");
    console.log("✅ Firestore initialized");
    console.log("📁 Firebase Project:", firebaseConfig.projectId);

    // Storage is initialized separately.
    // If Storage has a problem, Firestore should still work.
    try {
      storage = getStorage(app);
      console.log("✅ Firebase Storage initialized");
    } catch (storageError) {
      console.warn(
        "⚠️ Firebase Storage initialization failed:",
        storageError
      );
      storage = null;
    }

  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
} else {
  console.error("❌ Firebase configuration is missing.");
  console.log("Check your .env file.");
}

export const isFirebaseConfigured =
  Boolean(app && auth && db);

export {
  app,
  auth,
  db,
  storage,
};