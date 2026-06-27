import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const isFirebaseConfigured = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "");

let app;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false
    }, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized successfully with configuration credentials.");
  } catch (err) {
    console.error("Firebase connection initialization failed, falling back to clean local database sandbox.", err);
  }
} else {
  console.log("Firebase credentials not configured yet. StudyVibe AI will default to robust sandbox local persistence mode.");
}

export { auth, db, isFirebaseConfigured };
