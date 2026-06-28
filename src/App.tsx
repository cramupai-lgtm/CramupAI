import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import LandingPage from "./components/LandingPage";
import AuthScreen from "./components/AuthScreen";
import BottomNav from "./components/BottomNav";
import WorkspaceHub from "./components/WorkspaceHub";
import Dashboard from "./components/Dashboard";
import SubscriptionPage from "./components/SubscriptionPage";
import SettingsPage from "./components/SettingsPage";
import LegalHubPage from "./components/LegalHubPage";
import { AppUser, Material, ALL_SUBJECTS } from "./types";
import { DBService, handleFirestoreError, OperationType } from "./store";
import { 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  ShieldAlert, 
  LogOut, 
  Layers, 
  Award, 
  MessageSquare, 
  Upload as UploadIcon,
  Crown,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  Trash2,
  Link as LinkIcon,
  FileText,
  Play as PlayIcon,
  Volume2,
  Image as ImageIcon,
  User,
  Mail,
  Save,
  Settings,
  ExternalLink
} from "lucide-react";
import { auth, db, isFirebaseConfigured, activeFirebaseConfig } from "./firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [materialsList, setMaterialsList] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Navigation: primary tab selection
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  // Sub-Navigation within Library: summary, quiz, flashcards, chatbot
  const [activeSubTab, setActiveSubTab] = useState<string>("summary");
  
  // Theme state: dark mode default, matches light theme switch
  const [isLightMode, setIsLightMode] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [showCustomSubjectModal, setShowCustomSubjectModal] = useState<boolean>(false);
  const [customSubjectInput, setCustomSubjectInput] = useState<string>("");
  const [deleteConfirmMaterialId, setDeleteConfirmMaterialId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const clearDbAndReload = () => {
    if (typeof window !== "undefined") {
      try {
        // Delete standard Firestore IndexedDB database clients to force complete clean sync rebuild
        window.indexedDB.deleteDatabase("firestore/[DEFAULT]/cramupai-b7bd8/main");
        window.indexedDB.deleteDatabase("firestore/[DEFAULT]/cramupai-b7bd8");
      } catch (e) {
        console.error("IndexedDB wipe failed:", e);
      }
      localStorage.removeItem("studyvibe_current_user");
      window.location.reload();
    }
  };

  // Landing Page toggle states
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [isRegisteringFromLanding, setIsRegisteringFromLanding] = useState<boolean>(false);

  // Firebase Diagnostics Console logging
  useEffect(() => {
    console.log("%c[Firebase Diagnostics] Current Active Configuration in Applet:", "color: #4f46e5; font-weight: bold; font-size: 13px;", {
      projectId: activeFirebaseConfig?.projectId,
      authDomain: activeFirebaseConfig?.authDomain,
      storageBucket: activeFirebaseConfig?.storageBucket,
      messagingSenderId: activeFirebaseConfig?.messagingSenderId,
      appId: activeFirebaseConfig?.appId,
      isFirebaseConfigured: isFirebaseConfigured,
      dbInitialized: !!db,
      authInitialized: !!auth
    });
    console.log("%c[Firebase Hint] If Project ID doesn't match your new project, please update your Vercel Environment Variables!", "color: #f59e0b; font-weight: bold;");
  }, []);

  // Load cached user session or synchronize Firebase session on mount
  useEffect(() => {
    if (isFirebaseConfigured && auth && db) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            let userDoc = null;
            try {
              userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            } catch (dbErr: any) {
              console.error("Failed to fetch user document inside App mount listener, using fallback", dbErr);
              setDbError(dbErr?.message || String(dbErr));
              const cachedStr = localStorage.getItem("studyvibe_current_user");
              if (cachedStr) {
                try {
                  const cachedUser = JSON.parse(cachedStr) as AppUser;
                  if (cachedUser && cachedUser.uid === firebaseUser.uid) {
                    console.log("Offline fallback: Restored user profile from cache", cachedUser);
                    setCurrentUser(cachedUser);
                    loadUserMaterials(cachedUser.uid);
                    setAuthInitialized(true);
                    return;
                  }
                } catch (parseErr) {
                  console.error("Parse cached user failed", parseErr);
                }
              }
              try {
                handleFirestoreError(dbErr, OperationType.GET, `users/${firebaseUser.uid}`);
              } catch (reportErr) {
                console.warn("Using offline fallback default user profile", reportErr);
                const offlineUser: AppUser = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  account_tier: "Free",
                  selected_subject: "Biology",
                  monthly_uploads_used_counter: 0
                };
                setCurrentUser(offlineUser);
                loadUserMaterials(firebaseUser.uid);
                setAuthInitialized(true);
                return;
              }
            }

            if (userDoc && userDoc.exists()) {
              const u = userDoc.data() as AppUser;
              setCurrentUser(u);
              localStorage.setItem("studyvibe_current_user", JSON.stringify(u));
              loadUserMaterials(u.uid);
            } else {
              const defaultUser: AppUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                account_tier: "Free",
                selected_subject: "Biology",
                monthly_uploads_used_counter: 0
              };
              try {
                await setDoc(doc(db, "users", firebaseUser.uid), defaultUser);
              } catch (dbErr: any) {
                console.error("Failed to write default user document to Firestore inside App mount listener", dbErr);
                setDbError(dbErr?.message || String(dbErr));
                try {
                  handleFirestoreError(dbErr, OperationType.WRITE, `users/${firebaseUser.uid}`);
                } catch (reportErr) {
                  console.warn("Ignored default user setDoc Firestore write error to continue with local mode", reportErr);
                }
              }
              setCurrentUser(defaultUser);
              localStorage.setItem("studyvibe_current_user", JSON.stringify(defaultUser));
              loadUserMaterials(firebaseUser.uid);
            }
          } else {
            const cached = localStorage.getItem("studyvibe_current_user");
            if (cached) {
              const user = JSON.parse(cached) as AppUser;
              setCurrentUser(user);
              loadUserMaterials(user.uid);
            } else {
              setCurrentUser(null);
            }
          }
        } catch (err) {
          console.error("Failed to restore Firebase Auth state coordinates", err);
          const cached = localStorage.getItem("studyvibe_current_user");
          if (cached) {
            try {
              const user = JSON.parse(cached) as AppUser;
              setCurrentUser(user);
              loadUserMaterials(user.uid);
            } catch (e) {
              console.error(e);
            }
          }
        } finally {
          setAuthInitialized(true);
        }
      });
      return () => unsubscribe();
    } else {
      const cached = localStorage.getItem("studyvibe_current_user");
      if (cached) {
        try {
          const user = JSON.parse(cached) as AppUser;
          setCurrentUser(user);
          loadUserMaterials(user.uid);
        } catch (err) {
          console.error("Failed to parse cached session coordinates", err);
        }
      }
      setAuthInitialized(true);
    }
  }, []);

  // Automatic Re-billing / Deactivation Engine (sensitive off-cycles, monthly versus annual)
  useEffect(() => {
    if (!currentUser || currentUser.account_tier !== "Premium" || !currentUser.premium_purchased_at) {
      return;
    }

    const checkRenewal = async () => {
      const now = Date.now();
      const purchaseTime = new Date(currentUser.premium_purchased_at!).getTime();
      const diffDays = (now - purchaseTime) / (1000 * 60 * 60 * 24);
      const cycleDays = currentUser.billing_period === "annual" ? 365 : 30;

      if (diffDays > cycleDays) {
        // Exceeded the cycle period limit
        if (currentUser.auto_renew !== false) {
          // AUTO-RENEW: Bill user over and over again!
          const newPurchaseDate = new Date().toISOString();
          console.log(`[Billing Engine]: Auto-renewal processed. Extended ${currentUser.billing_period} subscription for user: ${currentUser.uid}`);
          
          try {
            await DBService.updateUserProfile(currentUser.uid, {
              premium_purchased_at: newPurchaseDate,
              auto_renew: true
            });
            const updated: AppUser = {
              ...currentUser,
              premium_purchased_at: newPurchaseDate,
              auto_renew: true
            };
            setCurrentUser(updated);
            localStorage.setItem("studyvibe_current_user", JSON.stringify(updated));
          } catch (err) {
            console.error("Auto renewal synchronization failed:", err);
          }
        } else {
          // USER CANCELED THE PLAN: Deactivate access since billing period has elapsed completely
          console.log(`[Billing Engine]: Canceled subscription expired. Setting user ${currentUser.uid} tier to Free.`);
          try {
            await DBService.upgradeUserTier(currentUser.uid, "Free");
            const updated: AppUser = {
              ...currentUser,
              account_tier: "Free" as const,
              auto_renew: false
            };
            setCurrentUser(updated);
            localStorage.setItem("studyvibe_current_user", JSON.stringify(updated));
          } catch (err) {
            console.error("Subscription deactivation update failed:", err);
          }
        }
      }
    };

    checkRenewal();
  }, [currentUser]);

  const loadUserMaterials = async (userId: string) => {
    try {
      const mats = await DBService.getMaterials(userId);
      setMaterialsList(mats);
      if (mats.length > 0) {
        const sorted = [...mats].sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
        setSelectedMaterial(sorted[0]);
      }
    } catch (err) {
      console.error("Failed to load user study materials:", err);
    }
  };

  const handleDeleteMaterialClick = (e: React.MouseEvent, materialId: string) => {
    e.stopPropagation();
    setDeleteConfirmMaterialId(materialId);
  };

  const handleConfirmDeleteMaterial = async () => {
    if (!deleteConfirmMaterialId) return;
    const materialId = deleteConfirmMaterialId;
    try {
      const success = await DBService.deleteMaterial(materialId);
      if (success) {
        const updated = materialsList.filter(m => m.id !== materialId);
        setMaterialsList(updated);
        if (selectedMaterial?.id === materialId) {
          setSelectedMaterial(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete study material:", err);
    } finally {
      setDeleteConfirmMaterialId(null);
    }
  };

  const handleAuthSuccess = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem("studyvibe_current_user", JSON.stringify(user));
    loadUserMaterials(user.uid);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMaterialsList([]);
    setSelectedMaterial(null);
    localStorage.removeItem("studyvibe_current_user");
    setShowLanding(true);
    setIsRegisteringFromLanding(false);
  };

  const handleSubjectChange = async (newSubject: string) => {
    if (!currentUser) return;
    if (newSubject === "Custom") {
      setCustomSubjectInput(ALL_SUBJECTS.includes(currentUser.selected_subject) ? "" : currentUser.selected_subject);
      setShowCustomSubjectModal(true);
      return;
    }
    try {
      await DBService.updateUserSubject(currentUser.uid, newSubject);
      const updatedUser = { ...currentUser, selected_subject: newSubject };
      setCurrentUser(updatedUser);
      localStorage.setItem("studyvibe_current_user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Failed to update user subject selection:", err);
    }
  };

  const handleSaveCustomSubject = async () => {
    if (!currentUser) return;
    const finalSubject = customSubjectInput.trim() || "General Study";
    try {
      await DBService.updateUserSubject(currentUser.uid, finalSubject);
      const updatedUser = { ...currentUser, selected_subject: finalSubject };
      setCurrentUser(updatedUser);
      localStorage.setItem("studyvibe_current_user", JSON.stringify(updatedUser));
      setShowCustomSubjectModal(false);
    } catch (err) {
      console.error("Failed to save custom user subject selection:", err);
    }
  };

  const handleUpgradeSuccess = (updatedUser: AppUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem("studyvibe_current_user", JSON.stringify(updatedUser));
    setActiveTab("dashboard");
  };

  const handleProfileUpdate = (updatedUser: AppUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem("studyvibe_current_user", JSON.stringify(updatedUser));
  };

  const handleProcessingSuccess = (material: Material, questions: any[], flashcards: any[]) => {
    setMaterialsList(prev => [material, ...prev]);
    setSelectedMaterial(material);
    setActiveTab("library");
    setActiveSubTab("summary");
  };

  const handleUploadCountIncrement = (newCount: number) => {
    if (!currentUser) return;
    const updated = { ...currentUser, monthly_uploads_used_counter: newCount };
    setCurrentUser(updated);
    localStorage.setItem("studyvibe_current_user", JSON.stringify(updated));
  };

  const handleToggleTheme = () => {
    setIsLightMode(!isLightMode);
  };

  const handleTabChange = (tab: string) => {
    if (tab === "library") {
      setSelectedMaterial(null);
    }
    setActiveTab(tab);
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-zinc-100">
        <span className="w-6 h-6 border-2 border-purple-500/20 border-t-[#a855f7] rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    if (showLanding) {
      return (
        <LandingPage 
          onGetStarted={(isRegistering) => {
            setIsRegisteringFromLanding(isRegistering);
            setShowLanding(false);
          }} 
          isLightMode={isLightMode} 
          onToggleTheme={handleToggleTheme} 
        />
      );
    }
    return (
      <AuthScreen 
        onAuthSuccess={handleAuthSuccess} 
        isInitiallyRegistering={isRegisteringFromLanding}
        onBackToLanding={() => setShowLanding(true)}
      />
    );
  }

  // Calculate quota status precisely matching user's visual spec
  const maxQuota = 3;
  const uploadsUsed = currentUser.monthly_uploads_used_counter || 0;
  const uploadsLeft = Math.max(0, maxQuota - uploadsUsed);

  const isCramupEmail = currentUser.email.toLowerCase().includes("cramup") || currentUser.email.toLowerCase() === "cramup.ai@gmail.com";
  const displayGreetingName = isCramupEmail ? "Vihandu" : currentUser.email.split("@")[0].charAt(0).toUpperCase() + currentUser.email.split("@")[0].slice(1);

  return (
    <div className={`flex min-h-screen font-sans antialiased relative overflow-x-hidden transition-all duration-300 ${
      isLightMode ? "bg-zinc-100 text-zinc-900" : "bg-[#050505] text-slate-100"
    }`} id="app-viewport">
      
      {/* Dynamic Background Mesh Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {isLightMode ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-purple-200/20 rounded-full blur-[140px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-100/30 rounded-full blur-[140px]"></div>
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-950/25 rounded-full blur-[140px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-950/20 rounded-full blur-[140px]"></div>
          </>
        )}
      </div>

      {/* Upgraded Brand Sidebar navigation matching Vihandu's exact style */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        currentUser={currentUser}
        onLogout={handleLogout}
        isLightMode={isLightMode}
        onToggleTheme={handleToggleTheme}
        materialsCount={materialsList.length}
      />

      {/* Main Core View Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen pb-20 md:pb-6 relative z-10" id="main-scroll-view">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.03),transparent_45%)] pointer-events-none" />
        
        {/* Interactive Header Bar */}
        <header className={`border-b py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl ${
          isLightMode ? "bg-white/70 border-zinc-200" : "bg-black/30 border-white/5"
        }`} id="app-header">
          
          <div className="md:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#8b5cf6] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <span className={`text-md font-extrabold tracking-tight font-display bg-gradient-to-r from-indigo-200 via-purple-300 to-pink-300 bg-clip-text text-transparent`}>Cramup.AI</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className={`text-[10px] font-mono tracking-widest uppercase ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>
              Active Subject Context:
            </span>
            <span className={`transition-all border text-[10px] font-mono px-3 py-1 rounded-full font-semibold ${
              isLightMode 
                ? "bg-purple-100 border-purple-200 text-purple-700" 
                : "bg-white/5 border-white/10 text-[#c084fc]"
            }`}>
              🎓 {currentUser.selected_subject}
            </span>
            
            {/* Subject Selector dropdown */}
            <select
              id="header-subject-select"
              value={ALL_SUBJECTS.includes(currentUser.selected_subject) ? currentUser.selected_subject : "Custom"}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className={`text-[9px] font-mono px-2 py-0.5 rounded focus:outline-none transition-colors border cursor-pointer ${
                isLightMode 
                  ? "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100" 
                  : "bg-zinc-900 border-white/5 text-zinc-300 hover:bg-zinc-850"
              }`}
            >
              {ALL_SUBJECTS.map(subj => (
                <option key={subj} value={subj} className="bg-zinc-950 text-slate-200 font-mono">{subj}</option>
              ))}
              {!ALL_SUBJECTS.includes(currentUser.selected_subject) ? (
                <option value="Custom" className="bg-zinc-950 text-indigo-400 font-bold">
                  🔮 {currentUser.selected_subject} (Custom)
                </option>
              ) : (
                <option value="Custom" className="bg-zinc-950 text-indigo-400 font-bold">
                  🔮 Create Custom...
                </option>
              )}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {currentUser.account_tier === "Free" ? (
              <button
                id="header-upgrade-btn"
                type="button"
                onClick={() => setActiveTab("plans")}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-mono text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full transition-all border border-white/10 shadow-lg shadow-purple-500/15 active:scale-95 cursor-pointer"
              >
                Go Premium
              </button>
            ) : (
              <span className={`border text-[10px] font-mono px-3.5 py-1.5 rounded-full uppercase tracking-widest font-semibold ${
                isLightMode 
                  ? "bg-amber-100 border-amber-200 text-amber-800" 
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}>
                💎 Premium Active
              </span>
            )}

            <button
              id="header-logout-btn"
              type="button"
              onClick={handleLogout}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isLightMode 
                  ? "bg-zinc-100 border-zinc-200 hover:text-red-650 hover:bg-zinc-200" 
                  : "bg-white/5 border-white/10 hover:text-red-400 hover:bg-white/10"
              }`}
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Core application body container */}
        <div className="p-5 md:p-8 space-y-7 max-w-5xl mx-auto w-full flex-1" id="workspace-view">
          
          {/* Firestore Connection Troubleshooting Notice */}
          {dbError && (
            <div 
              className={`p-5 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 relative z-55 ${
                isLightMode 
                  ? "bg-amber-50/90 border-amber-200 text-amber-900 shadow-md" 
                  : "bg-amber-950/20 border-amber-800/20 text-amber-100 shadow-xl"
              }`}
              id="firestore-troubleshoot-banner"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-amber-650 dark:text-amber-400">
                    Firebase Live Sync Pending
                  </span>
                </div>
                <h4 className="text-sm font-bold tracking-tight">
                  Stale Connection Cached
                </h4>
                <p className="text-[11px] opacity-85 max-w-xl">
                  Since you recently created your Cloud Firestore database, your web browser's local connection caches may need to be cleared to link up. Click the repair button to clear the cached state and refresh.
                </p>
                {dbError && (
                  <p className="text-[10px] font-mono opacity-60 bg-black/10 px-2 py-1 rounded mt-1 overflow-x-auto whitespace-pre-wrap max-h-16">
                    Diagnostic Code: {dbError}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                <button
                  onClick={clearDbAndReload}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-full transition-all border border-amber-500/20 shadow-md active:scale-95 cursor-pointer"
                >
                  Clear Cache & Repair
                </button>
                <button
                  onClick={() => setDbError(null)}
                  className="px-3 py-2 rounded-full hover:bg-amber-500/10 text-[10px] font-mono cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* TAB 1: EXECUTIVE GREETING DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-6"
                id="dashboard-tab"
              >
              
              {/* Profile Welcome Title card */}
              <div className="space-y-1.5" id="dashboard-hero-title">
                <div className="flex items-center gap-2 text-[#a855f7]">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest">Cramup.AI Workspace</span>
                </div>
                <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight select-none font-display ${isLightMode ? "text-zinc-950" : "text-white"}`}>
                  Welcome back, <span className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 bg-clip-text text-transparent dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300">{displayGreetingName}</span>
                </h1>
                <p className={`text-xs font-semibold font-sans ${isLightMode ? "text-zinc-650" : "text-zinc-400"}`}>
                  Studying {currentUser.selected_subject} · {currentUser.account_tier === "Premium" ? "Unlimited uploads active" : `${uploadsLeft} free uploads left this month`}
                </p>
              </div>

              {/* Bento Grid layout with exact visual dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="bento-actions-grid">
                
                {/* CARD 1: Upload Material */}
                <div 
                  className={`rounded-3xl p-6 border relative overflow-hidden transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-sm group ${
                    isLightMode 
                      ? "bg-white border-zinc-200 hover:border-[#a855f7]/40 text-zinc-900" 
                      : "bg-[#09090b]/80 border-white/5 hover:border-[#a855f7]/30 text-white"
                  }`}
                  onClick={() => setActiveTab("upload")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-[#a855f7] flex items-center justify-center transition-all group-hover:scale-105">
                      <UploadIcon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold tracking-tight transition-colors group-hover:text-[#a855f7] ${isLightMode ? "text-zinc-900" : "text-white"}`}>Upload Material</h4>
                      <p className={`text-[11px] mt-1 ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>PDF, Video, Audio & more</p>
                    </div>
                  </div>
                </div>

                {/* CARD 2: My Library */}
                <div 
                  className={`rounded-3xl p-6 border relative overflow-hidden transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-sm group ${
                    isLightMode 
                      ? "bg-white border-zinc-200 hover:border-blue-500/40 text-zinc-900" 
                      : "bg-[#09090b]/80 border-white/5 hover:border-blue-500/30 text-white"
                  }`}
                  onClick={() => setActiveTab("library")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center transition-all group-hover:scale-105">
                      <BookOpen className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold tracking-tight transition-colors group-hover:text-blue-500 ${isLightMode ? "text-zinc-900" : "text-white"}`}>My Library</h4>
                      <p className={`text-[11px] mt-1 ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>{materialsList.length} materials</p>
                    </div>
                  </div>
                </div>

                {/* CARD 3: Take a Quiz */}
                <div 
                  className={`rounded-3xl p-6 border relative overflow-hidden transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-sm group ${
                    isLightMode 
                      ? "bg-white border-zinc-200 hover:border-emerald-500/40 text-zinc-900" 
                      : "bg-[#09090b]/80 border-white/5 hover:border-emerald-500/30 text-white"
                  }`}
                  onClick={() => {
                    setActiveTab("library");
                    setActiveSubTab("quiz");
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center transition-all group-hover:scale-105">
                      <Award className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold tracking-tight transition-colors group-hover:text-emerald-500 ${isLightMode ? "text-zinc-900" : "text-white"}`}>Take a Quiz</h4>
                      <p className={`text-[11px] mt-1 ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>Test your knowledge</p>
                    </div>
                  </div>
                </div>

                {/* CARD 4: Go Premium */}
                <div 
                  className={`rounded-3xl p-6 border relative overflow-hidden transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-sm group ${
                    isLightMode 
                      ? "bg-white border-zinc-200 hover:border-amber-500/40 text-zinc-900" 
                      : "bg-[#09090b]/80 border-white/5 hover:border-amber-500/30 text-white"
                  }`}
                  onClick={() => setActiveTab("plans")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center transition-all group-hover:scale-105">
                      <Crown className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold tracking-tight transition-colors group-hover:text-amber-500 ${isLightMode ? "text-zinc-900" : "text-white"}`}>Go Premium</h4>
                      <p className={`text-[11px] mt-1 ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>$14.99/month</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Monthly Usage Track Area */}
              <div className={`p-6 rounded-3xl border transition-all ${
                isLightMode 
                  ? "bg-white border-zinc-200 shadow" 
                  : "bg-[#09090b]/80 border-white/5"
              }`} id="monthly-tracker-box">
                <div className="flex items-center justify-between pb-3.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4.5 h-4.5 text-[#a855f7]" />
                    <span className={`text-xs font-bold tracking-wide ${isLightMode ? "text-zinc-800" : "text-white"}`}>Monthly Usage</span>
                  </div>
                  <span className={`text-xs font-semibold font-sans ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>
                    {currentUser.account_tier === "Premium" ? (
                      `${uploadsUsed} ${uploadsUsed === 1 ? "upload" : "uploads"} made`
                    ) : (
                      `${uploadsUsed}/${maxQuota} uploads used`
                    )}
                  </span>
                </div>
                
                {/* Progress bar scale container */}
                {currentUser.account_tier !== "Premium" && (
                  <div className={`h-2 w-full rounded-full overflow-hidden border relative ${isLightMode ? "bg-zinc-200 border-zinc-300" : "bg-zinc-800/60 border-white/[0.03]"}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-[#a855f7] rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (uploadsUsed / maxQuota) * 100)}%` }} 
                    />
                  </div>
                )}
              </div>

              {/* Bottom Catalog elements / list */}
              <div className="space-y-4 pt-4" id="dashboard-materials-catalog">
                {materialsList.length === 0 ? (
                  /* Center aligned Empty State precisely from Vihandu's layout space */
                  <div className={`flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed rounded-3xl ${isLightMode ? "border-zinc-300 bg-white" : "border-[#ffffff0a] bg-zinc-950/20"}`} id="no-materials-dashboard">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border ${isLightMode ? "bg-purple-100 border-purple-200 text-purple-600" : "bg-[#1b1528] border-purple-500/10 text-[#c084fc]"}`}>
                      <BookOpen className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <h3 className={`text-md font-bold ${isLightMode ? "text-zinc-900" : "text-white"}`}>No materials yet</h3>
                    <p className={`text-xs mt-1.5 max-w-sm leading-relaxed ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>
                      Upload your first study material to get started
                    </p>
                    <button
                      id="dashboard-upload-button-empty"
                      type="button"
                      onClick={() => setActiveTab("upload")}
                      className="mt-6 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-mono uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-500/15 flex items-center gap-2 cursor-pointer"
                    >
                      <UploadIcon className="w-3.5 h-3.5" />
                      Upload Material
                    </button>
                  </div>
                ) : (
                  /* Elegant horizontal or catalog list of current compiled documents */
                  <div className="space-y-3.5" id="processed-library-dashboard">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? "text-zinc-650" : "text-zinc-400"}`}>Recently Compiled Study Decks</h3>
                      <button 
                        type="button" 
                        onClick={() => setActiveTab("library")} 
                        className="text-xs font-mono text-[#a855f7] hover:underline"
                      >
                        Open Full Library
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5" id="dashboard-recent-grid">
                      {materialsList.slice(0, 3).map((item) => (
                        <div 
                          key={item.id}
                          className={`p-4 rounded-2xl border flex items-center justify-between group transition-all cursor-pointer duration-200 ${
                            selectedMaterial?.id === item.id 
                              ? (isLightMode ? "bg-purple-50 border-purple-300" : "bg-purple-950/10 border-purple-500/30") 
                              : (isLightMode ? "bg-white border-zinc-200 hover:border-zinc-350" : "bg-[#09090b]/40 border-white/5 hover:border-zinc-800")
                          }`}
                          onClick={() => {
                            setSelectedMaterial(item);
                            setActiveTab("library");
                            setActiveSubTab("summary");
                          }}
                        >
                          <div className="flex items-center gap-3.5 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4.5 h-4.5" />
                            </div>
                            <div className="overflow-hidden">
                              <span className={`block text-xs font-semibold group-hover:text-purple-500 transition-colors truncate ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                                {item.title}
                              </span>
                              <span className={`block text-[10px] mt-1 uppercase font-mono ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
                                Medium: {item.file_type} · {new Date(item.generated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[9px] font-mono border px-2 py-0.5 rounded-full ${isLightMode ? "bg-zinc-100 border-zinc-200 text-zinc-650" : "bg-white/5 border-white/5 text-zinc-400"}`}>
                              Active
                            </span>
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 2: MULTI-FORMAT UPLOAD HUB */}
          {activeTab === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
              id="upload-tab"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-500/10 pb-4" id="upload-title-sec">
                <div className="space-y-1.5">
                  <h1 className={`text-3xl font-extrabold tracking-tight select-none font-display ${isLightMode ? "text-zinc-950" : "text-white"}`}>
                    Upload Study Material
                  </h1>
                  <p className={`text-sm font-sans ${isLightMode ? "text-zinc-650" : "text-zinc-400"}`}>
                    Drop any file and let Cramup.AI transform it into a full study workspace
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-xl border bg-[#a855f7]/5 border-[#a855f7]/25 text-[#c084fc] font-mono text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-[#a855f7]" />
                  <span>Gemini 3.5 Flash Model Core</span>
                </div>
              </div>

              <WorkspaceHub 
                currentUser={currentUser} 
                onProcessingSuccess={handleProcessingSuccess} 
                onOpenPaywall={() => setActiveTab("plans")} 
                onUploadIncrement={handleUploadCountIncrement} 
                onSubjectChange={handleSubjectChange}
                isLightMode={isLightMode}
              />
            </motion.div>
          )}

          {/* TAB 3: STUDY LIBRARY AND WORKSPACE */}
          {activeTab === "library" && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
              id="library-tab"
            >
              
              {materialsList.length === 0 ? (
                /* Empty state of library */
                <div className={`flex flex-col items-center justify-center py-24 px-4 text-center border border-dashed rounded-3xl ${isLightMode ? "border-zinc-300 bg-white" : "border-[#ffffff0a] bg-zinc-950/20"}`} id="library-empty">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isLightMode ? "bg-purple-100 text-purple-600" : "bg-[#1b1528] text-purple-400"}`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className={`text-md font-bold ${isLightMode ? "text-zinc-900" : "text-white"}`}>Your study library is currently empty</h3>
                  <p className={`text-xs mt-1.5 max-w-sm leading-relaxed ${isLightMode ? "text-zinc-650" : "text-zinc-400"}`}>
                    Once you upload files or YouTube links, your interactive active recall summary decks appear right here.
                  </p>
                  <button
                    id="library-upload-trigger"
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className="mt-6 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-mono uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl cursor-pointer shadow-lg shadow-purple-500/15"
                  >
                    Ingest Your First Material
                  </button>
                </div>
              ) : (
                /* Dynamic material selector alongside Tab controls */
                <div className="space-y-6" id="library-workspace">
                  
                  {!selectedMaterial ? (
                    /* Selector catalogue of active material when none selected */
                    <div className="space-y-6 select-none" id="library-catalogue-container">
                      <div className="space-y-1.5">
                        <h1 className={`text-3xl font-extrabold tracking-tight font-display ${isLightMode ? "text-zinc-950" : "text-white"}`}>My Library</h1>
                        <p className={`text-sm font-sans font-medium ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>
                          {materialsList.length} study materials
                        </p>
                      </div>

                      <div className="flex flex-col gap-4" id="materials-list">
                        {materialsList.map((m) => {
                          let iconBg = "bg-purple-600";
                          let IconComponent = BookOpen;

                          if (m.file_type === "YouTube URL") {
                            iconBg = "bg-[#ef4444]";
                            IconComponent = LinkIcon;
                          } else if (m.file_type === "PDF") {
                            iconBg = "bg-orange-500";
                            IconComponent = FileText;
                          } else if (m.file_type === "Video") {
                            iconBg = "bg-blue-500";
                            IconComponent = PlayIcon;
                          } else if (m.file_type === "Audio") {
                            iconBg = "bg-emerald-500";
                            IconComponent = Volume2;
                          } else if (m.file_type === "Photo") {
                            iconBg = "bg-pink-500";
                            IconComponent = ImageIcon;
                          }

                          return (
                            <div
                              id={`lib-card-${m.id}`}
                              key={m.id}
                              onClick={() => {
                                setSelectedMaterial(m);
                                setActiveSubTab("summary");
                              }}
                              className={`p-4 rounded-2xl text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer border group ${
                                isLightMode 
                                  ? "bg-white border-zinc-200 hover:border-purple-300 hover:bg-zinc-50" 
                                  : "bg-[#0e0e11] border-white/5 hover:border-white/10 hover:bg-[#121216]"
                              }`}
                            >
                              <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                                <div className={`w-12 h-12 rounded-xl text-white ${iconBg} flex items-center justify-center shrink-0`}>
                                  <IconComponent className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-base font-bold truncate group-hover:text-purple-500 transition-colors ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                                    {m.title}
                                  </p>
                                  <p className={`text-xs mt-1.5 font-sans font-medium leading-none ${isLightMode ? "text-zinc-500" : "text-zinc-505"}`}>
                                    {m.file_type} &bull; {new Date(m.generated_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end w-full sm:w-auto border-t sm:border-transparent pt-3 sm:pt-0 border-zinc-500/10">
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border select-none ${
                                  isLightMode 
                                    ? "border-emerald-250 text-emerald-600 bg-emerald-50/50" 
                                    : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                                }`}>
                                  completed
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteMaterialClick(e, m.id)}
                                  className={`p-2 rounded-xl transition-colors group/del ${
                                    isLightMode 
                                      ? "text-zinc-400 hover:bg-zinc-150 hover:text-red-500" 
                                      : "text-zinc-500 hover:bg-white/5 hover:text-red-400"
                                  }`}
                                  title="Delete material"
                                >
                                  <Trash2 className="w-4.5 h-4.5 transition-transform group-hover/del:scale-105" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Detailed Workstation mode when a material is chosen */
                    <div className="space-y-6" id="library-workspace-selected">
                      {/* Back to Library Navigation Block */}
                      <div className="space-y-3" id="library-workspace-header">
                        <button
                          onClick={() => setSelectedMaterial(null)}
                          className={`flex items-center gap-1 text-xs transition-colors cursor-pointer select-none font-semibold ${isLightMode ? "text-zinc-600 hover:text-purple-600" : "text-zinc-400 hover:text-white"}`}
                          id="back-to-library-btn"
                        >
                          <span className="text-sm">←</span> Back to Library
                        </button>

                        <div className="space-y-1">
                          <h2 className={`text-3xl font-extrabold tracking-tight leading-tight select-all ${isLightMode ? "text-zinc-905" : "text-white"}`}>
                            {selectedMaterial.title}
                          </h2>
                          <div className={`text-xs font-semibold uppercase tracking-wider flex flex-wrap items-center gap-1.5 ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
                            <span>{selectedMaterial.file_type}</span>
                            <span>&bull;</span>
                            <span>{selectedMaterial.subject || currentUser.selected_subject || "Biology"}</span>
                            {selectedMaterial.file_url && (
                              <>
                                <span>&bull;</span>
                                <a 
                                  href={selectedMaterial.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1 normal-case px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-normal transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                    isLightMode 
                                      ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80 border border-indigo-200/50 shadow-sm" 
                                      : "bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20 shadow-md"
                                  }`}
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  <span>View Original File</span>
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sub Tab Navigation Selection Bar inside detailed view */}
                      <div className={`grid grid-cols-4 gap-1 p-1 rounded-2xl border ${isLightMode ? "bg-zinc-200/50 border-zinc-300" : "bg-black/40 border-white/5"}`} id="library-subtabs-nav">
                        {[
                          { id: "summary", label: "Study Notes", icon: BookOpen },
                          { id: "flashcards", label: "Flashcards", icon: Layers },
                          { id: "quiz", label: "Practice Quizzes", icon: Award },
                          { id: "chatbot", label: "Chat", icon: MessageSquare }
                        ].map((tab) => {
                          const Icon = tab.icon;
                          const isSubActive = activeSubTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveSubTab(tab.id)}
                              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 rounded-xl text-xs transition-all cursor-pointer border ${
                                isSubActive 
                                  ? (isLightMode ? "bg-white border-zinc-300 text-purple-700 font-bold shadow-sm" : "bg-[#251e3d] border-[#3f3170]/80 text-[#c084fc] font-bold shadow-md") 
                                  : (isLightMode ? "text-zinc-600 border-transparent hover:text-purple-600 hover:bg-zinc-100/50" : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/[0.02]")
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="text-[10px] font-sans font-semibold tracking-wide">{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Render the full interactive Summary/Quiz/Flashcards AI components */}
                      <Dashboard 
                        currentUser={currentUser} 
                        activeTab={activeSubTab} 
                        onTabChange={setActiveSubTab} 
                        onOpenPaywall={() => setActiveTab("plans")} 
                        onSubjectChange={handleSubjectChange} 
                        onLogout={handleLogout}
                        currentMaterial={selectedMaterial} 
                        isLightMode={isLightMode}
                      />
                    </div>
                  )}

                </div>
              )}

            </motion.div>
          )}

          {/* TAB 4: SAAS PREMIUM PRICING PLANS */}
          {activeTab === "plans" && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
              id="plans-tab"
            >
              <SubscriptionPage 
                currentUser={currentUser} 
                onUpgradeSuccess={handleUpgradeSuccess} 
                onClose={() => setActiveTab("dashboard")} 
                isLightMode={isLightMode}
              />
            </motion.div>
          )}

          {/* TAB 5: SETTINGS PAGE */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
              id="settings-tab"
            >
              <SettingsPage
                currentUser={currentUser}
                isLightMode={isLightMode}
                onProfileUpdate={handleProfileUpdate}
                onLogout={handleLogout}
                onUpgradeClick={() => setActiveTab("plans")}
                onLegalClick={() => setActiveTab("legal")}
                onToggleTheme={handleToggleTheme}
              />
            </motion.div>
          )}

          {/* TAB 6: LEGAL HUB PAGE */}
          {activeTab === "legal" && (
            <motion.div
              key="legal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
              id="legal-tab"
            >
              <LegalHubPage
                isLightMode={isLightMode}
                onBackToDashboard={() => setActiveTab("dashboard")}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Custom Subject Modal Dialog overlay */}
      <AnimatePresence>
        {showCustomSubjectModal && (
          <motion.div
            key="custom-subject-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            id="custom-subject-modal-backdrop"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-900 border border-zinc-805/60 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
              id="custom-subject-modal-panel"
            >
              <div className="space-y-1">
                <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">🔮 Tune Workspace To Custom Subject</h3>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Enter the name of your specific custom subject or academic course. This configuration optimizes and targets all study guides, quizzes, and chatbots contextually.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveCustomSubject();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Custom Subject Name</label>
                  <input
                    id="custom-subject-modal-input"
                    type="text"
                    required
                    placeholder="e.g. Organic Agriculture, Quantum Biophysics"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    className="w-full bg-[#18181b]/80 border border-indigo-500/40 text-xs py-2.5 px-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-white font-mono placeholder:text-zinc-600"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    id="custom-subject-modal-cancel"
                    onClick={() => setShowCustomSubjectModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="custom-subject-modal-save"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    Apply Subject
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {deleteConfirmMaterialId && (
          <motion.div
            key="delete-confirm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            id="delete-confirm-modal-backdrop"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 ${
                isLightMode 
                  ? "bg-white border-zinc-200 text-zinc-900" 
                  : "bg-zinc-900 border-zinc-800 text-white"
              }`}
              id="delete-confirm-modal-panel"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <h3 className={`text-base font-bold leading-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    Delete Study Material?
                  </h3>
                  <p className={`text-xs font-medium leading-relaxed ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>
                    Are you absolutely sure you want to delete <span className="font-bold underline">"{materialsList.find(m => m.id === deleteConfirmMaterialId)?.title}"</span>? This will permanently remove its study notes, flashcards, quizzes, and chat log. This action is irreversible.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  id="delete-confirm-cancel"
                  onClick={() => setDeleteConfirmMaterialId(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isLightMode 
                      ? "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100" 
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  Keep Material
                </button>
                <button
                  type="button"
                  id="delete-confirm-action"
                  onClick={handleConfirmDeleteMaterial}
                  className="bg-red-650 hover:bg-red-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  Yes, Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </main>
    </div>
  );
}
