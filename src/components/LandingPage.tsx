import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  FileText, 
  Video, 
  Music, 
  Image as ImageIcon, 
  BrainCircuit, 
  GraduationCap, 
  ArrowRight, 
  BookOpen, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  Sun, 
  Moon, 
  CheckCircle,
  HelpCircle,
  ArrowBigRightDash,
  Zap,
  RotateCw,
  FolderOpen,
  Check,
  X
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: (isRegistering: boolean) => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
}

export default function LandingPage({ onGetStarted, isLightMode, onToggleTheme }: LandingPageProps) {
  const [activePreviewTab, setActivePreviewTab] = useState<"ingest" | "flashcard" | "quiz" | "chat">("ingest");
  const [cardFlipped, setCardFlipped] = useState<boolean>(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [landingBillingPeriod, setLandingBillingPeriod] = useState<"monthly" | "annual">("monthly");

  // Quick stats to show scale and value
  const stats = [
    { label: "AI Processors", value: "Gemini 3.5 Flash Verified", icon: BrainCircuit },
    { label: "Active Subjects Supported", value: "34+ Classic & Custom", icon: GraduationCap },
    { label: "Format Coverages", value: "All Unified Formats", icon: FolderOpen },
  ];

  return (
    <div className={`min-h-screen relative overflow-hidden font-sans transition-colors duration-300 ${
      isLightMode ? "bg-zinc-50 text-zinc-900" : "bg-[#050505] text-slate-100"
    }`} id="landing-page-viewport">
      
      {/* Decorative Blur Spheres */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {isLightMode ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/30 rounded-full blur-[140px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-100/30 rounded-full blur-[140px]" />
            <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] bg-pink-100/15 rounded-full blur-[120px]" />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[65%] h-[65%] bg-indigo-950/20 rounded-full blur-[160px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[65%] h-[65%] bg-purple-950/20 rounded-full blur-[160px]" />
            <div className="absolute top-[45%] left-[50%] w-[40%] h-[40%] bg-pink-950/5 rounded-full blur-[140px]" />
          </>
        )}
      </div>

      {/* Navigation Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-200 ${
        isLightMode ? "border-zinc-200 bg-white/70" : "border-white/5 bg-[#050505]/70"
      }`} id="landing-navbar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="text-xl font-extrabold tracking-tight font-display">
              Cramup<span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">.AI</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              type="button"
              className={`p-2 rounded-xl border transition-all hover:scale-105 ${
                isLightMode ? "bg-white border-zinc-200 text-zinc-700 shadow-sm" : "bg-white/5 border-white/5 text-zinc-350"
              }`}
              title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-purple-300" />}
            </button>

            {/* Login button */}
            <button
              onClick={() => onGetStarted(false)}
              className={`text-xs font-semibold uppercase tracking-wider font-mono hover:underline px-3.5 py-2 transition-colors ${
                isLightMode ? "text-zinc-600 hover:text-zinc-950" : "text-zinc-400 hover:text-white"
              }`}
              type="button"
            >
              Sign In
            </button>

            {/* CTA Register button */}
            <button
              onClick={() => onGetStarted(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
              type="button"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 md:pt-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Texts */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide text-indigo-400">
                <Zap className="w-3.5 h-3.5 animate-bounce" />
                <span>Study Smarter, Not Harder</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide text-[#a855f7]">
                <Sparkles className="w-3.5 h-3.5 text-[#a855f7] animate-pulse" />
                 <span>Powered by Gemini 3.5 Flash</span>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-display leading-[1.1]">
              Master any subject.<br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Summarize & learn instantly.
              </span>
            </h1>
            
            <p className={`text-base sm:text-lg leading-relaxed max-w-xl font-sans ${
              isLightMode ? "text-zinc-650" : "text-zinc-400"
            }`}>
              Upload documents, books, lectures, notes, educational audio, videos, or screenshots. Get precise AI-powered summaries, spaced-repetition flashcards, adaptive quizzes, and a 24/7 subject copilot in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                onClick={() => onGetStarted(true)}
                className="bg-gradient-to-r from-indigo-500 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white font-bold py-3.5 px-7 rounded-2xl shadow-xl shadow-indigo-950/20 flex items-center justify-center gap-2.5 cursor-pointer text-sm group transition-transform active:scale-98"
                type="button"
              >
                Assemble Workspace
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>

              <button
                onClick={() => onGetStarted(false)}
                className={`border py-3.5 px-6 rounded-2xl text-sm font-semibold transition-all text-center flex items-center justify-center gap-2 ${
                  isLightMode 
                    ? "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100 shadow-sm" 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/25"
                }`}
                type="button"
              >
                Access System
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-dashed border-white/10 md:pt-10">
              {stats.map((st, idx) => {
                const Icon = st.icon;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-purple-400" />
                      <span className={`text-[10px] uppercase tracking-wider font-mono ${isLightMode ? "text-zinc-550" : "text-zinc-500"}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className={`text-xs font-black font-sans leading-tight ${isLightMode ? "text-zinc-800" : "text-zinc-200"}`}>
                      {st.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Live Interactive Mock Dashboard */}
          <div className="lg:col-span-5 relative">
            <div className={`p-1.5 rounded-[32px] border shadow-2xl relative transition-all duration-300 ${
              isLightMode 
                ? "bg-white border-zinc-200/80 shadow-zinc-300/40" 
                : "bg-zinc-950/80 border-white/10 shadow-zinc-950/80"
            }`}>
              
              {/* Decorative side accent lines */}
              <div className="absolute -top-3 -right-3 w-20 h-20 bg-gradient-to-tr from-purple-500/20 to-fuchsia-500/25 blur-xl -z-10" />
              
              <div className={`rounded-[26px] p-5 overflow-hidden transition-all relative ${
                isLightMode ? "bg-zinc-50" : "bg-[#0d0d12]"
              }`}>
                {/* Header Mock */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  </div>
                  <span className={`text-[10px] font-mono tracking-widest uppercase ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>
                    ⚡ Interactive Study Preview
                  </span>
                </div>

                {/* Dashboard Tab Toggles */}
                <div className="flex bg-[#121216]/5 border border-white/5 rounded-xl p-1 my-4 gap-1">
                  {(["ingest", "flashcard", "quiz", "chat"] as const).map((tab) => {
                    const label = tab.charAt(0).toUpperCase() + tab.slice(1);
                    const isActive = activePreviewTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          setActivePreviewTab(tab);
                          setCardFlipped(false);
                          setSelectedQuizOption(null);
                        }}
                        type="button"
                        className={`flex-1 text-[10px] font-bold font-sans py-1.5 px-1 rounded-lg transition-all ${
                          isActive 
                            ? "bg-indigo-600 text-white shadow-sm" 
                            : (isLightMode ? "text-zinc-550 hover:bg-zinc-200/50" : "text-zinc-400 hover:bg-white/[0.03]")
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content area */}
                <div className="h-56 flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    
                    {/* INGEST PREVIEW */}
                    {activePreviewTab === "ingest" && (
                      <motion.div
                        key="ingest"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4 flex flex-col justify-center h-full pb-2"
                      >
                        <div className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2.5 transition-all ${
                          isLightMode ? "border-zinc-300 bg-white hover:border-indigo-500" : "border-white/10 bg-white/[0.01] hover:border-indigo-500/50"
                        }`}>
                          <div className="relative">
                            <FileText className="w-8 h-8 text-rose-400" />
                            <Video className="w-5 h-5 text-blue-400 absolute -bottom-1 -right-1 bg-[#0d0d12]/90 rounded-md p-0.5" />
                          </div>
                          <div>
                            <p className={`text-xs font-semibold ${isLightMode ? "text-zinc-800" : "text-zinc-200"}`}>
                              Click to select or drop files
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">
                              Supports PDF, Word, MP4 lectures, images, audio & more.
                            </p>
                          </div>
                        </div>

                        {/* Simulate upload preview */}
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-mono ${
                          isLightMode ? "bg-white border-zinc-200" : "bg-[#18181f] border-white/5"
                        }`}>
                          <span className="truncate max-w-[150px] text-zinc-400">📝 Biology_Genetics_Lecture.pdf</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Ready
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* FLASHCARD PREVIEW */}
                    {activePreviewTab === "flashcard" && (
                      <motion.div
                        key="flashcard"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center justify-center h-full py-2 space-y-3"
                      >
                        {/* Interactive Click card to flip */}
                        <div 
                          onClick={() => setCardFlipped(!cardFlipped)}
                          className="w-full max-w-sm h-36 perspective-1000 cursor-pointer group"
                        >
                          <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${
                            cardFlipped ? "rotate-y-180" : ""
                          }`}>
                            {/* Front Side */}
                            <div className={`absolute inset-0 backface-hidden p-4 rounded-xl border flex flex-col justify-between ${
                              isLightMode ? "bg-white border-zinc-200" : "bg-[#16161f] border-indigo-500/20"
                            }`}>
                              <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                                Question (Click to flip)
                              </span>
                              <p className={`text-xs sm:text-sm font-semibold tracking-wide text-center pt-2 select-none ${
                                isLightMode ? "text-zinc-800" : "text-white"
                              }`}>
                                What is the exact primary function of the ribosome inside human eukaryotic cells?
                              </p>
                              <div className="flex justify-end">
                                <RotateCw className="w-3.5 h-3.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                              </div>
                            </div>

                            {/* Back Side */}
                            <div className={`absolute inset-0 backface-hidden rotate-y-180 p-4 rounded-xl border flex flex-col justify-between ${
                              isLightMode ? "bg-indigo-50/50 border-indigo-200" : "bg-[#111116] border-purple-500/30"
                            }`}>
                              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                                Verified AI Solution
                              </span>
                              <p className={`text-xs text-center leading-relaxed font-sans pt-1 select-none ${
                                isLightMode ? "text-zinc-700" : "text-zinc-300"
                              }`}>
                                Ribosomes synthesize proteins by translating messenger RNA (mRNA) nucleotide sequences into specific chains of amino acids.
                              </p>
                              <span className="text-[9px] font-mono text-zinc-500 text-right">
                                Spaced-Repetition Active
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* QUIZ MCQS */}
                    {activePreviewTab === "quiz" && (
                      <motion.div
                        key="quiz"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col justify-center h-full py-1 space-y-2.5"
                      >
                        <h4 className={`text-xs font-semibold ${isLightMode ? "text-zinc-800" : "text-zinc-200"}`}>
                          Check your understanding: Identify the correct statement regarding cell mitochondria.
                        </h4>

                        <div className="space-y-1.5">
                          {[
                            "They synthesize cellular proteins.",
                            "They generate energy via ATP synthesis.",
                            "They encapsulate DNA inside cell nucleosome structures."
                          ].map((ans, idx) => {
                            const isSelected = selectedQuizOption === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedQuizOption(idx)}
                                type="button"
                                className={`w-full text-left p-2 rounded-lg text-xs font-sans transition-all border ${
                                  isSelected 
                                    ? (idx === 1 
                                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold" 
                                        : "bg-red-500/20 border-red-500 text-red-300")
                                    : (isLightMode 
                                        ? "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100" 
                                        : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.04]")
                                }`}
                              >
                                <span className="font-mono font-bold mr-1.5">{idx === 0 ? "A" : idx === 1 ? "B" : "C"}.</span>
                                {ans}
                                {isSelected && idx === 1 && <span className="float-right text-emerald-400 text-[10px] font-mono">✓ Correct</span>}
                                {isSelected && idx !== 1 && <span className="float-right text-red-400 text-[10px] font-mono">✗ Wrong</span>}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* CHAT PREVIEW */}
                    {activePreviewTab === "chat" && (
                      <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col justify-between h-full py-2 space-y-2.5"
                      >
                        <div className="space-y-2 flex-grow overflow-y-auto max-h-[140px] pr-1">
                          {/* User Msg */}
                          <div className="flex justify-end">
                            <p className="bg-indigo-600 text-white text-[10px] py-1 px-2.5 rounded-2xl rounded-tr-none max-w-[80%] font-sans">
                              Could you list the key phases of Mitosis shown in Section 2?
                            </p>
                          </div>
                          {/* AI Response Msg */}
                          <div className="flex justify-start">
                            <div className={`p-2 rounded-2xl rounded-tl-none max-w-[85%] text-[10px] leading-relaxed border flex gap-1.5 ${
                              isLightMode ? "bg-white border-zinc-200 text-zinc-700" : "bg-[#18181f] border-zinc-800 text-slate-300"
                            }`}>
                              <MessageSquare className="w-3 h-3 text-[#a855f7] shrink-0 mt-0.5" />
                              <p className="font-mono">
                                Based on your lecture file, Mitosis has 4 main phases: <b className="text-white">Prophase</b>, <b className="text-white">Metaphase</b>, <b className="text-white">Anaphase</b>, and <b className="text-white">Telophase</b>.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Input Box Mock */}
                        <div className={`rounded-xl border p-1 flex items-center justify-between text-[10px] ${
                          isLightMode ? "bg-white border-zinc-200" : "bg-black/50 border-white/5"
                        }`}>
                          <span className="text-zinc-500 pl-2">Ask your document study guide anything...</span>
                          <button className="bg-indigo-600 rounded-lg p-1 text-white shrink-0" type="button">
                            <ArrowBigRightDash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Bento Showcase Grid */}
      <section className={`py-16 md:py-24 border-t relative z-10 transition-colors ${
        isLightMode ? "border-zinc-200 bg-white" : "border-white/5 bg-[#08080c]"
      }`} id="features-bento">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3.5 mb-14 md:mb-20">
            <h2 className="text-3xl font-extrabold tracking-tight font-display">
              Unrivaled Academic Ingestion Capabilities
            </h2>
            <p className={`text-sm leading-relaxed ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>
              Ditch passive rereading. Ingest textbook segments, research documents, lecture slides, video tutorials, audio records, or equations and construct active study elements automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Bento 1: Document Upload */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
              isLightMode ? "bg-zinc-50 border-zinc-200 shadow-sm" : "bg-white/5 border-white/10"
            }`}>
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-sans">Omni-Format Document Support</h3>
                <p className={`text-xs leading-relaxed ${isLightMode ? "text-zinc-650" : "text-zinc-400"}`}>
                  Upload standard PDF, DOCX, PPTX presentations, markdown notes, text files, EPUB, or Excel sheets. Our high-fidelity ingestion parser decodes visual hierarchies and equations instantly.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-mono text-rose-400 font-bold">100% Client-Safe Sandboxed Ingestion</div>
            </div>

            {/* Bento 2: Video Lectures */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
              isLightMode ? "bg-zinc-50 border-zinc-200 shadow-sm" : "bg-white/5 border-white/10"
            }`}>
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-sans">Multi-Media lecture transcribes</h3>
                <p className={`text-xs leading-relaxed ${isLightMode ? "text-zinc-550" : "text-zinc-400"}`}>
                  Paste a YouTube lecture link, upload massive MP4 classroom videos, or record lectures on the fly. Extract concepts from the spoken audio or visual timeline context with complete accuracy.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-mono text-blue-400 font-bold">Time-Stamped structural index creation</div>
            </div>

            {/* Bento 3: Study Audio */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
              isLightMode ? "bg-zinc-50 border-zinc-200 shadow-sm" : "bg-white/5 border-white/10"
            }`}>
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <Music className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-sans">Ears-On Audio summaries</h3>
                <p className={`text-xs leading-relaxed ${isLightMode ? "text-zinc-550" : "text-zinc-400"}`}>
                  Ingest MP3, M4A, WAV notes, voice memos, podcasts, or lecture audios. Our advanced translation engine produces structural outlines and summaries, letting you study while driving or walking.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-mono text-emerald-400 font-bold">Spoken semantic audio transcription</div>
            </div>

            {/* Bento 4: Spaced-Repetition flashcards */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
              isLightMode ? "bg-zinc-50 border-zinc-200 shadow-sm" : "bg-white/5 border-white/10"
            }`}>
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-sans">Anki-Inspired Smart Flashcards</h3>
                <p className={`text-xs leading-relaxed ${isLightMode ? "text-zinc-550" : "text-zinc-400"}`}>
                  Synthesize key definitions, core equations, and formulas into elegant cards. Filter dynamic card statuses based on comfort level to concentrate on difficult formulas.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-mono text-purple-400 font-bold">Comfort level filtering indices is live</div>
            </div>

            {/* Bento 5: Interactive test checks */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
              isLightMode ? "bg-zinc-50 border-zinc-200 shadow-sm" : "bg-white/5 border-white/10"
            }`}>
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-sans">Multi-Format practice exams</h3>
                <p className={`text-xs leading-relaxed ${isLightMode ? "text-zinc-550" : "text-zinc-400"}`}>
                  Check your true understanding level! Instantly generate multiple-choice, fill-in-the-blank, or complex short-answer questions. Get clear grade breakdowns and instant text correction feedback.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-mono text-indigo-400 font-bold">Personalized retention metrics tracker</div>
            </div>

            {/* Bento 6: Subject Tuning Customizer */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
              isLightMode ? "bg-zinc-50 border-zinc-200 shadow-sm" : "bg-white/5 border-white/10"
            }`}>
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-sans">Custom subject contextualization</h3>
                <p className={`text-xs leading-relaxed ${isLightMode ? "text-zinc-550" : "text-zinc-400"}`}>
                  Configure classic subject paths like Biology, Corporate Law, Quantum Electrodynamics, or enter your own custom subject name! The LLM automatically tunes its prompt context to speak your field's vocabulary.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-mono text-amber-400 font-bold">Dynamic context tuning system</div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Peek Block */}
      <section className={`py-16 md:py-20 border-t transition-all ${
        isLightMode ? "border-zinc-200 bg-zinc-100/50" : "border-white/5 bg-[#050508]"
      }`} id="landing-pricing">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-10">
          <div className="space-y-3 max-w-lg mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight font-display">A Account Tier Fit For Everyone</h2>
            <p className={`text-sm ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>
              Start studying for free with essential access, or purchase Premium for unhindered ingestion scales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch text-left">
            
            {/* Free Tier card */}
            <div className={`p-8 rounded-3xl border transition-all flex flex-col justify-between relative ${
              isLightMode ? "bg-white border-zinc-200 shadow-lg" : "bg-[#0d0d12]/95 border-white/5"
            }`}>
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase">Standard tier</span>
                  <h3 className="text-2xl font-bold font-display mt-1">Free Sandbox</h3>
                </div>
                <div className="text-4xl font-extrabold tracking-tight font-display">
                  $0 <span className="text-xs font-sans font-normal text-zinc-500">/ forever</span>
                </div>
                <ul className="space-y-3.5 text-xs">
                  {[
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
                  ].map((feat, i) => (
                    <li key={i} className={`flex gap-3 items-start ${feat.active ? (isLightMode ? "text-zinc-700 font-medium" : "text-zinc-300") : "text-zinc-500 opacity-45 select-none"}`}>
                      {feat.active ? (
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLightMode ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/10 text-emerald-400"}`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLightMode ? "bg-zinc-100 text-zinc-400 border border-zinc-200" : "bg-zinc-900 text-zinc-600"}`}>
                          <X className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <span className="font-sans leading-tight">{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => onGetStarted(true)}
                className={`w-full py-3 rounded-xl mt-8 text-xs font-bold font-sans transition-all cursor-pointer ${
                  isLightMode 
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-805" 
                    : "bg-white/5 hover:bg-white/10 text-white"
                }`}
                type="button"
              >
                Sign Up Instantly
              </button>
            </div>

            {/* Premium Tier card */}
            <div className={`p-8 rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden ${
              isLightMode 
                ? "bg-indigo-600 border-indigo-700 text-white shadow-xl shadow-indigo-600/10" 
                : "bg-gradient-to-tr from-[#13112a] via-[#110d21] to-[#25103c] border-indigo-500/30"
            }`}>
              {/* Premium Floating Ring */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl -z-1" />

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${isLightMode ? "text-indigo-200" : "text-purple-300"}`}>Unlimited access</span>
                    <h3 className="text-2xl font-bold font-display mt-0.5">Premium Workspace</h3>
                  </div>
                  <span className="bg-amber-400 text-zinc-950 text-[9px] font-bold tracking-widest uppercase py-1 px-2.5 rounded-full shadow font-mono font-bold">
                    Popular
                  </span>
                </div>
                <div className="text-4xl font-extrabold tracking-tight font-display">
                  {landingBillingPeriod === "monthly" ? "$14.99" : "$110"} <span className={`text-xs font-sans font-normal ${isLightMode ? "text-indigo-200" : "text-zinc-400"}`}>/ {landingBillingPeriod === "monthly" ? "monthly billing" : "annual billing (~$9.17/mo)"}</span>
                </div>

                {/* Billing Cycle Toggle INSIDE card */}
                <div className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl bg-white/10 border border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Billing Cycle:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setLandingBillingPeriod("monthly")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all duration-150 ${landingBillingPeriod === "monthly" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-300 hover:text-white"}`}
                      type="button"
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setLandingBillingPeriod("annual")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 ${landingBillingPeriod === "annual" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-300 hover:text-white"}`}
                      type="button"
                    >
                      Annual
                      <span className="bg-emerald-500 text-white text-[8px] font-extrabold px-1 py-0.5 rounded leading-none uppercase">
                        -38%
                      </span>
                    </button>
                  </div>
                </div>
                <ul className="space-y-3.5 text-xs">
                  {[
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
                  ].map((feat, i) => (
                    <li key={i} className={`flex gap-3 items-start ${isLightMode ? "text-white font-medium" : "text-zinc-200"}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLightMode ? "bg-white/20 text-white" : "bg-[#a855f7]/15 text-[#c8a2c8]"}`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="font-sans leading-tight">{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => onGetStarted(true)}
                className={`w-full py-3 rounded-xl mt-8 text-xs font-bold font-sans transition-all cursor-pointer ${
                  isLightMode
                    ? "bg-white hover:bg-zinc-100 text-indigo-700"
                    : "bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                }`}
                type="button"
              >
                Access Premium Sandbox
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Hero CTA pre-footer */}
      <section className="py-20 relative z-10 text-center" id="landing-cta">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
          <GraduationCap className="w-12 h-12 text-[#a855f7] mx-auto animate-pulse" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
            Accelerate Your Learning Portfolio Today
          </h2>
          <p className={`text-sm max-w-md mx-auto ${isLightMode ? "text-zinc-650" : "text-zinc-400"}`}>
            Configure your focus subjects dynamically. Get answers instantly, and review with smart retention tools.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onGetStarted(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-8 rounded-2xl shadow-xl shadow-indigo-950/20 inline-flex items-center gap-2 cursor-pointer text-sm font-sans active:scale-95 transition-transform"
              type="button"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 border-t relative z-10 transition-colors ${
        isLightMode ? "border-zinc-200 bg-white" : "border-white/5 bg-[#050505]"
      }`} id="landing-footer">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-extrabold font-display">
              Cramup<span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">.AI</span>
            </span>
            <span className="text-xs text-zinc-500">| © 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-zinc-500">
            <button onClick={() => onGetStarted(false)} className="hover:text-zinc-300">Privacy Policy</button>
            <button onClick={() => onGetStarted(false)} className="hover:text-zinc-300">Terms of Service</button>
            <button onClick={() => onGetStarted(false)} className="hover:text-zinc-300 font-bold text-indigo-400">Workspace Portal</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
