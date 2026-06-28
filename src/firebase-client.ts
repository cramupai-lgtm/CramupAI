import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfigJson from "./firebase-applet-config.json";

// Allow overriding via environment variables for custom deployments (like Vercel with your own domain)
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId,
};

const isFirebaseConfigured = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "");

let app;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // 1. Initialize Auth
    try {
      auth = getAuth(app);
    } catch (authErr) {
      console.error("Firebase Auth initialization failed:", authErr);
    }

    // 2. Initialize Firestore
    try {
      const dbSettings = {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true
      };

      const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
        ? firebaseConfig.firestoreDatabaseId
        : undefined;

      try {
        db = databaseId 
          ? initializeFirestore(app, dbSettings, databaseId) 
          : initializeFirestore(app, dbSettings);
      } catch (dbInitErr: any) {
        console.warn("initializeFirestore failed or already initialized, retrieving existing Firestore instance.", dbInitErr);
        db = getFirestore(app);
      }
    } catch (dbErr) {
      console.error("Firebase Firestore setup failed completely:", dbErr);
    }

    // 3. Initialize Storage
    try {
      storage = getStorage(app);
    } catch (storageErr) {
      console.error("Firebase Storage setup failed:", storageErr);
    }

    console.log("Firebase initialized successfully with robust configuration credentials.");
  } catch (err) {
    console.error("Firebase connection initialization failed, falling back to clean local database sandbox.", err);
  }
} else {
  console.log("Firebase credentials not configured yet. Cramup.AI will default to robust sandbox local persistence mode.");
}

export { auth, db, storage, isFirebaseConfigured, firebaseConfig as activeFirebaseConfig };

