import React, { useState } from "react";
import { 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  Mail, 
  HelpCircle,
  ExternalLink,
  BookOpen,
  ArrowLeft
} from "lucide-react";

interface LegalHubPageProps {
  isLightMode: boolean;
  onBackToDashboard?: () => void;
}

type ActivePolicyTab = "terms" | "privacy" | "refunds";

export default function LegalHubPage({ isLightMode, onBackToDashboard }: LegalHubPageProps) {
  const [activeTab, setActiveTab] = useState<ActivePolicyTab>("terms");

  return (
    <div className="max-w-4xl mx-auto w-full px-2 sm:px-6 py-4 space-y-6" id="legal-hub-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/50 pb-5" id="legal-hub-header">
        <div className="space-y-1">
          <h1 className={`text-3xl font-extrabold tracking-tight font-display ${isLightMode ? "text-zinc-950" : "text-white"}`}>
            Legal & Policies
          </h1>
          <p className={`text-xs sm:text-sm font-sans ${isLightMode ? "text-zinc-550" : "text-zinc-400"}`}>
            Review CramUp.AI compliance protocols, billing terms, and student data protection standards.
          </p>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
              isLightMode 
                ? "bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-50" 
                : "bg-zinc-900 border-white/5 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
        )}
      </div>

      {/* Notion/Stark-White design style: Clean, distraction-free layout with central floating document canvas panel */}
      <div className={`rounded-2xl border transition-all shadow-xl overflow-hidden ${
        isLightMode 
          ? "bg-zinc-100/90 border-zinc-200/80" 
          : "bg-[#0b0a0e]/90 border-white/5"
      }`} id="legal-canvas-outer">
        
        {/* Navigation Tabs Bar: Crisp horizontal sub-tab menu bar at top of the canvas page */}
        <div className={`border-b px-4 py-3 flex flex-wrap gap-2 items-center justify-center sm:justify-start ${
          isLightMode ? "bg-white border-zinc-200" : "bg-[#0e0d12] border-white/10"
        }`} id="legal-tabs-bar">
          <button
            id="tab-terms"
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all cursor-pointer ${
              activeTab === "terms"
                ? isLightMode
                  ? "bg-zinc-950 text-white shadow-md shadow-zinc-950/10"
                  : "bg-white text-zinc-950 shadow-md"
                : isLightMode
                  ? "text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Terms & Conditions
          </button>

          <button
            id="tab-privacy"
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all cursor-pointer ${
              activeTab === "privacy"
                ? isLightMode
                  ? "bg-zinc-950 text-white shadow-md shadow-zinc-950/10"
                  : "bg-white text-zinc-950 shadow-md"
                : isLightMode
                  ? "text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy Policy
          </button>

          <button
            id="tab-refunds"
            type="button"
            onClick={() => setActiveTab("refunds")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all cursor-pointer ${
              activeTab === "refunds"
                ? isLightMode
                  ? "bg-zinc-950 text-white shadow-md shadow-zinc-950/10"
                  : "bg-white text-zinc-950 shadow-md"
                : isLightMode
                  ? "text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Refund & Cancellation
          </button>
        </div>

        {/* Central Floating Document Canvas Panel - styled to look crisp like a clean Notion document */}
        <div className={`p-6 sm:p-10 transition-all font-sans ${
          isLightMode 
            ? "bg-white text-zinc-800" 
            : "bg-[#09090b] text-zinc-300"
        }`} id="document-canvas">
          
          {/* TERMS & CONDITIONS POLICY */}
          {activeTab === "terms" && (
            <article className="space-y-6 animate-fade-in" id="policy-terms-content">
              <header className="border-b border-zinc-100 dark:border-white/[0.05] pb-4">
                <div className="flex items-center gap-2 text-[#7c3aed] font-semibold text-xs tracking-widest font-mono uppercase">
                  <span>Policy Document</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]/40" />
                  <span>Effective 2026</span>
                </div>
                <h2 className={`text-2xl font-extrabold tracking-tight mt-2 ${isLightMode ? "text-zinc-950" : "text-white"}`}>
                  Terms & Conditions
                </h2>
              </header>

              <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
                <section className="space-y-2">
                  <h3 className={`text-sm font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    1. Educational Service Model
                  </h3>
                  <p>
                    CramUp.AI is owned and operated as a high-fidelity, monthly subscription-based <strong>Educational Technology software service ("SaaS")</strong>. We build advanced cloud synthesis models capable of instigating audio, transcriptions, text logs, and PDFs into customized student study frameworks, interactive practice exams, and digital memory-refresh cards.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className={`text-sm font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    2. Recurring Monthly Billing Structure
                  </h3>
                  <p>
                    By initiating an upgrade to any Premium subscription tier on CramUp.AI, users explicitly agree and consent to are billed on a <strong>recurring monthly billing cycle</strong> starting on the calendar day of upgrade. Subscription charges occur automatically every month to prevent student workspace deactivation or loss of historic studies.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className={`text-sm font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    3. Auto-Renewal Toggle Controls
                  </h3>
                  <p>
                    To secure maximum autonomy and guarantee against unexpected school fees, CramUp.AI provides state-of-the-art billing transparency. subscriptions auto-renew by default. However, students maintain absolute control over their accounts and have seamless access to the <strong>"Auto-Renewal Toggle (ON/OFF)"</strong> switch located centrally within their Account Settings page.
                  </p>
                  <p className="bg-purple-500/5 border border-purple-500/10 p-3 rounded-xl text-xs">
                    <strong>Cancellation Trigger:</strong> Flicking the Auto-Renewal Toggle to "OFF" immediately commands our billing gateways (including Stripe, PayHere, and credit networks) to halt all subsequent monthly charges. No further action is required, and your plan will terminate cleanly at the end of the current paid billing cycle.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className={`text-sm font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    4. Intellectual Property & Material Upload Rules
                  </h3>
                  <p>
                    University students remain fully responsible for the materials they submit using our study hub. Users must own or hold the clear legal/license rights to any physical study assets (such as university lecture audio recordings, PDF notes, reference classroom videos, slides, or textbook captures) uploaded into CramUp.AI for artificial intelligence analysis.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className={`text-sm font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    5. Safe & Responsible Class Protocols
                  </h3>
                  <p>
                    CramUp.AI delivers materials strictly for independent study, preparation, and diagnostic assistance. Students must not utilize the platform's generation tools to commit academic dishonesty or breach external Honor Codes.
                  </p>
                </section>
              </div>
            </article>
          )}

          {/* PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <article className="space-y-6 animate-fade-in" id="policy-privacy-content">
              <header className="border-b border-zinc-100 dark:border-white/[0.05] pb-4">
                <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs tracking-widest font-mono uppercase">
                  <span>Confidential Blueprint</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                  <span>ISO Standards Secure</span>
                </div>
                <h2 className={`text-2xl font-extrabold tracking-tight mt-2 ${isLightMode ? "text-zinc-950" : "text-white"}`}>
                  Privacy Policy
                </h2>
              </header>

              <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
                <section className="space-y-2">
                  <h3 className={`text-sm font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    1. Data Segregation & Student Records
                  </h3>
                  <p>
                    CramUp.AI takes student confidentiality with extreme seriousness. All registration credentials, including names, active academic majors, display preferences, and email addresses, are stored strictly on segregated, securely partitioned cloud databases. This records metadata is shielded from index crawlers and unauthorized external queries.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className={`text-sm font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    2. Uploaded Media Security & Isolation
                  </h3>
                  <p>
                    For active processing of classroom whiteboards, student scratchpads, text notes, lecture audio tapes, and study guides, files are isolation-queued. Uploads are strictly utilized to programmatically generate study sheets, digital flashcards, and simulated quizzes within your private hub. Once processing completes, your metadata is compiled in memory and kept isolated in secure cloud environments.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className={`text-sm font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    3. Anti-Commercialization and No-Trade Mandate
                  </h3>
                  <p className="border-l-2 border-emerald-500 pl-3 italic font-medium">
                    "Under no circumstances does CramUp.AI sell, lease, transfer, lend, or syndicate student registration records, files, or synthesized documents to high-frequency advertisers, commercial marketers, third-party brokers, or content scraping firms."
                  </p>
                  <p>
                    All study insights belong completely to the student. We maintain a non-compromisable wall of security regarding academic data. We only interface with necessary, verified service endpoints (like payment processors and backend cloud computing nodes) to serve the essential requirements of the app.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className={`text-sm font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    4. Security Encryption and Retention Limits
                  </h3>
                  <p>
                    All data traveling to and from our browser environment is secured using modern TLS 1.3 encryption protocols. Users may choose to manually wipe upload caches, generated study materials, files, or complete user accounts at any stage to achieve absolute digital erasure.
                  </p>
                </section>
              </div>
            </article>
          )}

          {/* REFUND & CANCELLATION POLICY */}
          {activeTab === "refunds" && (
            <article className="space-y-6 animate-fade-in" id="policy-refunds-content">
              <header className="border-b border-zinc-100 dark:border-white/[0.05] pb-4">
                <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs tracking-widest font-mono uppercase">
                  <span>Merchant Compliance</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500/40" />
                  <span>Chargeback Defence Protocols</span>
                </div>
                <h2 className={`text-2xl font-extrabold tracking-tight mt-2 ${isLightMode ? "text-zinc-950" : "text-white"}`}>
                  Refund & Cancellation Policy
                </h2>
              </header>

              <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
                <section className="space-y-2">
                  <h3 className={`text-rose-500 text-sm font-black tracking-tight uppercase flex items-center gap-1.5`}>
                    ⚠️ Strict No-Refund Policy
                  </h3>
                  <p className="font-semibold text-[#8b5cf6] dark:text-[#c084fc]">
                    CramUp.AI maintains an absolute and unequivocal NO REFUNDS policy for all payments and monthly renewal fees.
                  </p>
                  <p>
                    Because subscription upgrades instantly provision specialized web hosting capacity, cloud computing server virtual containers, and high-cost tokenized cognitive engines that process resource-intensive materials (such as lecture audios and PDFs up to <span className="font-mono font-bold text-rose-400">250MB</span>), we cannot offer refunds once a payment has processed. 
                  </p>
                  <p>
                    All billing sales are final. We do not provide prorated credits or partial refunds for unused days or unspent study limits should a user experience a mid-month change of mind.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className={`text-sm font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    2. Cancel Anytime - Zero Interruption Fees
                  </h3>
                  <p>
                    Students possess a sovereign right to cancel their premium plans at any second. There are absolutely <strong>zero minimum contracts, hidden activation hooks, administrative penalties, or termination fees</strong>. You can instantly stop future renewals by navigating to the Settings panel and setting the Auto-Renewal Toggle to "OFF" or clicking "Cancel Plan".
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className={`text-sm font-bold tracking-tight ${isLightMode ? "text-zinc-900" : "text-white"}`}>
                    3. Effect of Cancellation - Graceful Downgrades
                  </h3>
                  <p>
                    When a cancel operation or toggle renewal toggle is triggered off, your Premium membership status does not immediately break. You will continue to hold and enjoy <strong>unrestricted, prioritized Premium workspace benefits</strong> (including large upload limits, swift speech processing, and quiz creation) until the absolute final day of your current paid billing period.
                  </p>
                  <p>
                    Upon the conclusion of that paid month, your profile will gracefully downgrade to our Free tier with no subsequent charges, ever. Your historic notes will remain saved in cold database libraries.
                  </p>
                </section>
              </div>
            </article>
          )}

          {/* Visibility Footer Note: Small alert banner styled in a soft blue highlight callout box at bottom of page */}
          <div className="mt-8 pt-6 border-t border-zinc-200/50 dark:border-white/[0.05]" id="legal-footer-wrapper">
            <div className={`p-4 rounded-xl flex items-center gap-3.5 border transition-all ${
              isLightMode 
                ? "bg-blue-50 border-blue-200 text-blue-900" 
                : "bg-blue-500/5 border-blue-500/20 text-blue-300"
            }`} id="legal-alert-callout">
              <Mail className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="text-xs font-medium space-y-0.5">
                <span className="block font-bold">Billing or Privacy Inquiry?</span>
                <p className="opacity-90">
                  Have a billing or data question before you hit the books? Contact our support team directly at <a href="mailto:support@cramup.ai" className="font-semibold underline hover:text-blue-500 dark:hover:text-blue-400">support@cramup.ai</a> for quick help.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
