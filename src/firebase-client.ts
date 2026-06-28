import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
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
    auth = getAuth(app);
    // Use long polling only in dev, preview containers or if inside an iframe.
    // On the custom top-level domain (cramupai.com), use standard connection options.
    const isInsideIframe = (() => {
      try {
        return typeof window !== "undefined" && window.self !== window.top;
      } catch (e) {
        return true;
      }
    })();

    // Always use long polling and memory cache to ensure maximum compatibility and reliability across
    // preview environments, iframes, Vercel deployments, and custom top-level domains.
    // Memory cache avoids security blocks on IndexedDB within cross-origin iframes.
    const dbSettings = {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: true
    };

    const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
      ? firebaseConfig.firestoreDatabaseId
      : undefined;

    db = databaseId 
      ? initializeFirestore(app, dbSettings, databaseId) 
      : initializeFirestore(app, dbSettings);
    storage = getStorage(app);
    console.log("Firebase initialized successfully with configuration credentials.");
  } catch (err) {
    console.error("Firebase connection initialization failed, falling back to clean local database sandbox.", err);
  }
} else {
  console.log("Firebase credentials not configured yet. StudyVibe AI will default to robust sandbox local persistence mode.");
}

export { auth, db, storage, isFirebaseConfigured, firebaseConfig as activeFirebaseConfig };

