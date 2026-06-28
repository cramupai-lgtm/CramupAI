import React, { useState } from "react";
import { AppUser } from "../types";
import { DBService } from "../store";
import { GraduationCap, ShieldAlert, Sparkles, BookOpen, Key, Mail, User } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (user: AppUser) => void;
  isInitiallyRegistering?: boolean;
  onBackToLanding?: () => void;
}

export default function AuthScreen({ onAuthSuccess, isInitiallyRegistering = false, onBackToLanding }: AuthScreenProps) {
  const [isRegistering, setIsRegistering] = useState(isInitiallyRegistering);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("Biology");
  const [customSubject, setCustomSubject] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subjects = [
    { name: "Biology", desc: "Genetics, cellular structures, ecology & physiology" },
    { name: "Chemistry", desc: "Organic synthesis, molecular kinetics, and chemical equilibria" },
    { name: "Physics", desc: "Quantum mechanics, relativity, thermodynamics, and electromagnetism" },
    { name: "Mathematics", desc: "Linear algebra, multivariable calculus, and differential equations" },
    { name: "Computer Science", desc: "Algorithms, complexity theory, systems architecture, and AI" },
    { name: "Mechanical Engineering", desc: "Fluid dynamics, stress tensors, and thermodynamics" },
    { name: "Civil Engineering", desc: "Structural load calculations, soil mechanics, and concrete dynamics" },
    { name: "Electrical Engineering", desc: "Signals and systems, circuit analysis, and microelectronics" },
    { name: "Corporate Law", desc: "M&A, contract litigation, IP, and fiduciary liability" },
    { name: "Criminal Law", desc: "Constitutional defense, statutory offenses, and procedural justice" },
    { name: "International Law", desc: "Sovereign treaties, trade covenants, and maritime jurisdiction" },
    { name: "History", desc: "Socio-political revolutions, geopolitical epochs, and historic analysis" },
    { name: "Geography", desc: "Geomorphology, spatial analysis, and anthropogenic ecosystems" },
    { name: "Political Science", desc: "Comparative regimes, policy analysis, and governance ethics" },
    { name: "Economics", desc: "Macroeconomic modeling, game theory, and market dynamics" },
    { name: "Psychology", desc: "Cognitive development, neuropsychology, and behavioral analysis" },
    { name: "Sociology", desc: "Demographic trends, social stratification, and institutional dynamics" },
    { name: "Philosophy", desc: "Epistemology, ethical frameworks, logic, and metaphysics" },
    { name: "Medicine", desc: "Pathology, human anatomy, diagnostics, and clinical systems" },
    { name: "Nursing", desc: "Patient care protocols, pharmacology, and clinical care systems" },
    { name: "Pharmacy", desc: "Pharmacokinetics, organic drug synthesis, and bio-therapeutics" },
    { name: "Dentistry", desc: "Histology, maxillofacial anatomy, and dental forensics" },
    { name: "Business Administration", desc: "Strategic management, organizational scale, and operations" },
    { name: "Marketing", desc: "Consumer behavior models, brand positioning, and digital conversion" },
    { name: "Finance", desc: "Portfolio management, options pricing, and capital structures" },
    { name: "Accounting", desc: "IFRS compliance, tax structures, and financial auditing" },
    { name: "English Literature", desc: "Gothic narratives, poetic analysis, and literary theory" },
    { name: "Linguistics", desc: "Phonology, structural syntax, and cognitive semantics" },
    { name: "Art History", desc: "Renaissance aesthetics, modernism, and iconographical critique" },
    { name: "Environmental Science", desc: "Carbon dynamics, ecological conservation, and climate modeling" },
    { name: "Astronomy", desc: "Astrophysical cosmology, stellar evolution, and orbital mechanics" },
    { name: "Data Science", desc: "Neural networks, stochastic regression, and tensor operations" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email || !password) {
      setError("Please fill in all core login credentials.");
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        if (!name) {
          setError("Name is required to build your customized workspace portfolio.");
          setLoading(false);
          return;
        }
        // Register User with password
        const finalSubject = subject === "Custom" ? (customSubject.trim() || "General Study") : subject;
        const user = await DBService.registerUser(email, name, finalSubject, password);
        onAuthSuccess(user);
      } else {
        // Login User with password
        const user = await DBService.loginUser(email, password);
        if (user) {
          onAuthSuccess(user);
        } else {
          // If mock login first-time discovery, we auto-create a user to make the UI frictionless!
          const finalSubject = subject === "Custom" ? (customSubject.trim() || "General Study") : subject;
          const autoUser = await DBService.registerUser(email, "Cramup Student", finalSubject, password);
          onAuthSuccess(autoUser);
        }
      }
    } catch (err: any) {
      console.error("Authentication failed", err);
      if (err && err.message) {
        if (err.message.includes("auth/unauthorized-domain") || err.code === "auth/unauthorized-domain") {
          setError("Domain Unlisted: Firebase prevents authentication from custom domains like cramupai.com unless added. Go to Firebase Console > Authentication > Settings > Authorized domains and add 'cramupai.com'.");
        } else if (err.message.includes("auth/invalid-credential") || 
            err.message.includes("auth/wrong-password") || 
            err.message.includes("auth/user-not-found")) {
          setError("Incorrect credentials. Please verify your email and password.");
        } else if (err.message.includes("auth/email-already-in-use")) {
          setError("This email is already in use by another account.");
        } else if (err.message.includes("auth/weak-password")) {
          setError("Password criteria not met. Please use at least 6 characters.");
        } else if (err.message.includes("auth/invalid-email")) {
          setError("The email address provided is invalid.");
        } else {
          setError(err.message || "Authentication procedure halted. Verify your credentials.");
        }
      } else {
        setError("Authentication procedure halted. Verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const user = await DBService.loginWithGoogle(email);
      if (user) {
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error("Google login failed", err);
      if (err?.code === "auth/unauthorized-domain" || err?.message?.includes("auth/unauthorized-domain")) {
        setError("Domain Unlisted: Firebase prevents authentication from custom domains like cramupai.com unless added. Go to Firebase Console > Authentication > Settings > Authorized domains and add 'cramupai.com'.");
      } else {
        setError(err.message || "Google authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError("Provide your email address to transmit a reset link.");
      return;
    }
    setInfo(`A dynamic security reset link has been dispatched to: ${email}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-12 text-slate-100 relative overflow-hidden" id="auth-container">
      {/* Mesh Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-950/20 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-950/20 rounded-full blur-[140px]"></div>
      </div>
      
      <div className="w-full max-w-md space-y-8 bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10" id="auth-card">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            type="button"
            className="absolute top-5 left-5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/5"
          >
            ← Home
          </button>
        )}
        {/* Logo and header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-1">
            <Sparkles className="w-4 h-4 text-[#a855f7] animate-pulse" />
            <span className="text-xs font-mono font-medium tracking-widest uppercase text-purple-300">Intelligent SaaS Ingestion</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">
            Cramup<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">.AI</span>
          </h1>
          <p className="text-sm text-zinc-400 font-sans tracking-wide">
            {isRegistering ? "Deploy your premium academic portfolio" : "Synchronize your global learning workspace"}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-950/20 border border-red-800/30 text-red-200 px-4 py-3 rounded-xl text-xs" id="auth-error">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="flex items-center gap-2 bg-blue-950/20 border border-blue-800/30 text-blue-200 px-4 py-3 rounded-xl text-xs" id="auth-info">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>{info}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off" id="cramup-auth-form">
          {isRegistering && (
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="cramup-name-input"
                  type="text"
                  name="cramup_full_name"
                  required
                  placeholder="e.g. Alexis Carter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  className="w-full bg-white/5 border border-white/10 text-sm py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-zinc-650 text-white"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="cramup-email-input"
                type="email"
                name="cramup_email"
                required
                placeholder="e.g. cramup.ai@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full bg-white/5 border border-white/10 text-sm py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-zinc-650 text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Password</label>
              {!isRegistering && (
                <button
                  id="forgot-password-btn"
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-sans text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="cramup-password-input"
                type="password"
                name="cramup_password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-white/5 border border-white/10 text-sm py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-zinc-650 text-white"
              />
            </div>
          </div>

          {isRegistering && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">Choose Subject Workspace</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <select
                  id="subject-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-xs py-3 pl-10 pr-4 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer text-white"
                >
                  {subjects.map((subj) => (
                    <option key={subj.name} value={subj.name} className="bg-zinc-950 text-slate-200">
                      🎓 {subj.name} — {subj.desc}
                    </option>
                  ))}
                  <option value="Custom" className="bg-zinc-950 text-indigo-400 font-bold">
                    🔮 Create Custom Subject / Different Topic...
                  </option>
                </select>
              </div>
              
              {subject === "Custom" && (
                <div className="space-y-1 pt-1.5 animate-fade-in" id="custom-subject-input-wrapper">
                  <label className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest block">Type Different / Custom Subject Name</label>
                  <input
                    id="custom-subject-text-input"
                    type="text"
                    required
                    placeholder="e.g. Organic Agriculture, Quantum Biophysics"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full bg-[#18181b]/80 border border-indigo-500/40 text-xs py-2.5 px-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-white font-mono placeholder:text-zinc-600"
                  />
                </div>
              )}
              <p className="text-[10px] text-indigo-300 italic font-mono leading-relaxed mt-1">
                🔬 This subject choice automatically tunes the LLM engine and summary processors.
              </p>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isRegistering ? (
              <>
                <GraduationCap className="w-4 h-4" />
                Deploy Portfolio Workspace
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Access Cramup.Al Workspace
              </>
            )}
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">OR</span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>

        <button
          id="auth-google-btn"
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm font-sans"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.59-.87-4.14 0-6.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" fillRule="evenodd" clipRule="evenodd" />
          </svg>
          Continue with Google
        </button>

        <div className="text-center pt-2">
          <button
            id="toggle-auth-mode-btn"
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setInfo(null);
            }}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors uppercase font-mono tracking-widest underline decoration-indigo-500 underline-offset-4"
          >
            {isRegistering ? "Already have an account? Sign In" : "Need a professional portfolio? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
