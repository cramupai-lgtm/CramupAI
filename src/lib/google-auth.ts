import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase-client";

// In-memory cache for the Google access token
let googleAccessToken: string | null = null;

export function getGoogleAccessToken(): string | null {
  return googleAccessToken;
}

export function setGoogleAccessToken(token: string | null) {
  googleAccessToken = token;
}

// Clear token on sign out
if (isFirebaseConfigured && auth) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      googleAccessToken = null;
    }
  });
}

/**
 * Initiates the Google authentication popup requesting Google Forms & Drive permissions,
 * and caches the resulting access token in memory.
 */
export async function authenticateGoogleForms(): Promise<string> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase Authentication is not configured or active.");
  }

  const provider = new GoogleAuthProvider();
  // Scopes requested for creating and managing Forms, and saving them to Google Drive
  provider.addScope("https://www.googleapis.com/auth/forms.body");
  provider.addScope("https://www.googleapis.com/auth/drive.file");

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error("Failed to extract Google Access Token from authentication result.");
    }

    googleAccessToken = token;
    return token;
  } catch (error: any) {
    console.error("Error authenticating with Google Forms:", error);
    throw error;
  }
}
