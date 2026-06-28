import { AppUser, Material, QuizRecord, Flashcard, ChatMessage, AccountTier, FileType, QuizQuestion } from "./types";
import { db, auth, isFirebaseConfigured } from "./firebase-client";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

// Helper to generate IDs
export const generateId = () => Math.random().toString(36).substring(2, 11);

// Storage key fallback constants
const USERS_KEY = "cramupai_users";
const CURRENT_USER_KEY = "cramupai_current_user";
const MATERIALS_KEY = "cramupai_materials";
const QUIZ_KEY = "cramupai_quiz_records";
const FLASHCARDS_KEY = "cramupai_flashcards";
const CHATS_KEY = "cramupai_chats";

// Initial Local Storage setup if empty
if (!localStorage.getItem(USERS_KEY)) {
  localStorage.setItem(USERS_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(MATERIALS_KEY)) {
  localStorage.setItem(MATERIALS_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(QUIZ_KEY)) {
  localStorage.setItem(QUIZ_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(FLASHCARDS_KEY)) {
  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(CHATS_KEY)) {
  localStorage.setItem(CHATS_KEY, JSON.stringify([]));
}

// Low-level LocalStorage database helper
const localDb = {
  getUsers: (): AppUser[] => JSON.parse(localStorage.getItem(USERS_KEY) || "[]"),
  saveUsers: (users: AppUser[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users)),
  
  getMaterials: (): Material[] => JSON.parse(localStorage.getItem(MATERIALS_KEY) || "[]"),
  saveMaterials: (mats: Material[]) => localStorage.setItem(MATERIALS_KEY, JSON.stringify(mats)),
  
  getQuizzes: (): QuizRecord[] => JSON.parse(localStorage.getItem(QUIZ_KEY) || "[]"),
  saveQuizzes: (quizzes: QuizRecord[]) => localStorage.setItem(QUIZ_KEY, JSON.stringify(quizzes)),
  
  getFlashcards: (): Flashcard[] => JSON.parse(localStorage.getItem(FLASHCARDS_KEY) || "[]"),
  saveFlashcards: (fc: Flashcard[]) => localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(fc)),
  
  getChats: (): ChatMessage[] => JSON.parse(localStorage.getItem(CHATS_KEY) || "[]"),
  saveChats: (msgs: ChatMessage[]) => localStorage.setItem(CHATS_KEY, JSON.stringify(msgs))
};

// --- Firebase Error Diagnostics (Firebase Integration Skill mandatory implementation) ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
// -----------------------------------------------------------------------------------------

// Main Unified Database Service
export const DBService = {
  // Authentication: Register
  async registerUser(email: string, name: string, subject: string, password?: string): Promise<AppUser> {
    if (isFirebaseConfigured && db && auth) {
      try {
        let uid = generateId();
        if (password) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            uid = userCredential.user.uid;
          } catch (authErr: any) {
            console.error("Firebase Auth registration failed or not configured", authErr);
            if (authErr.code === "auth/operation-not-allowed") {
              throw new Error("Email/Password provider is disabled in your Firebase Auth Console. Please enable Email/Password Sign-In under Auth > Tab 'Sign-in method', or use Google Sign-In.");
            } else {
              throw authErr;
            }
          }
        }

        const defaultUser: AppUser = {
          uid: uid,
          email: email.trim().toLowerCase(),
          account_tier: "Free",
          selected_subject: subject,
          monthly_uploads_used_counter: 0
        };

        // If real firebase auth resides, we write details to firestore 'users' collection with precise sub-try-catch
        try {
          await setDoc(doc(db, "users", uid), defaultUser);
        } catch (dbErr: any) {
          console.error("Firestore write failed during registration, using local fallback", dbErr);
          if (dbErr?.code === 'permission-denied' || dbErr?.message?.includes("insufficient permissions")) {
            handleFirestoreError(dbErr, OperationType.WRITE, `users/${uid}`);
          }
          // Fallback to caching in local storage
          const users = localDb.getUsers();
          const exists = users.find(u => u.email === defaultUser.email);
          if (!exists) {
            users.push(defaultUser);
            localDb.saveUsers(users);
          }
        }
        return defaultUser;
      } catch (err: any) {
        console.error("Firestore register, resorting to local storage", err);
        if (err && err.message && (err.message.includes("is disabled") || err.message.includes("Firestore Error"))) {
          throw err;
        }
        if (err && err.code && err.code.startsWith("auth/")) {
          throw err;
        }
      }
    }

    // Local Storage default action fallback
    const defaultUserLocal: AppUser = {
      uid: generateId(),
      email: email.trim().toLowerCase(),
      account_tier: "Free",
      selected_subject: subject,
      monthly_uploads_used_counter: 0
    };
    const users = localDb.getUsers();
    const exists = users.find(u => u.email === defaultUserLocal.email);
    if (exists) {
      return exists;
    }
    users.push(defaultUserLocal);
    localDb.saveUsers(users);
    return defaultUserLocal;
  },

  // Authentication: Fetch user profiling
  async loginUser(email: string, password?: string): Promise<AppUser | null> {
    const cleanedEmail = email.trim().toLowerCase();
    
    if (isFirebaseConfigured && db && auth) {
      try {
        let uid: string | null = null;
        if (password) {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, cleanedEmail, password);
            uid = userCredential.user.uid;
          } catch (authErr: any) {
            console.error("Firebase Auth login failed", authErr);
            if (authErr.code === "auth/operation-not-allowed") {
              throw new Error("Email/Password provider is disabled in your Firebase Auth Console. Please enable Email/Password Sign-In under Auth > Tab 'Sign-in method', or use Google Sign-In.");
            } else {
              throw authErr;
            }
          }
        }

        if (uid) {
          // Fetch exact user document by UID
          try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              return userDoc.data() as AppUser;
            }
          } catch (dbErr: any) {
            console.error("Firestore reading user document failed during login, falling back to basic local metadata profile", dbErr);
            if (dbErr?.code === 'permission-denied' || dbErr?.message?.includes("insufficient permissions")) {
              handleFirestoreError(dbErr, OperationType.GET, `users/${uid}`);
            }
          }
          // Safe return if authentication succeeded but Firestore had transient issues
          return {
            uid: uid,
            email: cleanedEmail,
            account_tier: "Free",
            selected_subject: "Biology",
            monthly_uploads_used_counter: 0
          };
        } else {
          // If no UID (e.g. auth disabled/not supported), fetch via query
          try {
            const q = query(collection(db, "users"), where("email", "==", cleanedEmail));
            const snap = await getDocs(q);
            if (!snap.empty) {
              return snap.docs[0].data() as AppUser;
            }
          } catch (dbErr: any) {
            console.error("Firestore query users collection failed during email lookup", dbErr);
            if (dbErr?.code === 'permission-denied' || dbErr?.message?.includes("insufficient permissions")) {
              handleFirestoreError(dbErr, OperationType.LIST, "users");
            }
          }
        }
      } catch (err: any) {
        console.error("Firestore/Auth login error", err);
        if (err && err.message && (err.message.includes("is disabled") || err.message.includes("Firestore Error"))) {
          throw err;
        }
        if (err && err.code && err.code.startsWith("auth/")) {
          throw err;
        }
      }
    }

    // Local Storage fallback
    const users = localDb.getUsers();
    const user = users.find(u => u.email === cleanedEmail);
    if (user) return user;

    // Auto-create a demo user if doesn't exist for effortless prototype flow in local storage
    return null;
  },

  // Authentication: Sign In with Google
  async loginWithGoogle(providedEmail?: string): Promise<AppUser | null> {
    if (isFirebaseConfigured && db && auth) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        
        // Signed in on Firebase, let's query/create the user document
        const userRef = doc(db, "users", firebaseUser.uid);
        
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            const actualEmail = firebaseUser.email || "";
            const isLegacyEmail = userData.email && (userData.email.toLowerCase() === "student@studyvibe.edu" || userData.email.toLowerCase().endsWith("@studyvibe.edu"));
            const isMismatch = actualEmail && userData.email && (userData.email.toLowerCase() !== actualEmail.toLowerCase());
            
            if (!userData.email || isLegacyEmail || isMismatch) {
              const updatedEmail = actualEmail || userData.email || `google-student-${generateId()}@cramupai.com`;
              try {
                await updateDoc(userRef, { email: updatedEmail });
                userData.email = updatedEmail;
                console.log("Successfully patched user document email in Firestore to match actual Google auth:", updatedEmail);
              } catch (updateErr) {
                console.error("Failed to patch user email in Firestore:", updateErr);
                userData.email = updatedEmail;
              }
            }
            return userData;
          } else {
            const defaultUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              account_tier: "Free",
              selected_subject: "Biology",
              monthly_uploads_used_counter: 0
            };
            await setDoc(userRef, defaultUser);
            return defaultUser;
          }
        } catch (dbErr: any) {
          console.error("Firestore querying/writing user document failed inside Google Login", dbErr);
          if (dbErr?.code === 'permission-denied' || dbErr?.message?.includes("insufficient permissions")) {
            handleFirestoreError(dbErr, OperationType.GET, `users/${firebaseUser.uid}`);
          }
          // Return default user locally since authentication succeeded perfectly
          return {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            account_tier: "Free",
            selected_subject: "Biology",
            monthly_uploads_used_counter: 0
          };
        }
      } catch (err: any) {
        console.warn("Google Auth popup failed or blocked by iframe environment.", err);
        // If we are on a production custom domain (e.g. cramupai.com), do NOT silently fallback to sandbox.
        // Rethrow the error so that the user is shown the exact actionable Firebase configuration error.
        const hostname = typeof window !== "undefined" && window.location ? window.location.hostname : "";
        const isCustomDomain = hostname === "cramupai.com" || (hostname && !hostname.includes("run.app") && !hostname.includes("localhost"));
        if (isCustomDomain) {
          throw err;
        }
        // Fall through to Sandbox Mode Fallback so the user has an effortless sign-in experience in the iframe preview
      }
    }
    
    // Sandbox Mode Fallback: allow logging in with different Google email addresses
    let email = (providedEmail && providedEmail.trim()) || "";
    // If the provided email is empty or matches the old leftover student address, clear it to prompt the user
    if (email.toLowerCase() === "student@studyvibe.edu" || email.toLowerCase().endsWith("@studyvibe.edu")) {
      email = "";
    }
    
    if (!email) {
      try {
        const enteredEmail = window.prompt("Enter your Google email address to continue (Sandbox Fallback):", "");
        if (enteredEmail && enteredEmail.trim()) {
          const lowerEmail = enteredEmail.trim().toLowerCase();
          if (lowerEmail === "student@studyvibe.edu" || lowerEmail.endsWith("@studyvibe.edu")) {
            email = `google-student-${generateId()}@cramupai.com`;
          } else {
            email = lowerEmail;
          }
        } else {
          // User cancelled the prompt or entered an empty email, abort login
          return null;
        }
      } catch (e) {
        console.warn("Could not prompt for email fallback", e);
        // Clean fallback to a unique generated email address to completely avoid static 'student@studyvibe.edu' collision
        email = `google-student-${generateId()}@cramupai.com`;
      }
    } else {
      email = email.toLowerCase();
    }

    const localUsers = localDb.getUsers();
    let existingUser = localUsers.find(u => u.email === email);
    if (!existingUser) {
      existingUser = {
        uid: generateId(),
        email: email,
        account_tier: "Free",
        selected_subject: "Biology",
        monthly_uploads_used_counter: 0
      };
      localUsers.push(existingUser);
      localDb.saveUsers(localUsers);
    }
    return existingUser;
  },

  // Update subscription or user profile subject
  async updateUserSubject(userId: string, subject: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { selected_subject: subject });
        return;
      } catch (err: any) {
        console.error("Firestore update subject error, using local fallback", err);
        try {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    // Local Storage fallback
    const users = localDb.getUsers();
    const index = users.findIndex(u => u.uid === userId);
    if (index !== -1) {
      users[index].selected_subject = subject;
      localDb.saveUsers(users);
    }
  },

  // Update user profile fields (display name, etc.)
  async updateUserProfile(userId: string, data: { display_name?: string; selected_subject?: string; auto_renew?: boolean; premium_purchased_at?: string; billing_period?: "monthly" | "annual"; paypal_email?: string }): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { ...data });
        return;
      } catch (err: any) {
        console.error("Firestore update profile error, using local fallback", err);
        try {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    // Local Storage fallback
    const users = localDb.getUsers();
    const index = users.findIndex(u => u.uid === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      localDb.saveUsers(users);
    }
  },

  // Upgrade user tier synchronously with webhooks
  async upgradeUserTier(userId: string, tier: AccountTier, keepPurchaseDate: boolean = false, billingPeriod?: "monthly" | "annual", paypalEmail?: string): Promise<AppUser | null> {
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, "users", userId);
        const updates: any = { account_tier: tier };
        
        if (billingPeriod) {
          updates.billing_period = billingPeriod;
        }

        if (paypalEmail) {
          updates.paypal_email = paypalEmail;
        }

        if (tier === "Premium") {
          updates.auto_renew = true;
          if (!keepPurchaseDate) {
            updates.premium_purchased_at = new Date().toISOString();
          } else {
            // Retrieve user profile to strictly verify date
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data() as AppUser;
              if (userData.premium_purchased_at) {
                const purchaseSecs = new Date(userData.premium_purchased_at).getTime();
                const daysElapsed = (Date.now() - purchaseSecs) / (1000 * 60 * 60 * 24);
                const planPeriod = userData.billing_period || "monthly";
                const limitDays = planPeriod === "annual" ? 365 : 30;
                if (daysElapsed > limitDays) {
                  throw new Error(`Reactivation period expired. ${Math.floor(daysElapsed)} days since purchase.`);
                }
              } else {
                throw new Error("No previous purchase date found to reactivate plan.");
              }
            } else {
              throw new Error("User document does not exist.");
            }
          }
        }
        await updateDoc(userRef, updates);
        const freshDoc = await getDoc(userRef);
        return freshDoc.exists() ? (freshDoc.data() as AppUser) : null;
      } catch (err: any) {
        console.error("Firestore upgrade error, using local fallback", err);
        try {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    // Local Storage fallback
    const users = localDb.getUsers();
    const index = users.findIndex(u => u.uid === userId);
    if (index !== -1) {
      const user = users[index];
      if (billingPeriod) {
        users[index].billing_period = billingPeriod;
      }

      if (paypalEmail) {
        users[index].paypal_email = paypalEmail;
      }

      if (tier === "Premium" && keepPurchaseDate) {
        if (user.premium_purchased_at) {
          const purchaseSecs = new Date(user.premium_purchased_at).getTime();
          const daysElapsed = (Date.now() - purchaseSecs) / (1000 * 60 * 60 * 24);
          const planPeriod = user.billing_period || "monthly";
          const limitDays = planPeriod === "annual" ? 365 : 30;
          if (daysElapsed > limitDays) {
            throw new Error(`Reactivation period expired. ${Math.floor(daysElapsed)} days since purchase.`);
          }
        } else {
          throw new Error("No previous purchase date found to reactivate plan.");
        }
      }

      users[index].account_tier = tier;
      if (tier === "Premium") {
        users[index].auto_renew = true;
        if (!keepPurchaseDate) {
          users[index].premium_purchased_at = new Date().toISOString();
        }
      }
      localDb.saveUsers(users);
      return users[index];
    }
    return null;
  },

  // Ingestion limit increments
  async incrementUploadCounter(userId: string): Promise<number> {
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as AppUser;
          const current = userData.monthly_uploads_used_counter || 0;
          await updateDoc(userRef, { monthly_uploads_used_counter: current + 1 });
          return current + 1;
        }
      } catch (err: any) {
        console.error("Firestore increment upload counter error, using local fallback", err);
        try {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    // Local Storage fallback
    const users = localDb.getUsers();
    const index = users.findIndex(u => u.uid === userId);
    if (index !== -1) {
      const current = users[index].monthly_uploads_used_counter || 0;
      users[index].monthly_uploads_used_counter = current + 1;
      localDb.saveUsers(users);
      return current + 1;
    }
    return 1;
  },

  // Save parsed material from Gemini API outputs
  async saveMaterial(
    userId: string,
    title: string,
    fileType: FileType,
    rawText: string,
    summaryMarkdown: string,
    language: string,
    subject?: string,
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    storagePath?: string
  ): Promise<Material> {
    const mat: Material = {
      id: generateId(),
      user_id: userId,
      title,
      subject,
      file_type: fileType,
      raw_extracted_text: rawText,
      structured_summary_markdown: summaryMarkdown,
      translation_language: language,
      generated_at: new Date().toISOString(),
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      storage_path: storagePath
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "materials", mat.id), mat);
        return mat;
      } catch (err: any) {
        console.error("Firestore save material failed, using local fallback", err);
        try {
          handleFirestoreError(err, OperationType.WRITE, `materials/${mat.id}`);
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    // Local Storage fallback
    const materials = localDb.getMaterials();
    materials.push(mat);
    localDb.saveMaterials(materials);
    return mat;
  },

  // Fetch Materials
  async getMaterials(userId: string): Promise<Material[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, "materials"), where("user_id", "==", userId));
        const snap = await getDocs(q);
        return snap.docs.map(doc => doc.data() as Material);
      } catch (err: any) {
        console.error("Firestore query materials error, using local fallback:", err);
        try {
          handleFirestoreError(err, OperationType.LIST, "materials");
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    return localDb.getMaterials().filter(m => m.user_id === userId);
  },

  // Delete Material
  async deleteMaterial(materialId: string): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "materials", materialId));
        return true;
      } catch (err: any) {
        console.error("Firestore delete material failed, using local fallback", err);
        try {
          handleFirestoreError(err, OperationType.DELETE, `materials/${materialId}`);
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
        return false;
      }
    }

    const materials = localDb.getMaterials();
    const filtered = materials.filter(m => m.id !== materialId);
    localDb.saveMaterials(filtered);
    return true;
  },

  // Save Quiz Record
  async saveQuizRecord(
    materialId: string,
    quizType: "MCQ" | "Fill-In-The-Blanks",
    questionCount: number,
    choicesPerQuestion: number,
    questionsList: QuizQuestion[]
  ): Promise<QuizRecord> {
    const quiz: QuizRecord = {
      id: generateId(),
      material_id: materialId,
      quiz_type: quizType,
      selected_question_count: questionCount,
      selected_choices_per_question: choicesPerQuestion,
      questions: questionsList
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "quiz_records", quiz.id), quiz);
        return quiz;
      } catch (err: any) {
        console.error("Firestore save quiz record error, using local fallback", err);
        try {
          handleFirestoreError(err, OperationType.WRITE, `quiz_records/${quiz.id}`);
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    const quizzes = localDb.getQuizzes();
    quizzes.push(quiz);
    localDb.saveQuizzes(quizzes);
    return quiz;
  },

  // Fetch Quiz Records
  async getQuizRecords(materialId: string): Promise<QuizRecord[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, "quiz_records"), where("material_id", "==", materialId));
        const snap = await getDocs(q);
        return snap.docs.map(doc => doc.data() as QuizRecord);
      } catch (err: any) {
        console.error("Firestore query quiz records error, using local fallback:", err);
        try {
          handleFirestoreError(err, OperationType.LIST, "quiz_records");
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    return localDb.getQuizzes().filter(q => q.material_id === materialId);
  },

  // Save Flashcards batch
  async saveFlashcardsBatch(materialId: string, cards: Omit<Flashcard, "id">[]): Promise<Flashcard[]> {
    const savedCards: Flashcard[] = cards.map(c => ({
      id: generateId(),
      material_id: materialId,
      question_front: c.question_front,
      answer_back: c.answer_back,
      is_custom: c.is_custom || false,
      color_theme: c.color_theme || "indigo"
    }));

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        for (const card of savedCards) {
          batch.set(doc(db, "flashcards", card.id), card);
        }
        await batch.commit();
        return savedCards;
      } catch (err: any) {
        console.error("Firestore save flashcards batch error, using local fallback", err);
        try {
          handleFirestoreError(err, OperationType.WRITE, "flashcards");
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    const flashcards = localDb.getFlashcards();
    flashcards.push(...savedCards);
    localDb.saveFlashcards(flashcards);
    return savedCards;
  },

  // Save a single custom flashcard
  async saveCustomFlashcard(materialId: string, question: string, answer: string, color: string): Promise<Flashcard> {
    const card: Flashcard = {
      id: generateId(),
      material_id: materialId,
      question_front: question,
      answer_back: answer,
      is_custom: true,
      color_theme: color
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "flashcards", card.id), card);
        return card;
      } catch (err: any) {
        console.error("Firestore save custom flashcard error, using local fallback", err);
        try {
          handleFirestoreError(err, OperationType.WRITE, "flashcards");
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    const flashcards = localDb.getFlashcards();
    flashcards.push(card);
    localDb.saveFlashcards(flashcards);
    return card;
  },

  // Delete all AI generated flashcards for a material
  async deleteAIFlashcards(materialId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, "flashcards"),
          where("material_id", "==", materialId)
        );
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        let hasOps = false;
        for (const d of snap.docs) {
          const data = d.data();
          if (!data.is_custom) {
            batch.delete(doc(db, "flashcards", d.id));
            hasOps = true;
          }
        }
        if (hasOps) {
          await batch.commit();
        }
      } catch (err: any) {
        console.error("Firestore delete AI flashcards error", err);
      }
    }

    const flashcards = localDb.getFlashcards();
    const updated = flashcards.filter(f => f.material_id !== materialId || f.is_custom);
    localDb.saveFlashcards(updated);
  },

  // Delete a specific flashcard
  async deleteFlashcard(cardId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "flashcards", cardId));
      } catch (err: any) {
        console.error("Firestore delete flashcard error", err);
      }
    }

    const flashcards = localDb.getFlashcards();
    const updated = flashcards.filter(f => f.id !== cardId);
    localDb.saveFlashcards(updated);
  },

  // Fetch Flashcards
  async getFlashcards(materialId: string): Promise<Flashcard[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, "flashcards"), where("material_id", "==", materialId));
        const snap = await getDocs(q);
        return snap.docs.map(doc => doc.data() as Flashcard);
      } catch (err: any) {
        console.error("Firestore query flashcards error, using local fallback:", err);
        try {
          handleFirestoreError(err, OperationType.LIST, "flashcards");
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    return localDb.getFlashcards().filter(f => f.material_id === materialId);
  },

  // Save Chat Message
  async saveChatMessage(materialId: string, sender: "User" | "AI", text: string): Promise<ChatMessage> {
    const msg: ChatMessage = {
      id: generateId(),
      material_id: materialId,
      message_sender: sender,
      text_payload: text,
      timestamp: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "chat_log", msg.id), msg);
        return msg;
      } catch (err: any) {
        console.error("Firestore save chat message error, using local fallback", err);
        try {
          handleFirestoreError(err, OperationType.WRITE, `chat_log/${msg.id}`);
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    const chats = localDb.getChats();
    chats.push(msg);
    localDb.saveChats(chats);
    return msg;
  },

  // Fetch Chat History
  async getChatHistory(materialId: string): Promise<ChatMessage[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, "chat_log"), where("material_id", "==", materialId));
        const snap = await getDocs(q);
        const msgs = snap.docs.map(doc => doc.data() as ChatMessage);
        return msgs.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      } catch (err: any) {
        console.error("Firestore query chat history error, using local fallback:", err);
        try {
          handleFirestoreError(err, OperationType.LIST, "chat_log");
        } catch (reportErr) {
          console.warn("Ignored Firestore report to use local cache", reportErr);
        }
      }
    }

    return localDb.getChats()
      .filter(c => c.material_id === materialId)
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
};
