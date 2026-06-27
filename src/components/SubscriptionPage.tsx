import React, { useState, useEffect, useRef } from "react";
import { AppUser } from "../types";
import { DBService } from "../store";
import { Check, X, Sparkles, CreditCard, Shield, Lock, Zap } from "lucide-react";

interface SubscriptionPageProps {
  currentUser: AppUser;
  onUpgradeSuccess: (updatedUser: AppUser) => void;
  onClose?: () => void;
  isLightMode: boolean;
}

export default function SubscriptionPage({ currentUser, onUpgradeSuccess, onClose, isLightMode }: SubscriptionPageProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(currentUser.billing_period || "monthly");
  const [paymentMethod, setPaymentMethod] = useState<"paddle" | "card">("paddle");
  
  // Card simulator inputs
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paddle Billing Credentials
  const [paddleConfig, setPaddleConfig] = useState<{ clientToken: string; priceMonthly: string; priceAnnual: string; environment: string }>({
    clientToken: "",
    priceMonthly: "",
    priceAnnual: "",
    environment: "sandbox"
  });
  const [paddleSdkLoaded, setPaddleSdkLoaded] = useState(false);
  const [paddleConfigError, setPaddleConfigError] = useState<string | null>(null);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // Fetch Paddle Configuration from sever API
  useEffect(() => {
    let active = true;
    fetch("/api/config/paddle")
      .then(res => res.json())
      .then(data => {
        if (active) {
          setPaddleConfig(data);
        }
      })
      .catch(err => {
        console.error("Failed to read Paddle API configuration setup:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Dynamically load the Paddle Billing JS SDK script
  useEffect(() => {
    if (paymentMethod !== "paddle" || !showCheckout) return;

    const scriptId = "paddle-sdk-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    const initPaddle = () => {
      const paddleGlobal = (window as any).Paddle;
      if (!paddleGlobal) return;
      try {
        paddleGlobal.initialize({
          token: paddleConfig.clientToken || "test_xxxxxxxxxxxxxxxxxxxxxxxxxx", // Fallback sandbox simulation client token
          environment: paddleConfig.environment || "sandbox",
          eventCallback: function(data: any) {
            console.log("Paddle Event:", data);
            if (data.name === "checkout.completed") {
              handlePaddlePaymentSuccess();
            }
          }
        });
      } catch (err) {
        console.error("Paddle initialization error:", err);
      }
    };

    if (script) {
      if ((window as any).Paddle) {
        setPaddleSdkLoaded(true);
        initPaddle();
      }
      return;
    }

    script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    
    script.onload = () => {
      setPaddleSdkLoaded(true);
      initPaddle();
    };
    script.onerror = () => {
      console.error("Paddle JS SDK resource loading failed.");
      setPaddleConfigError("Paddle server is temporarily offline or being blocked by security extensions.");
    };

    document.body.appendChild(script);
  }, [paymentMethod, showCheckout, paddleConfig]);

  const handlePaddlePaymentSuccess = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await DBService.upgradeUserTier(currentUser.uid, "Premium", false, billingPeriod);
      if (updated) {
        setSuccess(true);
        setTimeout(() => {
          onUpgradeSuccess(updated);
          setShowCheckout(false);
          if (onClose) onClose();
        }, 1800);
      } else {
        throw new Error("Unable to modify account profile configuration.");
      }
    } catch (err: any) {
      setError("Paddle checkout completed successfully but syncing database state failed. Contact Support.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaddleCheckout = () => {
    const paddleGlobal = (window as any).Paddle;
    if (!paddleGlobal) {
      setError("Paddle JS SDK is not loaded yet. Please wait.");
      return;
    }

    const priceId = billingPeriod === "monthly" 
      ? paddleConfig.priceMonthly 
      : paddleConfig.priceAnnual;

    if (!priceId) {
      setError("Paddle Price ID is not configured. Define it in your credentials secrets or use card simulation.");
      return;
    }

    try {
      paddleGlobal.Checkout.open({
        items: [
          {
            priceId: priceId,
            quantity: 1
          }
        ],
        customer: {
          email: currentUser.email
        }
      });
    } catch (err: any) {
      console.error("Paddle Checkout open error:", err);
      setError("Failed to open Paddle Checkout widget. Make sure your price ID and credentials match.");
    }
  };

  const handleCheckoutSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (cardNumber.length < 12 || cvc.length < 3) {
      setError("Please complete your billing credentials with valid secure identifiers.");
      setLoading(false);
      return;
    }

    try {
      // Mock payment gateway delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const updated = await DBService.upgradeUserTier(currentUser.uid, "Premium", false, billingPeriod);
      if (updated) {
        setSuccess(true);
        setTimeout(() => {
          onUpgradeSuccess(updated);
          setShowCheckout(false);
          if (onClose) onClose();
        }, 1800);
      } else {
        throw new Error("Unable to modify account profile configuration.");
      }
    } catch (err: any) {
      setError("Payment gateway processing timed out. Try again with verified funds.");
    } finally {
      setLoading(false);
    }
  };

  const isPremium = currentUser.account_tier === "Premium";

  // Identical, unified comparison checklist for clean premium layout
  const freeFeatures = [
    { text: "3 uploads per month", active: true },
    { text: "Audio & Video limit: Max 2 hours", active: true },
    { text: "AI summaries & PDF download", active: true },
    { text: "Quizzes: MCQ & Fill-in-the-Blanks", active: true },
    { text: "Quizzes: Short Answer questions", active: true },
    { text: "Flashcards: 10 & 15 Card Decks", active: true },
    { text: "Audio & Video premium: Max 15 hours", active: false },
    { text: "Flashcards: Unlimited & Custom Decks", active: false },
    { text: "Unlimited AI Chatbot tutoring", active: false },
    { text: "Voice / Listen narration features", active: false },
    { text: "Summary translation (20+ languages)", active: false },
    { text: "Ad-free workspace experience", active: false },
    { text: "Priority support & updates", active: false }
  ];

  const premiumFeatures = [
    { text: "Unlimited uploads (no limits)", active: true },
    { text: "Audio & Video limit: Max 15 hours", active: true },
    { text: "AI summaries & PDF download", active: true },
    { text: "Quizzes: MCQ & Fill-in-the-Blanks", active: true },
    { text: "Quizzes: Short Answer questions", active: true },
    { text: "Flashcards: 10 & 15 Card Decks", active: true },
    { text: "Flashcards: Unlimited & Custom Decks", active: true },
    { text: "Unlimited AI Chatbot tutoring", active: true },
    { text: "Voice / Listen narration features", active: true },
    { text: "Summary translation (20+ languages)", active: true },
    { text: "Ad-free workspace experience", active: true },
    { text: "Priority support & updates", active: true }
  ];

  return (
    <div className={`py-10 px-4 relative flex flex-col items-center justify-center max-w-5xl mx-auto ${isLightMode ? "text-zinc-800" : "text-slate-100"}`} id="subscription-container">
      {success ? (
        <div className={`border p-12 rounded-3xl text-center space-y-5 max-w-lg mx-auto backdrop-blur-xl shadow-2xl animate-fade-in ${isLightMode ? "bg-white border-purple-200" : "bg-[#09090b] border-purple-500/40"}`} id="checkout-success">
          <div className="inline-flex p-4 bg-purple-500/10 border border-purple-500/20 rounded-full animate-bounce">
            <Zap className="w-8 h-8 text-[#c084fc]" />
          </div>
          <h3 className="text-2xl font-bold text-[#a855f7] font-display">Transaction Approved!</h3>
          <p className={`text-xs leading-relaxed font-sans ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>
            Payment simulated successfully! Your account tier has been upgraded to <strong className={isLightMode ? "text-zinc-900" : "text-white"}>PREMIUM</strong>. Relax as the workstation restarts with full capacities...
          </p>
          <div className={`h-1 rounded-full overflow-hidden border max-w-xs mx-auto ${isLightMode ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900 border-white/5"}`}>
            <div className="h-full bg-[#a855f7] animate-[pulse_1s_infinite] w-full" />
          </div>
        </div>
      ) : (
        <div className="w-full space-y-10 relative z-10" id="subscription-layout">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className={`text-3xl font-black tracking-tight font-display ${isLightMode ? "text-zinc-900" : "text-white"}`}>
              Choose Your Study Plan
            </h2>
            <p className={`text-sm font-sans tracking-wide ${isLightMode ? "text-zinc-500" : "text-[#71717a]"}`}>
              Unlock the full power of AI-assisted learning
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto" id="subscription-tiers-grid">
            
            {/* Free Tier card */}
            <div className={`p-8 rounded-3xl flex flex-col justify-between relative transition-transform duration-300 hover:scale-[1.01] border ${isLightMode ? "bg-white border-zinc-200 shadow-sm" : "bg-[#0e0e11] border-white/5"}`} id="tier-free-card">
              <div className="space-y-6">
                <div>
                  <h3 className={`text-xl font-bold font-display ${isLightMode ? "text-zinc-900" : "text-white"}`}>Free</h3>
                  <p className={`text-xs mt-1.5 font-sans font-medium ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>Get started with the basics</p>
                </div>

                <div className="flex items-baseline gap-1 mt-3">
                  <span className={`text-5xl font-black ${isLightMode ? "text-zinc-900" : "text-white"}`}>$0</span>
                  <span className={`text-xs font-sans font-medium ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>/month</span>
                </div>

                <div className={`border-t pt-6 ${isLightMode ? "border-zinc-200" : "border-white/5"}`}>
                  <ul className="space-y-4">
                    {freeFeatures.map((feat, i) => (
                      <li key={i} className={`flex gap-3 items-start text-xs ${feat.active ? (isLightMode ? "text-zinc-700 font-medium" : "text-zinc-300") : "text-[#71717a] opacity-45 select-none"}`}>
                        {feat.active ? (
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLightMode ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/10 text-emerald-400"}`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLightMode ? "bg-zinc-100 text-zinc-400" : "bg-zinc-800 text-zinc-650"}`}>
                            <X className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                        <span className="font-sans leading-tight">{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <button
                  id="tier-free-btn"
                  type="button"
                  disabled
                  className={`w-full border text-xs font-semibold py-3 rounded-xl cursor-default uppercase tracking-wider text-center ${isLightMode ? "bg-zinc-100 text-zinc-400 border-zinc-200" : "bg-[#131217] text-zinc-500 border-white/[0.02]"}`}
                >
                  {!isPremium ? "Current Plan" : "Basic Tier"}
                </button>
              </div>
            </div>

            {/* Premium Tier card */}
            <div className={`p-8 rounded-3xl flex flex-col justify-between relative shadow-2xl transition-transform duration-300 hover:scale-[1.01] border ${isLightMode ? "bg-white border-purple-200 shadow-purple-500/5" : "bg-[#0f0e13] border-[#a855f7]/25"}`} id="tier-premium-card">
              
              <div className="absolute -top-3 right-8 bg-[#4f46e5] text-white text-[10px] font-extrabold px-3.5 py-0.5 rounded uppercase tracking-wider shadow-md select-none transform hover:scale-105 transition-transform duration-200">
                RECOMMENDED
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className={`text-xl font-bold font-display flex items-center gap-1.5 ${isLightMode ? "text-purple-700" : "text-white"}`}>
                    Premium <span className="text-base">👑</span>
                  </h3>
                  <p className={`text-xs mt-1.5 font-sans font-medium ${isLightMode ? "text-purple-500 font-semibold" : "text-zinc-500"}`}>Unlock your full potential</p>
                </div>

                <div className="flex items-baseline gap-1 mt-3">
                  <span className={`text-5xl font-black ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    {billingPeriod === "monthly" ? "$14.99" : "$110"}
                  </span>
                  <span className={`text-xs font-sans font-medium ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
                    {billingPeriod === "monthly" ? "/month" : "/year (~$9.17/mo)"}
                  </span>
                </div>

                {/* Billing Cycle Toggle INSIDE card - only shown when they are ready to purchase (not premium yet) */}
                {!isPremium && (
                  <div className={`flex flex-col sm:flex-row sm:items-center gap-2 py-2 px-3 rounded-xl justify-between border ${isLightMode ? "bg-purple-50/50 border-purple-100" : "bg-white/[0.02] border-white/5"}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isLightMode ? "text-purple-700" : "text-purple-300"}`}>Billing Cycle:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setBillingPeriod("monthly")}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all duration-150 ${billingPeriod === "monthly" ? "bg-purple-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                        type="button"
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingPeriod("annual")}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 ${billingPeriod === "annual" ? "bg-purple-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                        type="button"
                      >
                        Annual
                        <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-extrabold px-1 py-0.5 rounded leading-none uppercase">
                          -38%
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <div className={`border-t pt-6 font-medium ${isLightMode ? "border-zinc-200" : "border-white/5"}`}>
                  <ul className="space-y-4">
                    {premiumFeatures.map((feat, i) => (
                      <li key={i} className={`flex gap-3 items-start text-xs font-semibold ${isLightMode ? "text-zinc-800" : "text-zinc-200"}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLightMode ? "bg-purple-100 text-purple-600 font-bold" : "bg-[#a855f7]/15 text-[#c8a2c8]"}`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="font-sans leading-tight">{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                {isPremium ? (
                  <button
                    id="tier-premium-active-btn"
                    type="button"
                    disabled
                    className={`w-full border text-xs font-semibold py-3 rounded-xl cursor-default uppercase tracking-wider text-center ${isLightMode ? "bg-zinc-100 text-zinc-400 border-zinc-200" : "bg-[#131217] text-zinc-500 border-white/[0.02]"}`}
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    id="trigger-upgrade-modal-btn"
                    type="button"
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>Upgrade to Premium</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Refund & Cancellation Policy Banner */}
          <div className={`pt-10 border-t text-center mt-12 max-w-3xl mx-auto space-y-2.5 ${isLightMode ? "border-zinc-200" : "border-white/5"}`} id="refund-policy-section">
            <h4 className={`text-[10px] font-black uppercase tracking-widest block header-policy ${isLightMode ? "text-zinc-800" : "text-white"}`}>
              REFUND & CANCELLATION POLICY
            </h4>
            <p className={`text-[11px] leading-relaxed font-sans px-6 max-w-2xl mx-auto ${isLightMode ? "text-zinc-500" : "text-zinc-500"}`}>
              <strong className={isLightMode ? "text-zinc-700" : "text-zinc-400"}>No Refunds:</strong> All subscription payments are <strong className={isLightMode ? "text-zinc-700" : "text-zinc-400"}>non-refundable</strong>. Once a billing cycle has been charged, no refunds or credits will be issued for partial months or unused features.
            </p>
          </div>
        </div>
      )}

      {/* Styled Checkout Modal overlay */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300" id="billing-gateway-overlay">
          <div className={`p-8 rounded-3xl max-w-md w-full relative space-y-6 shadow-2xl scale-[1.01] transition-transform duration-300 border ${isLightMode ? "bg-white border-zinc-200 text-zinc-900" : "bg-[#0b0b0e] border-white/10"}`} id="cc-gateway-section">
            <button 
              onClick={() => { setShowCheckout(false); setError(null); }}
              className={`absolute top-4 right-4 transition-colors cursor-pointer text-sm font-sans ${isLightMode ? "text-zinc-400 hover:text-zinc-800" : "text-zinc-500 hover:text-white"}`}
              type="button"
            >
              ✕
            </button>

            <div className="space-y-1.5 text-center">
              <div className="inline-flex p-3 bg-purple-500/10 border border-[#a855f7]/20 rounded-full text-[#c084fc] mb-1">
                {paymentMethod === "paddle" ? (
                  <Sparkles className="w-6 h-6 animate-pulse text-[#00b5d8]" />
                ) : (
                  <CreditCard className="w-6 h-6 animate-pulse" />
                )}
              </div>
              <h3 className={`text-xl font-bold font-display ${isLightMode ? "text-zinc-900" : "text-white"}`}>Upgrade to Premium</h3>
              <p className={`text-xs max-w-xs mx-auto font-sans ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>
                Choose your preferred payment method below to complete your premium upgrade.
              </p>
            </div>

            {/* Payment Method Tabs */}
            <div className={`grid grid-cols-2 p-1 rounded-xl border ${isLightMode ? "bg-zinc-100 border-zinc-200" : "bg-white/[0.03] border-white/5"}`} id="payment-method-tabs">
              <button
                type="button"
                onClick={() => { setPaymentMethod("paddle"); setError(null); }}
                className={`py-2 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === "paddle" 
                    ? "bg-purple-600 text-white shadow-md font-extrabold" 
                    : isLightMode ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-400 hover:text-white"
                }`}
              >
                Paddle Checkout
              </button>
              <button
                type="button"
                onClick={() => { setPaymentMethod("card"); setError(null); }}
                className={`py-2 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === "card" 
                    ? "bg-purple-600 text-white shadow-md font-extrabold" 
                    : isLightMode ? "text-zinc-655 hover:text-zinc-900" : "text-zinc-400 hover:text-white"
                }`}
              >
                Simulated Card
              </button>
            </div>

            {paymentMethod === "paddle" ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl text-center space-y-2 border ${
                  isLightMode ? "bg-blue-50/50 border-blue-100 text-blue-900" : "bg-blue-950/20 border-blue-900/40 text-blue-300"
                }`} id="paddle-info-panel">
                  <div className="text-2xl font-black tracking-wider text-[#00b5d8] select-none">
                    PADDLE
                  </div>
                  <p className={`text-[11px] leading-relaxed font-sans ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>
                    Authorize your premium subscription securely via official Paddle Billing popup.
                  </p>
                </div>

                {paddleConfigError && (
                  <p className="text-[10px] text-red-500 text-center font-mono font-medium">{paddleConfigError}</p>
                )}

                {!paddleConfig.priceMonthly && !paddleConfig.priceAnnual ? (
                  <div className={`p-4 rounded-xl border text-[10px] space-y-1.5 text-left leading-normal ${
                    isLightMode ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-amber-950/20 border-amber-900/40 text-amber-400"
                  }`}>
                    <p className="font-extrabold">⚠️ PADDLE CREDENTIALS NOT FOUND</p>
                    <p>Live checkouts require active Paddle Client Tokens and Price IDs in your environment configuration.</p>
                    <p className="text-zinc-500 font-sans">Switch to the <strong>Simulated Card</strong> tab above to upgrade instantly during development!</p>
                  </div>
                ) : (
                  <button
                    onClick={handlePaddleCheckout}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-mono uppercase tracking-widest text-[11px] py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer font-bold mt-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Launch Paddle Checkout</span>
                  </button>
                )}

                {/* Configuration Guide */}
                <button
                  type="button"
                  onClick={() => setShowConfigGuide(!showConfigGuide)}
                  className={`w-full text-left text-[10px] flex justify-between items-center p-2.5 rounded-lg font-mono transition-colors border ${
                    isLightMode 
                      ? "bg-purple-50/60 border-purple-100/50 text-purple-700 hover:bg-purple-105" 
                      : "bg-white/[0.02] border-white/5 text-purple-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <span>ℹ️ How to connect Paddle Billing...</span>
                  <span className="font-bold underline">{showConfigGuide ? "Hide" : "Show Guide"}</span>
                </button>

                {showConfigGuide && (
                  <div className={`p-4 rounded-xl text-[10px] space-y-2 font-mono leading-normal max-h-56 overflow-y-auto border scrollbar-thin ${
                    isLightMode ? "bg-zinc-50 border-zinc-200 text-zinc-700" : "bg-[#0b0b0d] border-white/10 text-zinc-300"
                  }`}>
                    <p className="font-bold text-amber-500">⚡ PADDLE CONFIGURATION PROTOCOL:</p>
                    <p>1. Go to <a href="https://developer.paddle.com" target="_blank" rel="noreferrer" className="text-blue-500 underline hover:text-blue-400">Paddle Dashboard</a> and log in.</p>
                    <p>2. Create a Product and two Prices (Monthly and Annual).</p>
                    <p>3. Go to Developer Settings, generate a <strong>Client Token</strong>.</p>
                    <p>4. Configure the variables inside your AI Studio **Secrets panel** or <code>.env</code> file:</p>
                    <pre className={`p-2 rounded text-[9px] select-all overflow-x-auto ${isLightMode ? "bg-zinc-100 text-zinc-800" : "bg-black/50 text-zinc-400"}`}>
{`PADDLE_CLIENT_TOKEN="your_client_token_here"
PADDLE_PRICE_MONTHLY="pri_monthly_price_id"
PADDLE_PRICE_ANNUAL="pri_annual_price_id"
PADDLE_ENVIRONMENT="sandbox"`}
                    </pre>
                    <p>5. Save secrets. The workspace updates and automatically uses the live Paddle checkout!</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCheckoutSimulate} className="space-y-4">
                <div className="space-y-3.5">
                  <div>
                    <label className={`block text-[10px] font-mono uppercase tracking-widest mb-1.5 ${isLightMode ? "text-zinc-500 font-bold" : "text-zinc-400"}`}>Cardholder Name</label>
                    <input
                      id="card-name-input"
                      type="text"
                      required
                      placeholder="e.g. Connor Roy"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className={`w-full text-xs py-2.5 px-3.5 rounded-lg focus:outline-none transition-all font-semibold font-sans resize-none border ${isLightMode ? "bg-zinc-50 border-zinc-250 text-zinc-900 focus:border-purple-500/45 focus:bg-white placeholder:text-zinc-400" : "bg-white/[0.02] border-white/5 text-slate-100 placeholder:text-zinc-655 focus:border-purple-500/40 focus:bg-white/[0.04]"}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-mono uppercase tracking-widest mb-1.5 ${isLightMode ? "text-zinc-500 font-bold" : "text-zinc-400"}`}>Card Number</label>
                    <input
                      id="card-number-input"
                      type="text"
                      required
                      maxLength={19}
                      placeholder="4242 •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className={`w-full text-xs py-2.5 px-3.5 rounded-lg focus:outline-none transition-all font-semibold font-mono border ${isLightMode ? "bg-zinc-50 border-zinc-250 text-zinc-900 focus:border-purple-500/45 focus:bg-white placeholder:text-zinc-400" : "bg-white/[0.02] border-white/5 text-slate-100 placeholder:text-zinc-655 focus:border-purple-500/40 focus:bg-white/[0.04]"}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className={`block text-[10px] font-mono uppercase tracking-widest mb-1.5 ${isLightMode ? "text-zinc-500 font-bold" : "text-zinc-400"}`}>Expiry Date</label>
                      <input
                        id="card-expiry-input"
                        type="text"
                        required
                        placeholder="MM/YY"
                        maxLength={5}
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className={`w-full text-xs py-2.5 px-3.5 rounded-lg focus:outline-none transition-all font-semibold font-mono text-center border ${isLightMode ? "bg-zinc-50 border-zinc-250 text-zinc-900 focus:border-purple-500/45 focus:bg-white placeholder:text-zinc-400" : "bg-white/[0.02] border-white/5 text-slate-100 placeholder:text-zinc-655 focus:border-purple-500/40 focus:bg-white/[0.04]"}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-mono uppercase tracking-widest mb-1.5 ${isLightMode ? "text-zinc-500 font-bold" : "text-zinc-400"}`}>CVC Code</label>
                      <input
                        id="card-cvc-input"
                        type="password"
                        required
                        maxLength={4}
                        placeholder="•••"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        className={`w-full text-xs py-2.5 px-3.5 rounded-lg focus:outline-none transition-all font-semibold font-mono text-center border ${isLightMode ? "bg-zinc-50 border-zinc-250 text-zinc-900 focus:border-purple-500/45 focus:bg-white placeholder:text-zinc-400" : "bg-white/[0.02] border-white/5 text-slate-100 placeholder:text-zinc-655 focus:border-purple-500/40 focus:bg-white/[0.04]"}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Sensitive Subscription Disclosures & Itemization */}
                <div className={`p-4 rounded-xl space-y-2 border ${isLightMode ? "bg-zinc-50 border-zinc-200 text-zinc-900" : "bg-white/[0.02] border-white/5 text-slate-100"}`} id="subscription-summary-box">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`${isLightMode ? "text-zinc-500 font-medium" : "text-zinc-400"}`}>Selected Plan:</span>
                    <span className="font-bold font-mono text-[#a855f7] uppercase tracking-wider text-[11px]">
                      Cramup Premium {billingPeriod === "monthly" ? "(Monthly)" : "(Annual)"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`${isLightMode ? "text-zinc-500 font-medium" : "text-zinc-400"}`}>Billed Rate:</span>
                    <span className="font-extrabold font-mono text-[11px]">
                      {billingPeriod === "monthly" ? "$14.99 / mo" : "$110.00 / yr (~$9.17/mo)"}
                    </span>
                  </div>
                  <div className="border-t my-2 border-dashed border-zinc-500/10" />
                  <p className={`text-[10px] leading-relaxed ${isLightMode ? "text-zinc-500 font-medium" : "text-zinc-400"}`}>
                    <strong className="text-amber-500">Auto-Renewal and Non-Refundable Disclosure:</strong> Your subscription will auto-renew automatically at the end of every active cycle. You can cancel renewal anytime with 1-click in your <strong>Settings Control Panel</strong>. No prorated refunds are issued for mid-month changes.
                  </p>
                </div>

                {error && (
                  <p className="text-[10px] text-red-500 text-center font-sans font-medium animate-pulse" id="cc-error">{error}</p>
                )}

                <button
                  id="submit-payment-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-mono uppercase tracking-widest text-[11px] py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer font-bold mt-2"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Authorize {billingPeriod === "monthly" ? "$14.99" : "$110.00"} Payment</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className={`flex items-center justify-center gap-4 text-[9px] font-mono pt-1 ${isLightMode ? "text-zinc-400" : "text-zinc-500"}`}>
              <span className="flex items-center gap-0.5"><Shield className="w-3 h-3 text-emerald-500" /> Secure SSL Server</span>
              <span>• Complete Safety</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
