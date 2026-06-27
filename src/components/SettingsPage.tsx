import React, { useState } from "react";
import { 
  User, 
  Mail, 
  BookOpen, 
  Save, 
  Crown, 
  LogOut, 
  Check, 
  Sparkles,
  ChevronRight,
  FileText,
  CreditCard
} from "lucide-react";
import { AppUser, ALL_SUBJECTS } from "../types";
import { DBService } from "../store";

interface SettingsPageProps {
  currentUser: AppUser;
  isLightMode: boolean;
  onProfileUpdate: (updatedUser: AppUser) => void;
  onLogout: () => void;
  onUpgradeClick: () => void;
  onLegalClick?: () => void;
  onToggleTheme?: () => void;
}

export default function SettingsPage({
  currentUser,
  isLightMode,
  onProfileUpdate,
  onLogout,
  onUpgradeClick,
  onLegalClick,
  onToggleTheme
}: SettingsPageProps) {
  const isCramupEmail = currentUser.email.toLowerCase().includes("cramup") || currentUser.email.toLowerCase() === "cramup.ai@gmail.com";
  const defaultName = isCramupEmail ? "Vihandu Randil Marasinghe" : currentUser.email.split("@")[0].charAt(0).toUpperCase() + currentUser.email.split("@")[0].slice(1);
  
  const [displayName, setDisplayName] = useState(currentUser.display_name || defaultName);
  const [selectedSubject, setSelectedSubject] = useState(currentUser.selected_subject);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(currentUser.auto_renew !== false);

  // Custom alert & confirmation modal states
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string; type?: "success" | "error" | "info" } | null>(null);

  const limitDays = currentUser.billing_period === "annual" ? 365 : 30;
  const purchaseTime = currentUser.premium_purchased_at ? new Date(currentUser.premium_purchased_at).getTime() : null;
  const daysSincePurchase = purchaseTime ? (Date.now() - purchaseTime) / (1000 * 60 * 60 * 24) : null;
  const isWithinReactivationWindow = daysSincePurchase !== null && daysSincePurchase <= limitDays;

  const triggerCancelPlan = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowCancelConfirmation(true);
  };

  const handleCancelPlanConfirmed = async () => {
    setShowCancelConfirmation(false);
    setIsCanceling(true);
    setSuccessMsg(null);
    try {
      // Set premium_purchased_at now if they don't have it, so they have a reactivation window to test reactivating
      const pDate = currentUser.premium_purchased_at || new Date().toISOString();
      await DBService.updateUserProfile(currentUser.uid, {
        premium_purchased_at: pDate
      });

      const updatedUser = await DBService.upgradeUserTier(currentUser.uid, "Free");
      const finalUser = updatedUser 
        ? { ...updatedUser, premium_purchased_at: pDate } 
        : { ...currentUser, account_tier: "Free" as const, auto_renew: false, premium_purchased_at: pDate };

      onProfileUpdate(finalUser);
      setAutoRenew(false);

      const formattedDate = new Date(pDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      setCustomAlert({
        title: "Plan Canceled Successfully",
        message: `Your premium features have been deactivated. You can reactivate your plan anytime within ${limitDays} days of your purchase date (${formattedDate}).`,
        type: "success"
      });
      setSuccessMsg(`Premium subscription deactivated. You can reactivate your plan within ${limitDays} days from your purchase date (${formattedDate}).`);
      
      setTimeout(() => {
        setSuccessMsg(null);
      }, 7000);
    } catch (err: any) {
      console.error(err);
      setCustomAlert({
        title: "Deactivation Failed",
        message: "Failed to cancel subscription due to a database issue. Please try again.",
        type: "error"
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivatePlan = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!currentUser.premium_purchased_at) {
      setCustomAlert({
        title: "Reactivation Failed",
        message: "No purchase date found on this account to reactivate.",
        type: "error"
      });
      return;
    }

    const purchaseTime = new Date(currentUser.premium_purchased_at).getTime();
    const daysSince = (Date.now() - purchaseTime) / (1000 * 60 * 60 * 24);

    if (daysSince > limitDays) {
      setCustomAlert({
        title: "Reactivation Denied",
        message: `Your original purchase date was ${new Date(currentUser.premium_purchased_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} (${Math.floor(daysSince)} days ago). Since more than ${limitDays} days have elapsed, the fast-track reactivation has expired. Please upgrade with a standard transaction.`,
        type: "error"
      });
      return;
    }

    setIsReactivating(true);
    setSuccessMsg(null);
    try {
      const updatedUser = await DBService.upgradeUserTier(currentUser.uid, "Premium", true);
      if (updatedUser) {
        onProfileUpdate(updatedUser);
        setAutoRenew(true);
        setCustomAlert({
          title: "Plan Reactivated!",
          message: "Welcome back! Your premium subscription has been fully restored with all unlimited tools enabled.",
          type: "success"
        });
        setSuccessMsg("Premium subscription reactivated successfully! Welcome back to Premium.");
      } else {
        const fallbackUser: AppUser = {
          ...currentUser,
          account_tier: "Premium",
          auto_renew: true
        };
        onProfileUpdate(fallbackUser);
        setAutoRenew(true);
        setCustomAlert({
          title: "Plan Reactivated!",
          message: "Welcome back! Your premium subscription has been fully restored with all unlimited tools enabled.",
          type: "success"
        });
        setSuccessMsg("Premium subscription reactivated successfully! Welcome back to Premium.");
      }
      setTimeout(() => {
        setSuccessMsg(null);
      }, 5050);
    } catch (err: any) {
      console.error(err);
      setCustomAlert({
        title: "Reactivation Failed",
        message: "Failed to reactivate plan. Please try again.",
        type: "error"
      });
    } finally {
      setIsReactivating(false);
    }
  };

  const handleSimulatePurchaseOld = async () => {
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    const isoString = thirtyFiveDaysAgo.toISOString();

    try {
      await DBService.updateUserProfile(currentUser.uid, {
        premium_purchased_at: isoString
      });
      const updatedUser: AppUser = {
        ...currentUser,
        premium_purchased_at: isoString
      };
      onProfileUpdate(updatedUser);
      setSuccessMsg("Simulation: Original purchase date set to 35 days ago (Reactivation Expired for Monthly, Active for Annual).");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulatePurchaseExpiredAll = async () => {
    const threeHundredSeventyDaysAgo = new Date();
    threeHundredSeventyDaysAgo.setDate(threeHundredSeventyDaysAgo.getDate() - 370);
    const isoString = threeHundredSeventyDaysAgo.toISOString();

    try {
      await DBService.updateUserProfile(currentUser.uid, {
        premium_purchased_at: isoString
      });
      const updatedUser: AppUser = {
        ...currentUser,
        premium_purchased_at: isoString
      };
      onProfileUpdate(updatedUser);
      setSuccessMsg("Simulation: Original purchase date set to 370 days ago (Reactivation Expired for ALL Plans).");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulatePurchaseNew = async () => {
    const freshDate = new Date().toISOString();
    try {
      await DBService.updateUserProfile(currentUser.uid, {
        premium_purchased_at: freshDate
      });
      const updatedUser: AppUser = {
        ...currentUser,
        premium_purchased_at: freshDate
      };
      onProfileUpdate(updatedUser);
      setSuccessMsg("Simulation: Original purchase date set to right now (Reactivation Eligible).");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAutoRenew = async () => {
    const nextVal = !autoRenew;
    setAutoRenew(nextVal);
    try {
      await DBService.updateUserProfile(currentUser.uid, {
        auto_renew: nextVal
      });
      const updatedUser: AppUser = {
        ...currentUser,
        auto_renew: nextVal
      };
      onProfileUpdate(updatedUser);
      setSuccessMsg(nextVal ? "Auto-renewal turned ON successfully!" : "Auto-renewal turned OFF. You won't be charged next month!");
      
      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);
    } catch (err) {
      console.error(err);
      setAutoRenew(!nextVal);
    }
  };

  const initials = displayName.trim().charAt(0).toUpperCase() || "U";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      // Save display name and current subject
      await DBService.updateUserProfile(currentUser.uid, {
        display_name: displayName,
        selected_subject: selectedSubject
      });
      
      const updatedUser: AppUser = {
        ...currentUser,
        display_name: displayName,
        selected_subject: selectedSubject
      };
      
      onProfileUpdate(updatedUser);
      setSuccessMsg("Profile saved successfully!");
      setIsEditingSubject(false);
      
      // Clear success notification after 3 seconds
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto w-full" id="settings-page-container">
      {/* Page header and descriptors */}
      <div className="space-y-1.5" id="settings-header">
        <h1 className={`text-3xl font-extrabold tracking-tight font-display ${isLightMode ? "text-zinc-950" : "text-white"}`}>
          Settings
        </h1>
        <p className={`text-xs sm:text-sm font-sans ${isLightMode ? "text-zinc-550" : "text-zinc-400"}`}>
          Manage your profile and subscription preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2 animate-fade-in" id="settings-success-alert">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Form Fields */}
      <form onSubmit={handleSaveProfile} className="space-y-6" id="settings-form">
        
        {/* SECTION 1: PROFILE */}
        <div className="space-y-3">
          <h3 className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
            Profile
          </h3>
          
          <div className={`border rounded-2xl p-5 sm:p-6 space-y-6 transition-all ${
            isLightMode 
              ? "bg-white border-zinc-200 shadow-sm text-zinc-900" 
              : "bg-[#09090b]/80 border-white/5 text-slate-100"
          }`} id="settings-profile-card">
            
            {/* User credentials banner avatar */}
            <div className="flex items-center gap-4 border-b border-white/[0.05] pb-5" id="settings-user-identity">
              <div className="w-14 h-14 rounded-2xl bg-[#6d28d9] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-purple-500/10 shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <span className={`block text-base font-bold truncate leading-snug ${isLightMode ? "text-zinc-950" : "text-white"}`}>
                  {displayName}
                </span>
                <span className="block text-[11px] text-zinc-500 font-medium font-mono leading-none mt-1">
                  {currentUser.email}
                </span>
              </div>
            </div>

            {/* Inputs: Display Name */}
            <div className="space-y-2">
              <label className={`text-[10px] font-bold font-mono uppercase tracking-wider block flex items-center gap-1.5 ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>
                <User className="w-3.5 h-3.5" /> Display Name
              </label>
              <input
                id="settings-display-name-input"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full text-xs font-medium py-3 px-4 rounded-xl focus:outline-none transition-all border ${
                  isLightMode 
                    ? "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#a855f7] focus:bg-white" 
                    : "bg-[#121214]/60 border-white/5 text-white focus:border-[#a855f7] focus:bg-zinc-950"
                }`}
                placeholder="Enter your full name"
              />
            </div>

            {/* Inputs: Email (read-only) */}
            <div className="space-y-2">
              <label className={`text-[10px] font-bold font-mono uppercase tracking-wider block flex items-center gap-1.5 ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                id="settings-email-input"
                type="text"
                disabled
                value={currentUser.email}
                className={`w-full text-xs font-mono py-3 px-4 rounded-xl border opacity-60 select-none cursor-not-allowed ${
                  isLightMode 
                    ? "bg-zinc-100 border-zinc-200 text-zinc-600" 
                    : "bg-zinc-900/40 border-white/[0.05] text-zinc-400"
                }`}
              />
              <p className="text-[10px] text-zinc-500 font-mono">Email cannot be changed.</p>
            </div>

            {/* Study Subject Item layout */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              isLightMode ? "bg-zinc-50 border-zinc-200" : "bg-[#121214]/30 border-white/[0.05]"
            }`} id="settings-subject-block">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isLightMode ? "bg-purple-100 text-[#7c3aed]" : "bg-purple-500/10 text-purple-400"}`}>
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                {isEditingSubject ? (
                  <div className="flex-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Select Active Course</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className={`text-xs font-mono py-1 px-2.5 rounded focus:outline-none transition-colors border cursor-pointer ${
                        isLightMode 
                          ? "bg-white border-zinc-300 text-zinc-800" 
                          : "bg-zinc-900 border-white/10 text-zinc-200"
                      }`}
                    >
                      {ALL_SUBJECTS.map((subj) => (
                        <option key={subj} value={subj} className="bg-zinc-950 text-slate-100">{subj}</option>
                      ))}
                      {!ALL_SUBJECTS.includes(selectedSubject) && (
                        <option value={selectedSubject}>{selectedSubject}</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <span className={`block text-xs font-bold ${isLightMode ? "text-zinc-800" : "text-zinc-300"}`}>Study Subject</span>
                    <span className="block text-[11px] text-purple-400 font-mono mt-0.5 font-semibold truncate leading-none">
                      🎓 {selectedSubject}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  id="settings-change-subject"
                  onClick={() => setIsEditingSubject(!isEditingSubject)}
                  className={`text-xs font-mono font-semibold px-3.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isEditingSubject
                      ? isLightMode ? "bg-zinc-200 hover:bg-zinc-300 text-zinc-850" : "bg-zinc-800 hover:bg-zinc-700 text-white"
                      : "text-purple-400 border-purple-500/20 hover:bg-purple-500/5"
                  }`}
                >
                  {isEditingSubject ? "Done" : "Change"}
                </button>
              </div>
            </div>

            {/* Profile Save operations button */}
            <button
              id="settings-save-button"
              type="submit"
              disabled={isSaving}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-mono text-xs uppercase tracking-widest py-3 px-5 rounded-xl transition-all shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2.5 w-full cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving changes..." : "Save Profile"}
            </button>

          </div>
        </div>

        {/* SECTION 2: SUBSCRIPTION PLAN */}
        <div className="space-y-3">
          <h3 className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
            Subscription Plan
          </h3>

          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            isLightMode 
              ? "bg-white border-zinc-200 text-zinc-900 shadow-sm" 
              : "bg-[#09090b]/80 border-white/5 text-slate-100"
          }`} id="settings-subscription-card">
            
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                currentUser.account_tier === "Premium" 
                  ? "bg-amber-500/10 text-amber-500" 
                  : "bg-purple-500/10 text-purple-400"
              }`}>
                <Crown className="w-5 h-5" />
              </div>
              <div className="overflow-hidden p-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`block text-xs sm:text-sm font-bold ${isLightMode ? "text-zinc-950" : "text-white"}`}>
                    {currentUser.account_tier === "Premium" ? "Premium Active" : "Free Plan"}
                  </span>
                  {currentUser.account_tier === "Premium" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <span className={`block text-[10px] sm:text-[11px] mt-1 truncate ${isLightMode ? "text-zinc-500" : "text-zinc-550"}`}>
                  {currentUser.account_tier === "Premium" 
                    ? "Unlimited uploads and full ecosystem access" 
                    : "Limited preview features"}
                </span>
              </div>
            </div>

            {currentUser.account_tier === "Free" ? (
              <button
                type="button"
                id="settings-upgrade-button"
                onClick={onUpgradeClick}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-lg border border-purple-500/10 shadow-lg shadow-purple-500/5 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                Upgrade to Premium
              </button>
            ) : (
              <button
                type="button"
                id="settings-cancel-plan-button"
                disabled={isCanceling}
                onClick={triggerCancelPlan}
                className="bg-rose-500/10 hover:bg-rose-500/15 text-rose-500 hover:text-rose-600 disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-lg border border-rose-500/20 shadow-lg shadow-rose-500/5 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                {isCanceling ? "Deactivating..." : "Cancel Plan"}
              </button>
            )}
          </div>

          {/* Active Premium Plan Custom Info Area */}
          {currentUser.account_tier === "Premium" && (
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 text-xs ${
              isLightMode 
                ? "bg-purple-50/40 border-purple-100/80 text-zinc-900 shadow-sm" 
                : "bg-white/[0.02] border-white/5 text-slate-100"
            }`} id="settings-plan-switching-section">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5 overflow-hidden">
                  <div className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] ${
                    isLightMode ? "text-purple-700" : "text-purple-300"
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                    <span>Active Premium Member Settings</span>
                  </div>
                  <p className={`text-xs font-semibold ${isLightMode ? "text-zinc-800" : "text-zinc-200"}`}>
                    Subscription cycle: <strong className="font-mono text-xs uppercase text-purple-600">{currentUser.billing_period || "monthly"} Plan</strong>
                  </p>
                  <p className={`text-[11px] leading-relaxed ${isLightMode ? "text-zinc-550" : "text-zinc-400"}`}>
                    Your Premium status is set to auto-renew on: <strong className="font-mono text-xs text-emerald-500">{
                      new Date(
                        new Date(currentUser.premium_purchased_at || "").getTime() + 
                        (currentUser.billing_period === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000
                      ).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                    }</strong> ({currentUser.billing_period === "annual" ? "renewing every 365 days" : "renewing every 30 days"}).
                  </p>

                  <div className="mt-4 p-3.5 rounded-xl border bg-zinc-500/5 border-zinc-500/10 flex items-center justify-between" id="settings-card-payment-info">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <span className={`block text-[9px] font-mono font-bold uppercase tracking-wider ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>Payment Method</span>
                        <span className={`block text-xs font-bold truncate ${isLightMode ? "text-zinc-800" : "text-zinc-200"}`}>
                          Simulated Credit Card Linked
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reactivation Promotion Offer Card */}
          {currentUser.account_tier === "Free" && currentUser.premium_purchased_at && (
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 text-xs ${
              isLightMode ? "bg-amber-50/40 border-amber-200" : "bg-[#161310] border-amber-550/20"
            }`} id="settings-reactivate-section">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 font-bold text-amber-500 font-mono text-[10px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
                    <span>Reactivation Option Available ({currentUser.billing_period === "annual" ? "Annual Plan" : "Monthly Plan"})</span>
                  </div>
                  <p className={`text-xs font-semibold ${isLightMode ? "text-zinc-800" : "text-zinc-200"}`}>
                    Original purchase: <strong className="font-mono text-xs">{new Date(currentUser.premium_purchased_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                  </p>
                  <p className={`text-[11px] leading-relaxed ${isLightMode ? "text-zinc-650" : "text-zinc-450"}`}>
                    {daysSincePurchase !== null && daysSincePurchase <= limitDays ? (
                      <span>
                        You are eligible to reactivate your original plan instantly! You have{" "}
                        <strong className="text-emerald-500 font-mono font-extrabold">{Math.max(1, Math.ceil(limitDays - daysSincePurchase))} days left</strong> out of your {limitDays}-day reactivation window.
                      </span>
                    ) : (
                      <span className="text-rose-500 font-semibold">
                        Your {limitDays}-day reactivation period has expired (spent {daysSincePurchase !== null ? Math.floor(daysSincePurchase) : 0} days). Please upgrade again through standard billing button.
                      </span>
                    )}
                  </p>
                </div>
                
                <button
                  type="button"
                  id="settings-reactivate-btn"
                  onClick={handleReactivatePlan}
                  disabled={isReactivating}
                  className={`font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 shrink-0 select-none ${
                    isWithinReactivationWindow 
                      ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-600 border-amber-500/30 shadow-md shadow-amber-550/5" 
                      : "bg-zinc-500/5 text-zinc-500 border-zinc-550/10 cursor-not-allowed opacity-40"
                  }`}
                >
                  {isReactivating ? "Processing..." : "Reactivate Plan"}
                </button>
              </div>

              {/* Developer Helpers to simulate dates */}
              <div className={`border-t pt-3 flex flex-wrap items-center gap-2 text-[10px] font-mono ${
                isLightMode ? "border-zinc-200 text-zinc-400" : "border-white/5 text-zinc-500"
              }`}>
                <span className="font-semibold uppercase tracking-wider">Simulate Sandbox states:</span>
                <button
                  type="button"
                  onClick={handleSimulatePurchaseNew}
                  className="px-2 py-1 rounded bg-zinc-500/5 border border-zinc-500/20 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer"
                >
                  Set Purchase to 'Right Now'
                </button>
                <button
                  type="button"
                  onClick={handleSimulatePurchaseOld}
                  className="px-2 py-1 rounded bg-zinc-500/5 border border-zinc-500/20 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer"
                >
                  Set Purchase to '35 days ago'
                </button>
                <button
                  type="button"
                  onClick={handleSimulatePurchaseExpiredAll}
                  className="px-2 py-1 rounded bg-zinc-500/5 border border-zinc-500/20 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-550 transition-colors cursor-pointer"
                >
                  Set Purchase to '370 days ago'
                </button>
              </div>
            </div>
          )}

          {/* Card 2: Auto-Renewal Settings Toggle Switch */}
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            isLightMode 
              ? "bg-white border-zinc-200 text-zinc-900 shadow-sm" 
              : "bg-[#09090b]/80 border-white/5 text-slate-100"
          }`} id="settings-autorenewal-card">
            
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                autoRenew 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : isLightMode ? "bg-zinc-100 text-zinc-400" : "bg-white/5 text-zinc-500"
              }`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="overflow-hidden p-0.5">
                <span className={`block text-xs sm:text-sm font-bold ${isLightMode ? "text-zinc-950" : "text-white"}`}>
                  Auto-Renewal {autoRenew ? "Enabled" : "Disabled"}
                </span>
                <span className={`block text-[10px] sm:text-[11px] mt-1 text-zinc-500 whitespace-pre-wrap leading-tight`}>
                  {autoRenew 
                    ? "Your membership is scheduled to automatically renew on the start of next billing period." 
                    : "Turned OFF. Keeps current premium access active, avoiding future continuous auto-charges."}
                </span>
              </div>
            </div>

            {/* Sliding Toggle Switch Component */}
            <button
              type="button"
              id="settings-autorenewal-toggle"
              onClick={handleToggleAutoRenew}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoRenew ? "bg-[#7c3aed]" : isLightMode ? "bg-zinc-200" : "bg-zinc-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoRenew ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>

          </div>
        </div>

        {/* SECTION 3: LEGAL & COMPLIANCE */}
        {onLegalClick && (
          <div className="space-y-3" id="settings-legal-section">
            <h3 className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
              Compliance & Legal
            </h3>

            <div 
              onClick={onLegalClick}
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group ${
                isLightMode 
                  ? "bg-white border-zinc-200 text-zinc-900 hover:border-purple-300 shadow-sm" 
                  : "bg-[#09090b]/80 border-white/5 text-slate-100 hover:border-purple-500/20"
              }`} 
              id="settings-legal-card"
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-[#a855f7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 text-[#a855f7]" />
                </div>
                <div className="overflow-hidden p-0.5">
                  <span className={`block text-xs sm:text-sm font-bold group-hover:text-[#a855f7] transition-colors ${isLightMode ? "text-zinc-950" : "text-white"}`}>
                    Legal & Policies Hub
                  </span>
                  <span className={`block text-[10px] sm:text-[11px] mt-1 truncate ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
                    View Terms, Strict No-Refund rules & student data protections
                  </span>
                </div>
              </div>

              <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-[#a855f7] group-hover:translate-x-0.5 transition-all`} />
            </div>
          </div>
        )}

        {/* SECTION 4: APPEARANCE */}
        {onToggleTheme && (
          <div className="space-y-3" id="settings-appearance-section">
            <h3 className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
              Appearance
            </h3>

            <div 
              onClick={onToggleTheme}
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group ${
                isLightMode 
                  ? "bg-white border-zinc-200 text-zinc-900 hover:border-purple-300 shadow-sm" 
                  : "bg-[#09090b]/80 border-white/5 text-slate-100 hover:border-purple-500/20"
              }`} 
              id="settings-theme-card"
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-[#a855f7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-[#a855f7]" />
                </div>
                <div className="overflow-hidden">
                  <span className={`block text-sm font-bold group-hover:text-[#a855f7] transition-colors ${isLightMode ? "text-zinc-950" : "text-white"}`}>
                    Visual Theme: {isLightMode ? "Light Mode" : "Dark Mode"}
                  </span>
                  <span className={`block text-[11px] mt-1 truncate ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
                    Switch theme style representation instantly
                  </span>
                </div>
              </div>

              <div className={`text-[10px] uppercase font-mono font-bold tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                isLightMode 
                  ? "bg-zinc-100 hover:bg-zinc-200 text-[#7c3aed] border-zinc-200" 
                  : "bg-white/5 hover:bg-white/10 text-amber-400 border-white/10"
              }`}>
                Activate {isLightMode ? "Dark" : "Light"}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: ACCOUNT ACTIONS */}
        <div className="space-y-3">
          <h3 className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
            Account
          </h3>

          <div 
            onClick={onLogout}
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group ${
              isLightMode 
                ? "bg-white border-zinc-200 text-zinc-900 hover:border-red-300 shadow-sm" 
                : "bg-[#09090b]/80 border-white/5 text-slate-100 hover:border-red-500/20"
            }`} 
            id="settings-logout-card"
          >
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div className="overflow-hidden">
                <span className={`block text-sm font-bold group-hover:text-red-500 transition-colors ${isLightMode ? "text-zinc-950" : "text-white"}`}>
                  Sign Out
                </span>
                <span className={`block text-[11px] mt-1 truncate ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
                  Log out of your CramUp.AI account
                </span>
              </div>
            </div>

            <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all`} />
          </div>
        </div>

      </form>

      {/* 1. Custom Non-Blocking Cancel Plan Confirmation Modal */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" id="cancel-confirmation-modal">
          <div className={`w-full max-w-md p-6 sm:p-7 rounded-2xl border shadow-xl flex flex-col gap-5 ${
            isLightMode ? "bg-white border-zinc-200 text-zinc-900" : "bg-zinc-950 border-white/10 text-white"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-tight">Confirm Deactivation</h4>
                <p className="text-[10px] uppercase font-mono tracking-wider text-rose-500 font-semibold mt-0.5">Cancel Premium Subscription</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-zinc-400">
              Are you sure you want to deactivate your Premium plan? All top tier features (unlimited/custom flashcards, voice narrator guides, and specialized AI tutor help) will turn off instantly and your account reverts to the Free Tier immediately.
            </p>

            <div className={`p-3 rounded-lg text-[11px] font-mono leading-normal border ${
              isLightMode ? "bg-amber-50/50 border-amber-200 text-amber-700" : "bg-amber-500/5 border-amber-500/10 text-amber-400"
            }`}>
              💡 You will have <strong className="font-extrabold uppercase text-amber-500">30 days from your purchase date</strong> to reactivate the Premium profile instantly if you choose.
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirmation(false)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium border cursor-pointer select-none transition-all active:scale-95 ${
                  isLightMode 
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-250" 
                    : "bg-white/5 hover:bg-white/10 text-zinc-200 border-white/[0.08]"
                }`}
              >
                Keep Premium
              </button>
              <button
                type="button"
                onClick={handleCancelPlanConfirmed}
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer select-none active:scale-95"
              >
                Deactivate Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Custom Success & Notification Dialog Modal */}
      {customAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in" id="custom-alert-dialog">
          <div className={`w-full max-w-md p-6 sm:p-7 rounded-2xl border shadow-xl flex flex-col gap-5 ${
            isLightMode ? "bg-white border-zinc-200 text-zinc-900" : "bg-zinc-950 border-white/10 text-white"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                customAlert.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : customAlert.type === "error" 
                    ? "bg-rose-500/10 text-rose-500" 
                    : "bg-amber-500/10 text-amber-500"
              }`}>
                {customAlert.type === "success" ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-tight">{customAlert.title}</h4>
                <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">System Notification</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-zinc-450">
              {customAlert.message}
            </p>

            <div className="flex items-center justify-end mt-2">
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-mono font-semibold text-center cursor-pointer select-none transition-all active:scale-95 ${
                  customAlert.type === "error"
                    ? "bg-rose-500 hover:bg-rose-600 text-white"
                    : isLightMode 
                      ? "bg-zinc-900 hover:bg-black text-white" 
                      : "bg-white hover:bg-zinc-55 text-black shadow-lg shadow-white/5"
                }`}
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
