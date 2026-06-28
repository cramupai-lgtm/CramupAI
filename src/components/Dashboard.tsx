import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AppUser, Material, QuizRecord, Flashcard, ChatMessage, QuizQuestion, ALL_SUBJECTS } from "../types";
import { DBService } from "../store";
import { getGoogleAccessToken, authenticateGoogleForms } from "../lib/google-auth";
import { createGoogleFormFromQuiz } from "../lib/google-forms";
import { 
  BookOpen, 
  Award, 
  Layers, 
  MessageSquare, 
  Play, 
  Pause, 
  Sparkles, 
  Lock, 
  Globe, 
  Volume2, 
  HelpCircle, 
  Send, 
  Mic, 
  Paperclip, 
  User, 
  ChevronRight, 
  ChevronLeft, 
  RotateCw, 
  Flame, 
  VolumeX, 
  ShieldAlert,
  Settings,
  Lightbulb,
  Image,
  Info,
  Download,
  FlaskConical,
  Dna,
  ListChecks,
  Trophy,
  Tag,
  CheckCircle2,
  XCircle,
  Settings2,
  ChevronDown,
  Plus,
  Trash2,
  Check,
  X,
  FileText,
  ExternalLink
} from "lucide-react";

interface DashboardProps {
  currentUser: AppUser;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenPaywall: () => void;
  onSubjectChange: (newSubject: string) => void;
  onLogout: () => void;
  currentMaterial: Material | null;
  isLightMode?: boolean;
}

export default function Dashboard({ 
  currentUser, 
  activeTab, 
  onTabChange, 
  onOpenPaywall, 
  onSubjectChange, 
  onLogout,
  currentMaterial,
  isLightMode = false
}: DashboardProps) {

  const materialSubject = currentMaterial?.subject || currentUser.selected_subject || "Biology";

  // Subject options
  const subjects = ALL_SUBJECTS;

  // Language translation options
  const languages = [
    "English", 
    "Spanish", 
    "French", 
    "German", 
    "Portuguese", 
    "Chinese", 
    "Japanese", 
    "Korean", 
    "Arabic", 
    "Hindi", 
    "Russian", 
    "Italian", 
    "Dutch", 
    "Turkish", 
    "Vietnamese", 
    "Thai", 
    "Indonesian", 
    "Malay", 
    "Swahili", 
    "Bengali"
  ];
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [translatedSummary, setTranslatedSummary] = useState("");
  const [translating, setTranslating] = useState(false);

  // Streaming voice/narration player state
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceAudio, setVoiceAudio] = useState<any>(null);

  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentFCIndex, setCurrentFCIndex] = useState(0);
  const [flippedCardIds, setFlippedCardIds] = useState<Record<string, boolean>>({});

  // Custom flashcard config and addition states
  const [fcGenQuantity, setFcGenQuantity] = useState<number>(10);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [fcGenError, setFcGenError] = useState<string | null>(null);
  const [isAddingCustomCard, setIsAddingCustomCard] = useState(false);
  const [customCardFront, setCustomCardFront] = useState("");
  const [customCardBack, setCustomCardBack] = useState("");
  const [customCardColor, setCustomCardColor] = useState("indigo");
  const [customCardSuccess, setCustomCardSuccess] = useState(false);
  const [customCardError, setCustomCardError] = useState<string | null>(null);

  // Customizable Quiz Configuration
  const [quizType, setQuizType] = useState<"MCQ" | "Fill-In-The-Blanks" | "Short Answer">("MCQ");
  const [questionCount, setQuestionCount] = useState(5);
  const [answerDensity, setAnswerDensity] = useState(4); // 2, 3 or 4 choices
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizStatusLog, setQuizStatusLog] = useState<string | null>(null);

  // Google Forms integration states
  const [exportingToForms, setExportingToForms] = useState(false);
  const [exportedFormId, setExportedFormId] = useState<string | null>(null);
  const [exportedFormUri, setExportedFormUri] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showConfirmFormModal, setShowConfirmFormModal] = useState(false);

  // Quiz interactive grading states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // questionId -> chosen mapping
  const [answeredState, setAnsweredState] = useState<Record<string, boolean>>({}); // questionId -> isAnswered mapping
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [isQuestionDropdownOpen, setIsQuestionDropdownOpen] = useState(false);
  const [quizHelpInput, setQuizHelpInput] = useState("");

  // Multimodal Messenger Chat limits
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [attachedFileMock, setAttachedFileMock] = useState<string | null>(null);
  const [dictating, setDictating] = useState(false);

  // Initialize and fetch sub-records based on loaded study material
  useEffect(() => {
    if (currentMaterial) {
      setTranslatedSummary(currentMaterial.structured_summary_markdown);
      
      // Fetch related records
      const fetchData = async () => {
        try {
          const fc = await DBService.getFlashcards(currentMaterial.id);
          setFlashcards(fc);
        } catch (err) {
          console.error("Failed to load flashcards:", err);
        }

        try {
          const logs = await DBService.getChatHistory(currentMaterial.id);
          if (logs.length > 0) {
            setChatLog(logs);
          } else {
            // Initialize welcoming message
            setChatLog([
              {
                id: "welcome",
                material_id: currentMaterial.id,
                message_sender: "AI",
                text_payload: `Welcome to your Cramup.AI companion chatbot. Ask me critical questions grounded contextually on your uploaded document. I support specialized **${materialSubject}** tutoring rules.`,
                timestamp: new Date().toISOString()
              }
            ]);
          }
        } catch (err) {
          console.error("Failed to load chat history:", err);
        }

        try {
          const quizzes = await DBService.getQuizRecords(currentMaterial.id);
          if (quizzes.length > 0 && quizzes[0].questions.length > 0) {
            setQuizQuestions(quizzes[0].questions);
          }
        } catch (err) {
          console.error("Failed to load quiz records:", err);
        }
      };

      fetchData();
    }
  }, [currentMaterial, materialSubject]);

  // Clean voice players on material changes
  useEffect(() => {
    return () => {
      if (voiceAudio) {
        voiceAudio.pause();
      }
    };
  }, [voiceAudio]);

  // Flashcard Generation & Modification handlers
  const handleGenerateAIFlashcards = async () => {
    if (!currentMaterial) return;
    
    // Check if the setting is a premium option (not 10 and not 15)
    if (fcGenQuantity !== 10 && fcGenQuantity !== 15) {
      if (currentUser.account_tier !== "Premium") {
        onOpenPaywall();
        return;
      }
    }

    setIsGeneratingFlashcards(true);
    setFcGenError(null);

    try {
      const response = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentMaterial.raw_extracted_text,
          quantity: fcGenQuantity,
          subject: materialSubject,
          language: currentMaterial.translation_language
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate custom flashcards. Please try again.");
      }

      const data = await response.json();
      if (!data.flashcards || !Array.isArray(data.flashcards)) {
        throw new Error("API returned unexpected flashcards array.");
      }

      // Delete existing AI flashcards (leaves custom ones intact)
      await DBService.deleteAIFlashcards(currentMaterial.id);

      // Save the newly generated batch
      await DBService.saveFlashcardsBatch(currentMaterial.id, data.flashcards);

      // Reload
      const updated = await DBService.getFlashcards(currentMaterial.id);
      setFlashcards(updated);
      setCurrentFCIndex(0);
      setFlippedCardIds({});
    } catch (err: any) {
      console.error(err);
      setFcGenError(err.message || "Something went wrong during generation.");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleCreateCustomFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMaterial) return;

    if (currentUser.account_tier !== "Premium") {
      onOpenPaywall();
      return;
    }

    if (!customCardFront.trim() || !customCardBack.trim()) {
      setCustomCardError("Please enter some content for both the front and back of the flashcard.");
      return;
    }

    setCustomCardError(null);
    try {
      await DBService.saveCustomFlashcard(
        currentMaterial.id,
        customCardFront,
        customCardBack,
        customCardColor
      );

      // Reload flashcards to include the custom one
      const updated = await DBService.getFlashcards(currentMaterial.id);
      setFlashcards(updated);
      
      // Select the newly added custom card
      const newCardIdx = updated.findIndex(c => c.question_front === customCardFront && c.is_custom);
      if (newCardIdx !== -1) {
        setCurrentFCIndex(newCardIdx);
      }

      setCustomCardFront("");
      setCustomCardBack("");
      setCustomCardSuccess(true);
      setTimeout(() => setCustomCardSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setCustomCardError("Failed to save custom card.");
    }
  };

  const handleDeleteFlashcard = async (cardId: string) => {
    try {
      await DBService.deleteFlashcard(cardId);
      
      // Reload flashcards
      if (currentMaterial) {
        const updated = await DBService.getFlashcards(currentMaterial.id);
        setFlashcards(updated);
        
        // Adjust index if out of limits
        if (currentFCIndex >= updated.length) {
          setCurrentFCIndex(Math.max(0, updated.length - 1));
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Full academic translation handled via Gemini
  const handleTranslate = async (lang: string) => {
    if (currentUser.account_tier !== "Premium" && lang !== "English") {
      onOpenPaywall();
      return;
    }
    setSelectedLanguage(lang);
    if (!currentMaterial) return;
    setTranslating(true);

    try {
      if (lang === "English") {
        setTranslatedSummary(currentMaterial.structured_summary_markdown);
        return;
      }

      const res = await fetch("/api/translate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentMaterial.structured_summary_markdown,
          language: lang
        })
      });

      if (!res.ok) {
        throw new Error("Translation request unsuccessful");
      }

      const data = await res.json();
      setTranslatedSummary(data.text || currentMaterial.structured_summary_markdown);
    } catch (err) {
      console.error("Gemini summary translation failed:", err);
      // fallback gracefully to unmodified
      setTranslatedSummary(currentMaterial.structured_summary_markdown);
    } finally {
      setTranslating(false);
    }
  };

  // Streaming Voice Narration Core Action
  const handleToggleVoice = async () => {
    // 1. Authorization Gate validation
    if (currentUser.account_tier === "Free") {
      onOpenPaywall();
      return;
    }

    if (isPlayingVoice) {
      if (voiceAudio) {
        voiceAudio.pause();
      }
      setIsPlayingVoice(false);
      return;
    }

    if (voiceAudio) {
      voiceAudio.play();
      setIsPlayingVoice(true);
      return;
    }

    setVoiceLoading(true);
    try {
      // Clean up markdown/tags so TTS reads only purely natural paragraph phrasing
      const getCleanTextForSpeech = (rawText: string) => {
        if (!rawText) return "";
        const lines = rawText.split(/\r?\n/);
        const cleanedLines = lines.map(line => {
          let trimmed = line.trim();
          if (!trimmed) return "";
          
          const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
          if (headerMatch) {
            let titleContent = headerMatch[2].trim();
            if (!/[.!?:;]$/.test(titleContent)) {
              titleContent += ".";
            }
            return titleContent;
          }
          
          const listMatch = trimmed.match(/^([-*+]\s+|\d+\.\s+)(.*)$/);
          if (listMatch) {
            trimmed = listMatch[2].trim();
          }
          
          trimmed = trimmed.replace(/\[[^\]]+?\]/g, "");
          trimmed = trimmed.replace(/[*_]+/g, "");
          trimmed = trimmed.replace(/\|/g, " ");
          
          if (trimmed.length > 5 && !/[.!?:;,]$/.test(trimmed)) {
            trimmed += ".";
          }
          return trimmed;
        });
        
        let finalResult = cleanedLines.filter(l => l.length > 0).join("\n\n");
        finalResult = finalResult.replace(/[^\S\r\n]+/g, " ");
        return finalResult.trim();
      };

      const sourceText = translatedSummary || currentMaterial?.structured_summary_markdown || "";
      const textToSpeakRaw = sourceText || "Welcome to Cramup.AI. Sit back and enjoy handsfree study session summaries.";
      const cleanedTextForSpeech = getCleanTextForSpeech(textToSpeakRaw);

      const response = await fetch("/api/voice-synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: cleanedTextForSpeech 
        })
      });

      const data = await response.json();
      if (data.base64Audio) {
        const audioUrl = `data:audio/mp3;base64,${data.base64Audio}`;
        const audio = new Audio(audioUrl);
        audio.onerror = (e) => {
          console.error("Audio error event intercepted:", e);
        };
        audio.onended = () => {
          setIsPlayingVoice(false);
        };
        setVoiceAudio(audio);
        audio.play().catch(err => {
          console.warn("Standard audio play blocked or failed. Using synthesis fallback:", err);
          const synth = window.speechSynthesis;
          if (synth) {
            const textToSpeakBrowser = cleanedTextForSpeech.substring(0, 600) || "Streaming mock premium audio narration active.";
            const utterance = new SpeechSynthesisUtterance(textToSpeakBrowser);
            utterance.onend = () => {
              setIsPlayingVoice(false);
            };
            synth.speak(utterance);
            setIsPlayingVoice(true);
            setVoiceAudio({
              play: () => {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(textToSpeakBrowser);
                u.onend = () => setIsPlayingVoice(false);
                window.speechSynthesis.speak(u);
              },
              pause: () => {
                window.speechSynthesis.cancel();
              }
            });
          }
        });
        setIsPlayingVoice(true);
      } else {
        // Simulated narration player using safe Client Voice synthesis fallback in case quota exhausted or API key missing
        const synth = window.speechSynthesis;
        if (synth) {
          const textToSpeakBrowserFallback = cleanedTextForSpeech.substring(0, 600) || "Streaming mock premium audio narration active.";
          const utterance = new SpeechSynthesisUtterance(textToSpeakBrowserFallback);
          utterance.onend = () => {
            setIsPlayingVoice(false);
          };
          synth.speak(utterance);
          setIsPlayingVoice(true);
          // Set simple mock audio holder (no-op player) to prevent browser media source exceptions
          setVoiceAudio({
            play: () => {
              window.speechSynthesis.cancel();
              const u = new SpeechSynthesisUtterance(textToSpeakBrowserFallback);
              u.onend = () => setIsPlayingVoice(false);
              window.speechSynthesis.speak(u);
            },
            pause: () => {
              window.speechSynthesis.cancel();
            }
          });
        }
      }
    } catch (err) {
      console.error("Synthesizer pipeline failed", err);
    } finally {
      setVoiceLoading(false);
    }
  };

  // Printable and downloadable PDF layout generator
  const handleDownloadPDF = () => {
    if (!currentMaterial) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download or print your customized Study Notes!");
      return;
    }
    
    // Extract formatted HTML study notes
    const textHtml = document.getElementById("translated-container")?.innerHTML || "";
    
    const summaryHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentMaterial.title} - Academic Study Guide</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
            
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
              color: #171717; 
              line-height: 1.7; 
              padding: 40px; 
              max-width: 800px; 
              margin: 0 auto; 
              background-color: #ffffff;
            }
            
            .meta-header { 
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px; 
              color: #64748b; 
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 8px;
              margin-bottom: 25px; 
              display: flex;
              justify-content: space-between;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            h1 { 
              font-size: 28px; 
              font-weight: 850; 
              color: #0f172a; 
              letter-spacing: -0.025em;
              margin-top: 0;
              margin-bottom: 12px; 
              line-height: 1.2;
            }
            
            .doc-info {
              font-size: 12px;
              color: #4b5563;
              font-weight: 500;
              margin-bottom: 35px;
            }
            
            h2 { 
              font-size: 20px; 
              font-weight: 750; 
              color: #1e1b4b; 
              margin-top: 30px; 
              margin-bottom: 12px; 
              padding-bottom: 6px;
              border-bottom: 1px solid #e2e8f0;
              letter-spacing: -0.02em;
            }
            
            h3 { 
              font-size: 15px; 
              font-weight: 650; 
              color: #4c1d95; 
              margin-top: 22px; 
              margin-bottom: 8px;
              letter-spacing: -0.01em;
            }
            
            p { 
              font-size: 14px; 
              color: #334155; 
              margin-top: 0;
              margin-bottom: 14px; 
            }
            
            strong { 
              color: #2563eb; 
              font-weight: 700; 
            }
            
            ul { 
              margin-bottom: 16px; 
              padding-left: 20px; 
              list-style-type: disc;
            }
            
            li { 
              font-size: 13.5px; 
              color: #334155; 
              margin-bottom: 5px; 
            }
            
            .flex {
              display: flex;
              gap: 12px;
            }
            .border-l-4 {
              border-left-width: 4px;
            }
            .rounded-r-2xl {
              border-top-right-radius: 8px;
              border-bottom-right-radius: 8px;
            }
            .my-4 {
              margin-top: 14px;
              margin-bottom: 14px;
            }
            .py-4 {
              padding-top: 14px;
              padding-bottom: 14px;
            }
            .pl-4 {
              padding-left: 14px;
            }
            .pr-3 {
              padding-right: 10px;
            }
            .font-sans {
              font-family: 'Inter', sans-serif;
            }
            
            .bg-amber-50\\/80 { background-color: #fefdf0; }
            .bg-blue-50\\/80 { background-color: #f0f7ff; }
            .bg-indigo-50\\/60 { background-color: #f5f3ff; }
            
            .border-amber-500 { border-color: #f59e0b; }
            .border-blue-500 { border-color: #3b82f6; }
            .border-indigo-500 { border-color: #6366f1; }
            
            .text-amber-900 { color: #78350f; }
            .text-blue-900 { color: #1e3a8a; }
            .text-indigo-950 { color: #1e1b4b; }
            
            .shrink-0 { flex-shrink: 0; }
            .mt-0\\.5 { margin-top: 2px; }
            .flex-1 { flex: 1; }
            
            svg { display: none; }
            
            @media print {
              body { padding: 25px; }
              @page { size: portrait; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="meta-header">
            <span>Cramup.AI Study Workspace</span>
            <span>Course Subject: ${materialSubject}</span>
          </div>
          <h1>${currentMaterial.title}</h1>
          <div class="doc-info">
            Study Source: ${currentMaterial.file_type} &bull; Transformed: ${new Date(currentMaterial.generated_at).toLocaleDateString()}
          </div>
          
          <div class="content-body">
            ${textHtml}
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 400);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(summaryHtml);
    printWindow.document.close();
  };

  // Google Forms Export
  const handleExportToGoogleForms = async () => {
    setExportError(null);
    setExportedFormId(null);
    setExportedFormUri(null);

    if (quizQuestions.length === 0) {
      setExportError("There are no quiz questions to export. Please generate or load a quiz first.");
      return;
    }

    setExportingToForms(true);
    try {
      // 1. Get or request Google Access Token
      let token = getGoogleAccessToken();
      if (!token) {
        token = await authenticateGoogleForms();
      }

      // 2. Title of the Form
      const title = currentMaterial?.title 
        ? `${currentMaterial.title} - ${quizType} Quiz` 
        : `CramUp ${quizType} Quiz`;

      // 3. Create the Form
      const result = await createGoogleFormFromQuiz(token, title, quizQuestions, quizType);
      
      setExportedFormId(result.formId);
      setExportedFormUri(result.responderUri);
    } catch (err: any) {
      console.error("Export to Google Forms failed:", err);
      setExportError(err.message || "An unexpected error occurred while exporting to Google Forms.");
    } finally {
      setExportingToForms(false);
      setShowConfirmFormModal(false);
    }
  };

  // Quiz Operations
  const handleStartQuiz = () => {
    if (!currentMaterial) return;
    
    // Cap at 5 questions for Free account tier configuration
    let finalCount = questionCount;
    if (currentUser.account_tier === "Free" && questionCount > 5) {
      finalCount = 5;
      setQuestionCount(5);
      setQuizStatusLog("⚠️ Question volume capped to 5 limit for Freemium tiers.");
    } else {
      setQuizStatusLog(null);
    }

    // Fetch questions list and filter down dynamically
    setSelectedAnswers({});
    setAnsweredState({});
    setCurrentQuizIdx(0);
    setQuizStarted(true);
  };

  const handleSelectQuizAnswer = (qText: string, choice: string, correctAnswer: string) => {
    if (answeredState[qText]) return; // locked once answered

    setSelectedAnswers(prev => ({ ...prev, [qText]: choice }));
    setAnsweredState(prev => ({ ...prev, [qText]: true }));
  };

  const getQuestionTag = (qText: string) => {
    if (materialSubject) {
      if (materialSubject === "Biology" && qText.toLowerCase().includes("photosystem")) {
        return "Light Reactions and Electron Transport";
      }
      return `${materialSubject} · ${qText.length % 2 === 0 ? "Conceptual Check" : "Analytical Study"}`;
    }
    return "Academic Diagnostics";
  };

  const handleAskAIHelp = async (msg: string, q: QuizQuestion) => {
    if (!msg.trim()) return;

    const selected = selectedAnswers[q.question_text] || "None";
    const contextualPrompt = `[Quiz Tutor context] 
Regarding this Question: "${q.question_text}"
My selected answer choice: "${selected}"
Expected Correct Answer: "${q.correct_answer}"
My specific inquiry: "${msg.trim()}"

Please explain why the correct answer is indeed "${q.correct_answer}" and politely guide me to master this concept. Keep your response encouraging, clear, and highly focused!`;

    // Immediately push user view and typing simulator
    const userMsgId = Math.random().toString();
    const updatedLogs = [...chatLog, {
      id: userMsgId,
      material_id: currentMaterial?.id || "doc",
      message_sender: "User" as const,
      text_payload: `Regarding Q "${q.question_text.substring(0, 50)}...": ${msg.trim()}`,
      timestamp: new Date().toISOString()
    }];

    setChatLog(updatedLogs);
    setChatLoading(true);
    onTabChange("chatbot");

    try {
      const response = await fetch("/api/chat-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: contextualPrompt,
          chatHistory: updatedLogs.slice(-6),
          materialContent: currentMaterial?.raw_extracted_text || "",
          subject: materialSubject
        })
      });

      const data = await response.json();
      const newMessages = [...updatedLogs, {
        id: Math.random().toString(),
        material_id: currentMaterial?.id || "doc",
        message_sender: "AI" as const,
        text_payload: data.text,
        timestamp: new Date().toISOString()
      }];

      setChatLog(newMessages);

      await DBService.saveChatMessage(currentMaterial?.id || "doc", "User", `Regarding Quiz help: ${msg.trim()}`);
      await DBService.saveChatMessage(currentMaterial?.id || "doc", "AI", data.text);

    } catch (err) {
      console.error("AI Quiz tutor help query failed:", err);
    } finally {
      setChatLoading(false);
    }
  };

  // 3D Flashcard flip
  const toggleCardFlip = (cid: string) => {
    setFlippedCardIds(prev => ({ ...prev, [cid]: !prev[cid] }));
  };

  // Multimodal companion chat dispatch
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !attachedFileMock) return;

    const userMsg = chatInput.trim() || `Uploaded payload attachment (${attachedFileMock})`;
    setChatInput("");
    setChatLoading(true);

    const updatedLogs = [...chatLog, {
      id: Math.random().toString(),
      material_id: currentMaterial?.id || "doc",
      message_sender: "User" as const,
      text_payload: userMsg,
      timestamp: new Date().toISOString()
    }];

    setChatLog(updatedLogs);
    setAttachedFileMock(null);

    try {
      const response = await fetch("/api/chat-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          chatHistory: updatedLogs.slice(-6),
          materialContent: currentMaterial?.raw_extracted_text || "",
          subject: materialSubject
        })
      });

      const data = await response.json();
      
      const newMessages = [...updatedLogs, {
        id: Math.random().toString(),
        material_id: currentMaterial?.id || "doc",
        message_sender: "AI" as const,
        text_payload: data.text,
        timestamp: new Date().toISOString()
      }];

      setChatLog(newMessages);
      
      // Save in persistence
      await DBService.saveChatMessage(currentMaterial?.id || "doc", "User", userMsg);
      await DBService.saveChatMessage(currentMaterial?.id || "doc", "AI", data.text);

    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const simulateDictation = () => {
    setDictating(true);
    setChatInput("Recited voice note draft: Can you simplify the chemical alloys stress formulas written in this slide?");
    setTimeout(() => {
      setDictating(false);
    }, 1500);
  };

  const handleAttachMockFile = (type: string) => {
    setAttachedFileMock(`Snapshot_${type}_textbook.jpg`);
  };

  const renderTextWithBadges = (text: string) => {
    // Regex to find tags like [High Importance], [Formula Alert], [Concept Key]
    const regex = /\[(.*?)\]/g;
    const parts = text.split(regex);
    const matches = [...text.matchAll(regex)];

    if (matches.length === 0) {
      return <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
    }

    return (
      <span>
        {parts.map((part, index) => {
          if (index % 2 === 0) {
            return <span key={index} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
          } else {
            const badgeText = part;
            let badgeBg = "bg-indigo-50 text-indigo-700 border border-indigo-200";
            if (badgeText.toLowerCase().includes("importance") || badgeText.toLowerCase().includes("critical")) {
              badgeBg = "bg-rose-50 text-rose-700 border border-rose-200";
            } else if (badgeText.toLowerCase().includes("formula")) {
              badgeBg = "bg-amber-50 text-amber-700 border border-amber-200";
            } else if (badgeText.toLowerCase().includes("alert") || badgeText.toLowerCase().includes("warning")) {
              badgeBg = "bg-orange-50 text-orange-700 border border-orange-200";
            } else if (badgeText.toLowerCase().includes("key") || badgeText.toLowerCase().includes("concept")) {
              badgeBg = "bg-emerald-50 text-emerald-700 border border-emerald-200";
            }
            return (
              <span key={index} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap font-sans mx-1 ${badgeBg}`}>
                {badgeText}
              </span>
            );
          }
        })}
      </span>
    );
  };

  const renderSummaryMarkdown = (summaryText: string) => {
    let sanitizedText = summaryText || "";
    
    // 1. Clean the dollar signs
    sanitizedText = sanitizedText.replace(/\$(?!\d)/g, "");

    // 2. Safely translate or strip LaTeX arrow syntax (e.g. \xrightarrow{\text{Light, Mn-complex}})
    sanitizedText = sanitizedText.replace(/\\xrightarrow\s*\{(?:\\text\s*\{)?([^{}]+?)(?:\})?\}/g, " → ($1) ");
    sanitizedText = sanitizedText.replace(/\\xrightarrow\s*\{([^{}]+?)\}/g, " → ($1) ");
    sanitizedText = sanitizedText.replace(/\\xrightarrow/g, " → ");

    // 3. Remove other LaTeX structures (e.g., \text{...}, \ce{...}, \mathrm{...})
    sanitizedText = sanitizedText.replace(/\\text\s*\{([^{}]+?)\}/g, "$1");
    sanitizedText = sanitizedText.replace(/\\ce\s*\{([^{}]+?)\}/g, "$1");
    sanitizedText = sanitizedText.replace(/\\mathrm\s*\{([^{}]+?)\}/g, "$1");

    // 4. Handle fractions: \frac{a}{b} -> a/b
    sanitizedText = sanitizedText.replace(/\\frac\s*\{([^{}]+?)\}\s*\{([^{}]+?)\}/g, "$1/$2");

    // 5. Clean common Greek letter words and symbols
    sanitizedText = sanitizedText.replace(/\\delta/gi, "delta");
    sanitizedText = sanitizedText.replace(/\\Delta/g, "Δ");
    sanitizedText = sanitizedText.replace(/\\alpha/gi, "alpha");
    sanitizedText = sanitizedText.replace(/\\beta/gi, "beta");
    sanitizedText = sanitizedText.replace(/\\gamma/gi, "gamma");
    sanitizedText = sanitizedText.replace(/\\theta/gi, "theta");
    sanitizedText = sanitizedText.replace(/\\pi/g, "π");
    sanitizedText = sanitizedText.replace(/\\mu/g, "μ");

    // 6. Strip common formatting modifiers
    sanitizedText = sanitizedText.replace(/\\left\(/g, "(").replace(/\\right\)/g, ")");
    sanitizedText = sanitizedText.replace(/\\left\[/g, "[").replace(/\\right\]/g, "]");
    sanitizedText = sanitizedText.replace(/\\left\{/g, "{").replace(/\\right\}/g, "}");
    sanitizedText = sanitizedText.replace(/\\[:,;!]/g, " ");
    sanitizedText = sanitizedText.replace(/\\quad/g, "  ").replace(/\\qquad/g, "   ");
    
    // 7. Strip any remaining backslashed commands so no LaTeX syntax leaks
    sanitizedText = sanitizedText.replace(/\\[a-zA-Z]+/g, "");

    const parsedLines: React.ReactNode[] = [];
    const lines = sanitizedText.split("\n");
    let inTable = false;
    let tableRows: string[][] = [];

    const parseLineContent = (content: string) => {
      return renderTextWithBadges(content.trim());
    };

    const flushTable = (keyId: string) => {
      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const dataRows = tableRows.slice(1);
        parsedLines.push(
          <div key={`table-${keyId}`} className="my-5 overflow-hidden border border-zinc-200/85 rounded-2xl shadow-sm bg-white flex flex-col" id={`table-container-${keyId}`}>
            <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-zinc-100" id={`table-scroll-${keyId}`}>
              <table className="min-w-[550px] sm:min-w-full divide-y divide-zinc-200 table-auto">
                <thead className="bg-[#1e1b4b] text-white">
                  <tr>
                    {headers.map((h, k) => (
                      <th key={k} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider font-sans border-r border-[#312e81]/30 last:border-0 text-white">
                        {parseLineContent(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {dataRows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 1 ? "bg-zinc-50" : "bg-white"}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-5 py-3 text-xs text-zinc-700 font-sans border-r border-zinc-100 last:border-0 leading-relaxed font-normal">
                          {parseLineContent(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Visual swipe slider indicator specifically for small/tablet devices */}
            <div className="sm:hidden flex items-center justify-center gap-1.5 py-2 bg-zinc-50 border-t border-zinc-200/60 text-[9px] text-zinc-500 font-sans font-medium select-none uppercase tracking-widest leading-none">
              <span>Swipe table horizontally to read</span>
              <span className="animate-bounce">↔</span>
            </div>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();
      
      if (line.startsWith("|")) {
        inTable = true;
        const cols = line.split("|").map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        const isSeparator = cols.every(c => c.replace(/[:-\s]/g, "").length === 0);
        if (!isSeparator && cols.length > 0) {
          tableRows.push(cols);
        }
      } else {
        if (inTable) {
          flushTable(`line-${i}`);
        }
        
        if (line.startsWith("# ")) {
          const content = line.substring(2);
          parsedLines.push(
            <h1 key={`h1-${i}`} className="text-2xl sm:text-3xl font-extrabold text-zinc-950 mt-8 mb-4 tracking-tight border-b border-zinc-100 pb-3 font-display select-none block leading-tight" id={`summary-h1-${i}`}>
              {parseLineContent(content)}
            </h1>
          );
        } else if (line.startsWith("## ")) {
          const content = line.substring(3);
          const lowercaseContent = content.toLowerCase();
          let headingIcon = <BookOpen className="w-5 h-5 text-indigo-500 shrink-0 mt-1" />;
          
          if (lowercaseContent.includes("principles") || lowercaseContent.includes("concept") || lowercaseContent.includes("force")) {
            headingIcon = <RotateCw className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />;
          } else if (lowercaseContent.includes("technique") || lowercaseContent.includes("fractionation") || lowercaseContent.includes("lab")) {
            headingIcon = <FlaskConical className="w-5 h-5 text-purple-600 shrink-0 mt-1" />;
          } else if (lowercaseContent.includes("density") || lowercaseContent.includes("gradient") || lowercaseContent.includes("cell")) {
            headingIcon = <Dna className="w-5 h-5 text-blue-600 shrink-0 mt-1" />;
          } else if (lowercaseContent.includes("factors") || lowercaseContent.includes("influence") || lowercaseContent.includes("summary")) {
            headingIcon = <ListChecks className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />;
          }

          let customIconNode = headingIcon;
          let textWithNoEmoji = content;
          
          // Match any emoji at the start of the string
          const emojiRegex = /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+)\s*/u;
          const match = content.match(emojiRegex);
          if (match) {
            const emoji = match[1];
            textWithNoEmoji = content.substring(match[0].length);
            customIconNode = (
              <span className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-sm shadow-sm select-none shrink-0" id={`header-emoji-${i}`}>
                {emoji}
              </span>
            );
          }
          
          parsedLines.push(
            <h2 key={`h2-${i}`} className="text-lg sm:text-xl font-bold text-zinc-900 mt-8 mb-4 tracking-tight font-display select-none flex items-start gap-2.5 pb-2 border-b border-zinc-100/80 animate-fade-in" id={`summary-h2-${i}`}>
              {customIconNode}
              <span className="flex-1 min-w-0 leading-snug">{parseLineContent(textWithNoEmoji)}</span>
            </h2>
          );
        } else if (line.startsWith("### ")) {
          const content = line.substring(4);
          let customIconNode = null;
          let textWithNoEmoji = content;
          
          const emojiRegex = /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+)\s*/u;
          const match = content.match(emojiRegex);
          if (match) {
            const emoji = match[1];
            textWithNoEmoji = content.substring(match[0].length);
            customIconNode = <span className="mr-1.5 select-none shrink-0" id={`header-emoji-h3-${i}`}>{emoji}</span>;
          }

          parsedLines.push(
            <h3 key={`h3-${i}`} className="text-zinc-900 font-bold text-sm sm:text-base mt-6 mb-2.5 tracking-tight select-none flex items-start gap-1" id={`summary-h3-${i}`}>
              {customIconNode}
              <span className="flex-1 min-w-0 leading-tight">{parseLineContent(textWithNoEmoji)}</span>
            </h3>
          );
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          const indentMatch = rawLine.match(/^(\s*)/);
          const indentLength = indentMatch ? indentMatch[1].length : 0;
          const formatted = line.substring(2);
          const isNested = indentLength >= 2;
          parsedLines.push(
            <div 
              key={`list-${i}`} 
              className={`flex gap-2.5 items-start text-zinc-800 my-1.5 font-sans text-xs sm:text-sm ${
                isNested ? "pl-8" : "pl-2"
              }`}
              id={`summary-list-item-${i}`}
            >
              <span className={`${isNested ? "text-blue-500 font-extrabold text-[13px]" : "text-indigo-600 font-extrabold text-[15px]"} mt-0.5 shrink-0 select-none`}>
                •
              </span>
              <div className="flex-1 leading-relaxed">{parseLineContent(formatted)}</div>
            </div>
          );
        } else if (line.startsWith(">")) {
          const content = line.substring(1).trim();
          let bgClass = "bg-[#EBF8FF]";
          let borderClass = "border-indigo-600";
          let textColor = "text-blue-950";
          let icon = null;

          if (content.toLowerCase().includes("exam tip") || content.includes("💡")) {
            bgClass = "bg-amber-50/80";
            borderClass = "border-amber-500";
            textColor = "text-amber-900";
            icon = <Lightbulb className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />;
          } else if (content.toLowerCase().includes("figure") || content.includes("🖼️")) {
            bgClass = "bg-blue-50/80";
            borderClass = "border-blue-500";
            textColor = "text-blue-900";
            icon = <Image className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />;
          } else {
            bgClass = "bg-indigo-50/60";
            borderClass = "border-indigo-500";
            textColor = "text-indigo-950";
            icon = <Info className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />;
          }

          parsedLines.push(
            <div key={`quote-${i}`} className={`flex gap-3 border-l-4 ${borderClass} ${bgClass} pl-4 pr-3 py-3.5 text-xs sm:text-sm my-4 rounded-r-2xl leading-relaxed font-sans shadow-sm ${textColor}`} id={`summary-quote-${i}`}>
              {icon}
              <div className="flex-1">{parseLineContent(content)}</div>
            </div>
          );
        } else if (line === "---") {
          parsedLines.push(<hr key={`hr-${i}`} className="border-zinc-200/60 my-6" id={`summary-hr-${i}`} />);
        } else if (line) {
          parsedLines.push(
            <p key={`p-${i}`} className="text-zinc-800 font-sans text-xs sm:text-sm leading-relaxed my-2" id={`summary-p-${i}`}>
              {parseLineContent(line)}
            </p>
          );
        }
      }
    }
    
    if (inTable) {
      flushTable("line-eof");
    }

    return <div className="space-y-4">{parsedLines}</div>;
  };

  if (!currentMaterial) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 text-center rounded-3xl min-h-[300px] border ${isLightMode ? "bg-white border-zinc-200 shadow-md" : "bg-white/5 border-white/10 backdrop-blur-md"}`} id="empty-state">
        <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse mb-3" />
        <h3 className={`text-md font-bold font-display ${isLightMode ? "text-zinc-900" : "text-white"}`}>Select or Compile Academic Material</h3>
        <p className={`text-xs mt-1 max-w-sm ${isLightMode ? "text-zinc-600" : "text-slate-400"}`}>
          Activate Cramup.AI by uploading a document in the uploader segment or clicking the ready-to-use sample notes button!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-core">
      
      <AnimatePresence mode="wait">
        {/* TAB 1: Rich Multi-Topic Summaries */}
        {activeTab === "summary" && (
          <div key="summary" className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-500/10 pb-2">
              <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${isLightMode ? "text-zinc-500" : "text-zinc-400"}`}>
                STUDY DECK INTERACTIVE SUMMARY
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#a855f7] bg-[#a855f7]/15 px-2.5 py-1 rounded-xl">
                <Sparkles className="w-3 h-3 text-[#a855f7] animate-pulse" />
                Powered by Gemini 3.5 Flash
              </span>
            </div>
            
            {/* Top document controls matching the screenshot */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-1" id="document-actions-row">
              {/* Translator select */}
              <div className={`flex items-center gap-2 border px-3.5 py-2 rounded-xl ${isLightMode ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950/45 border-white/5"}`} id="document-language-box">
                <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <select
                  id="translation-select"
                  value={selectedLanguage}
                  onChange={(e) => handleTranslate(e.target.value)}
                  disabled={translating}
                  className={`bg-transparent text-xs focus:outline-none cursor-pointer pr-1 font-semibold border-none ${isLightMode ? "text-zinc-800" : "text-zinc-200"}`}
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang} className={isLightMode ? "bg-white text-zinc-900 font-semibold" : "bg-zinc-950 text-slate-200 font-semibold"}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* PDF & Speech Action Buttons */}
              <div className="flex items-center gap-2" id="document-buttons-box">
                {/* Download PDF button */}
                <button
                  id="download-pdf-btn"
                  type="button"
                  onClick={handleDownloadPDF}
                  className={`flex items-center gap-1.5 border px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isLightMode 
                      ? "bg-white hover:bg-zinc-55 border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 shadow-sm" 
                      : "bg-[#0e0e11] hover:bg-zinc-900/80 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white"
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Download PDF</span>
                </button>

                {/* Listen button */}
                <button
                  id="voice-narrator-btn"
                  type="button"
                  onClick={handleToggleVoice}
                  disabled={voiceLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isPlayingVoice 
                      ? "bg-red-950/30 border-red-500/50 text-red-300 animate-pulse" 
                      : (isLightMode 
                          ? "bg-white hover:bg-zinc-55 border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 shadow-sm" 
                          : "bg-[#0e0e11] hover:bg-zinc-900/80 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white")
                  }`}
                >
                  {voiceLoading ? (
                    <>
                      <span className="w-3 h-3 border border-indigo-400/30 border-t-indigo-600 rounded-full animate-spin shrink-0" />
                      <span>Generating...</span>
                    </>
                  ) : isPlayingVoice ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 shrink-0" />
                      <span>Mute</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main white paper study material card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white text-zinc-900 border border-zinc-200 shadow-xl rounded-3xl p-6 sm:p-10 md:p-12 relative overflow-hidden max-w-4xl mx-auto"
              id="tab-summary-content"
            >
              {/* Translation indicator overlay */}
              {translating ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                  <span className="w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Applying translation filters...</p>
                </div>
              ) : (
                <div className="text-zinc-800 text-xs sm:text-sm leading-relaxed" id="translated-container">
                  {renderSummaryMarkdown(translatedSummary)}
                </div>
              )}
            </motion.div>
          </div>
        )}

      {activeTab === "quiz" && (
        <motion.div
          key="quiz"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`rounded-3xl p-6 space-y-6 border ${isLightMode ? "bg-white border-zinc-200 shadow-sm" : "bg-white/5 border-white/10 backdrop-blur-md"}`}
          id="tab-quiz-content"
        >
          <div className={`flex items-center gap-2 border-b pb-4 ${isLightMode ? "border-zinc-200" : "border-white/10"}`}>
            <Award className="w-5 h-5 text-indigo-400" />
            <h4 className={`text-sm font-bold uppercase tracking-wider font-display ${isLightMode ? "text-zinc-900" : "text-slate-100"}`}>Custom Testing Diagnostic</h4>
          </div>

          {/* Google Forms Export Module */}
          {quizQuestions.length > 0 && (
            <div className={`p-4 rounded-2xl border ${isLightMode ? "bg-indigo-50/50 border-indigo-100 shadow-sm" : "bg-indigo-950/10 border-indigo-500/20 backdrop-blur-sm"} space-y-3`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isLightMode ? "text-zinc-800" : "text-slate-200"}`}>
                      Google Forms Quiz Integration
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                    Export your custom generated quiz questions directly to Google Forms for classroom grading or homework sharing.
                  </p>
                </div>
                <button
                  type="button"
                  id="google-forms-export-btn"
                  onClick={() => setShowConfirmFormModal(true)}
                  disabled={exportingToForms}
                  className={`px-4 py-2.5 text-xs font-mono rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-all flex items-center gap-2 shrink-0 shadow-md ${
                    exportingToForms ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {exportingToForms ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>Export to Google Forms</span>
                    </>
                  )}
                </button>
              </div>

              {exportError && (
                <div className="flex items-center gap-2 bg-rose-950/20 border border-rose-800/40 text-rose-300 px-3 py-2 rounded-xl text-[10px] font-mono">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{exportError}</span>
                </div>
              )}

              {exportedFormUri && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 rounded-xl space-y-2 text-xs">
                  <p className="font-semibold text-emerald-400">✓ Quiz successfully exported to Google Forms!</p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                    <a
                      href={exportedFormUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>Open Form (Quiz View)</span>
                    </a>
                    {exportedFormId && (
                      <a
                        href={`https://docs.google.com/forms/d/${exportedFormId}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span>Edit Form (Creator View)</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {quizStatusLog && (
            <div className="flex items-center gap-2 bg-yellow-950/20 border border-yellow-800/40 text-yellow-300 px-4 py-2 rounded-xl text-[10px] font-mono">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{quizStatusLog}</span>
            </div>
          )}

          {!quizStarted ? (
            <div className="space-y-6 max-w-xl mx-auto py-4" id="quiz-configurations">
              <span className={`text-xs font-semibold block mb-3 text-center uppercase tracking-widest font-mono ${isLightMode ? "text-zinc-700" : "text-slate-300"}`}>Configure Diagnostic Parameters</span>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">Select Quiz Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      id="quiz-type-mcq"
                      type="button"
                      onClick={() => setQuizType("MCQ")}
                      className={`py-3 text-xs border rounded-xl font-mono transition-all cursor-pointer ${
                        quizType === "MCQ" 
                          ? (isLightMode ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold" : "bg-white/10 border-indigo-500/50 text-indigo-300 font-semibold") 
                          : (isLightMode ? "bg-white border-zinc-200 text-zinc-550 hover:bg-zinc-50" : "bg-white/5 border-white/10 text-slate-500")
                      }`}
                    >
                      Multiple Choice
                    </button>
                    <button
                      id="quiz-type-fitb"
                      type="button"
                      onClick={() => setQuizType("Fill-In-The-Blanks")}
                      className={`py-3 text-xs border rounded-xl font-mono transition-all cursor-pointer ${
                        quizType === "Fill-In-The-Blanks" 
                          ? (isLightMode ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold" : "bg-white/10 border-indigo-500/50 text-indigo-300 font-semibold") 
                          : (isLightMode ? "bg-white border-zinc-200 text-zinc-550 hover:bg-zinc-50" : "bg-white/5 border-white/10 text-slate-500")
                      }`}
                    >
                      Fill-In-The-Blanks
                    </button>
                    <button
                      id="quiz-type-short-ans"
                      type="button"
                      onClick={() => {
                        setQuizType("Short Answer");
                      }}
                      className={`py-3 text-xs border rounded-xl font-mono transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        quizType === "Short Answer"
                          ? (isLightMode ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold" : "bg-white/10 border-indigo-500/50 text-indigo-300 font-semibold")
                          : (isLightMode ? "bg-white border-zinc-200 text-zinc-550 hover:bg-zinc-50" : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-350")
                      }`}
                    >
                      Short Answer
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-[10px] font-mono tracking-wider uppercase block ${isLightMode ? "text-zinc-600" : "text-slate-400"}`}>Question Volume Capacity (Max 30)</label>
                  <input
                    id="quiz-question-count"
                    type="number"
                    min={1}
                    max={30}
                    value={questionCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (currentUser.account_tier !== "Premium" && val > 5) {
                        setQuestionCount(5);
                        onOpenPaywall();
                      } else {
                        setQuestionCount(Math.max(1, Math.min(30, val)));
                      }
                    }}
                    className={`w-full text-xs py-3 px-4 rounded-xl focus:outline-none focus:border-indigo-500/50 font-mono border ${isLightMode ? "bg-white border-zinc-350 text-zinc-950 placeholder:text-zinc-400" : "bg-white/5 border-white/10 text-slate-100 placeholder:text-zinc-650"}`}
                  />
                  {currentUser.account_tier === "Free" && (
                    <span className="text-[9px] text-purple-650 font-mono block mt-1">⚠️ Free tier is capped at max 5 questions. Upgrade to premium for up to 30 questions.</span>
                  )}
                </div>
              </div>

              {quizType === "MCQ" && (
                <div className="space-y-1">
                  <label className={`text-[10px] font-mono tracking-wider uppercase block ${isLightMode ? "text-zinc-600" : "text-slate-400"}`}>Choice Density Per Question</label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map(density => (
                      <button
                        id={`density-${density}`}
                        type="button"
                        key={density}
                        onClick={() => setAnswerDensity(density)}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono transition-colors border cursor-pointer ${
                          answerDensity === density 
                            ? (isLightMode ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold" : "bg-white/10 border-indigo-505/55 text-indigo-300 font-semibold") 
                            : (isLightMode ? "bg-white border-zinc-200 text-zinc-550 hover:bg-zinc-50" : "bg-white/5 border-white/10 text-slate-500")
                        }`}
                      >
                        {density} Options
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                id="generate-quiz-btn"
                type="button"
                onClick={handleStartQuiz}
                className="w-full py-4 text-xs font-mono uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-950/40 mt-4 cursor-pointer"
              >
                Compile Interactive Testing Deck
              </button>
            </div>
          ) : (
            <div className="space-y-6" id="quiz-active-deck">
              {(() => {
                const activeQuestions = quizQuestions.slice(0, questionCount);
                if (activeQuestions.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-500 font-sans text-xs">
                      No quiz questions loaded. Please compile an interactive testing deck above.
                    </div>
                  );
                }

                const safeIndex = Math.min(currentQuizIdx, activeQuestions.length - 1);
                const q = activeQuestions[safeIndex];
                if (!q) return null;

                const hasAnswered = answeredState[q.question_text];
                const selected = selectedAnswers[q.question_text];
                const isCorrect = quizType === "Short Answer"
                  ? (selected?.toLowerCase() === q.correct_answer?.toLowerCase() || (selected && q.correct_answer && q.correct_answer.toLowerCase().split(' ').some(word => word.length > 3 && selected.toLowerCase().includes(word))))
                  : (selected?.trim().toLowerCase() === q.correct_answer?.trim().toLowerCase() || selected === q.correct_answer);

                const answeredCount = activeQuestions.filter(item => answeredState[item.question_text]).length;
                const progressPercent = activeQuestions.length > 0 ? Math.round((answeredCount / activeQuestions.length) * 100) : 0;

                return (
                  <div className="space-y-6" id="quiz-paginated-core">
                    {/* Top Progress Track Header (Matches Trophy layout in Screenshot) */}
                    <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/5" id="quiz-progress-section">
                      <div className="flex items-center gap-1.5 font-display text-xs font-bold text-slate-400">
                        <Trophy className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
                        <span className={isLightMode ? "text-zinc-700" : "text-zinc-300"}>Score Tracker</span>
                      </div>
                      
                      {/* Slender filled progress line representing completed/answered questions */}
                      <div className="flex-1 max-w-sm h-1.5 bg-zinc-950 rounded-full overflow-hidden relative border border-white/5 mx-2" id="quiz-progress-track">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 rounded-full"
                          transition={{ duration: 0.3 }}
                        />
                      </div>

                      {/* Pill count indicator */}
                      <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border ${
                        isLightMode
                          ? "bg-zinc-100 border-zinc-200 text-zinc-700"
                          : "bg-zinc-900 border-zinc-800 text-slate-300"
                      }`}>
                        {answeredCount} / {activeQuestions.length}
                      </div>
                    </div>

                    {/* Question custom formatted block container */}
                    <div className={`p-6 rounded-2xl space-y-6 border ${
                      isLightMode
                        ? "bg-zinc-50 border-zinc-200 shadow-sm"
                        : "bg-white/[0.02] border-white/10 backdrop-blur-md"
                    }`} id="current-question-card">
                      
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Dropdown Menu for Direct Jumps */}
                          <div className="relative z-20">
                            <button
                              type="button"
                              onClick={() => setIsQuestionDropdownOpen(!isQuestionDropdownOpen)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                                isLightMode 
                                  ? "bg-zinc-100 border-zinc-250 text-zinc-800 hover:bg-zinc-200" 
                                  : "bg-[#141517] border-zinc-800 hover:border-zinc-700 text-white"
                              }`}
                            >
                              <span>Question {safeIndex + 1}</span>
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                            </button>
                            
                            <AnimatePresence>
                              {isQuestionDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setIsQuestionDropdownOpen(false)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className={`absolute left-0 mt-2 w-48 rounded-xl border p-2 shadow-2xl z-20 overflow-y-auto max-h-60 ${
                                      isLightMode 
                                        ? "bg-white border-zinc-250 text-zinc-850" 
                                        : "bg-[#0f0f11] border-zinc-800 text-slate-200"
                                    }`}
                                  >
                                    <span className="text-[9px] font-mono tracking-widest text-[#a855f7] uppercase px-2.5 py-1 block border-b border-white/5 mb-1">
                                      Jump to Question
                                    </span>
                                    {activeQuestions.map((item, id) => {
                                      const ans = answeredState[item.question_text];
                                      const chs = selectedAnswers[item.question_text];
                                      const corr = chs === item.correct_answer;
                                      return (
                                        <button
                                          key={id}
                                          type="button"
                                          onClick={() => {
                                            setCurrentQuizIdx(id);
                                            setIsQuestionDropdownOpen(false);
                                          }}
                                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-sans flex items-center justify-between transition-colors cursor-pointer ${
                                            safeIndex === id 
                                              ? (isLightMode ? "bg-zinc-100 text-indigo-600 font-bold" : "bg-white/10 text-white font-bold") 
                                              : (isLightMode ? "hover:bg-zinc-50" : "hover:bg-[#141517]")
                                          }`}
                                        >
                                          <span>Q#{id + 1}</span>
                                          {ans ? (
                                            corr ? (
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            ) : (
                                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                            )
                                          ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Subject reference tag badge */}
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-sans font-semibold border ${
                            isLightMode 
                              ? "bg-yellow-50/50 border-yellow-200 text-amber-800"
                              : "bg-amber-500/5 border-amber-500/10 text-amber-400"
                          }`}>
                            <Tag className="w-3.5 h-3.5 stroke-[1.8] text-amber-500 animate-pulse" />
                            <span>{getQuestionTag(q.question_text)}</span>
                          </div>
                        </div>

                        {/* Back Settings utility */}
                        <button
                          type="button"
                          onClick={() => setQuizStarted(false)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-colors cursor-pointer ${
                            isLightMode 
                              ? "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          <Settings2 className="w-3.5 h-3.5 text-[#a855f7]" />
                          <span>Quiz Settings</span>
                        </button>
                      </div>

                      {/* Central question text */}
                      <h3 className={`text-sm sm:text-base md:text-lg font-bold font-sans leading-relaxed tracking-tight py-2 ${
                        isLightMode ? "text-zinc-900 font-bold" : "text-white"
                      }`}>
                        {q.question_text}
                      </h3>

                      {/* Display options based on active quiz type */}
                      {quizType === "MCQ" ? (
                        <div className="grid grid-cols-1 gap-3 hover:cursor-pointer" id="choices-grid">
                          {q.choices.slice(0, answerDensity).map((choice, cidx) => {
                            const isChoiceSelected = selected === choice;
                            const isChoiceCorrect = choice === q.correct_answer;

                            // Calculate option state and styles contiguously
                            let btnStyle = "";
                            let circleIconElement = null;

                            if (hasAnswered) {
                              if (isChoiceCorrect) {
                                btnStyle = isLightMode 
                                  ? "bg-green-100/50 border-green-400 text-green-900 shadow-sm" 
                                  : "bg-[#0f1d13] border-emerald-500/40 text-emerald-200";
                                circleIconElement = (
                                  <div className="w-5 h-5 rounded-full bg-emerald-500/25 border border-emerald-500 text-emerald-400 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
                                  </div>
                                );
                              } else if (isChoiceSelected && !isCorrect) {
                                btnStyle = isLightMode 
                                  ? "bg-red-100/50 border-red-400 text-red-900 shadow-sm" 
                                  : "bg-[#251214] border-rose-500/40 text-rose-200";
                                circleIconElement = (
                                  <div className="w-5 h-5 rounded-full bg-rose-500/25 border border-rose-500 text-rose-400 flex items-center justify-center shrink-0">
                                    <XCircle className="w-3.5 h-3.5 stroke-[2.2]" />
                                  </div>
                                );
                              } else {
                                btnStyle = isLightMode 
                                  ? "bg-zinc-100/40 border-zinc-150 text-zinc-405 opacity-40" 
                                  : "bg-white/[0.005] border-white/5 text-slate-500 opacity-40";
                                circleIconElement = (
                                  <div className="w-5 h-5 rounded-full border border-zinc-400/25 flex items-center justify-center shrink-0" />
                                );
                              }
                            } else {
                              btnStyle = isLightMode
                                ? "bg-white border-zinc-250 hover:border-indigo-400 hover:bg-zinc-50 hover:text-indigo-700 active:scale-99 text-zinc-700 shadow-xs"
                                : "bg-[#101112] hover:bg-[#141516] border-zinc-800 hover:border-zinc-700 hover:text-white active:scale-99 text-slate-300";
                              circleIconElement = (
                                <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700/60 flex items-center justify-center shrink-0" />
                              );
                            }

                            return (
                              <button
                                id={`choice-button-${cidx}`}
                                key={cidx}
                                disabled={hasAnswered}
                                onClick={() => handleSelectQuizAnswer(q.question_text, choice, q.correct_answer)}
                                className={`flex items-center gap-3 w-full text-left text-xs sm:text-sm py-4 px-5 rounded-xl border transition-all duration-150 cursor-pointer ${btnStyle}`}
                              >
                                {circleIconElement}
                                <span className="font-sans leading-relaxed text-[13px]">{choice}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : quizType === "Fill-In-The-Blanks" ? (
                        <div className="space-y-3" id="fitb-input-container">
                          <div className="flex gap-2.5">
                            <input
                              id="fitb-input-paginated"
                              type="text"
                              disabled={hasAnswered}
                              placeholder="Type your answered concept term here..."
                              defaultValue={selected || ""}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !hasAnswered) {
                                  const val = (e.target as HTMLInputElement).value.trim();
                                  if (val) handleSelectQuizAnswer(q.question_text, val, q.correct_answer);
                                }
                              }}
                              className={`text-xs sm:text-sm py-3 px-4 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors flex-1 placeholder:text-zinc-550 font-sans border ${
                                isLightMode 
                                  ? "bg-white border-zinc-300 text-zinc-900" 
                                  : "bg-zinc-950 border-zinc-800 text-slate-100 placeholder:text-zinc-650"
                              }`}
                            />
                            <button
                              id="fitb-submit-paginated"
                              type="button"
                              disabled={hasAnswered}
                              onClick={() => {
                                const input = document.getElementById("fitb-input-paginated") as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  handleSelectQuizAnswer(q.question_text, input.value.trim(), q.correct_answer);
                                }
                              }}
                              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-mono font-bold px-5 py-3 rounded-xl cursor-pointer"
                            >
                              Grade
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3" id="short-ans-container">
                          <div className="flex flex-col gap-2.5">
                            <textarea
                              id="short-ans-input-paginated"
                              disabled={hasAnswered}
                              placeholder="Describe your conceptual short explanation..."
                              rows={3}
                              defaultValue={selected || ""}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && !hasAnswered) {
                                  e.preventDefault();
                                  const val = (e.target as HTMLTextAreaElement).value.trim();
                                  if (val) handleSelectQuizAnswer(q.question_text, val, q.correct_answer);
                                }
                              }}
                              className={`text-xs sm:text-sm py-3 px-4 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors flex-1 placeholder:text-zinc-550 font-sans resize-none border ${
                                isLightMode 
                                  ? "bg-white border-zinc-300 text-zinc-900" 
                                  : "bg-zinc-950 border-zinc-800 text-slate-100 placeholder:text-zinc-650"
                              }`}
                            />
                            <button
                              id="short-ans-submit-paginated"
                              type="button"
                              disabled={hasAnswered}
                              onClick={() => {
                                const input = document.getElementById("short-ans-input-paginated") as HTMLTextAreaElement;
                                if (input && input.value.trim()) {
                                  handleSelectQuizAnswer(q.question_text, input.value.trim(), q.correct_answer);
                                }
                              }}
                              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-mono font-bold py-3 px-5 rounded-xl cursor-pointer self-stretch sm:self-end flex items-center justify-center"
                            >
                              Grade Response
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Detailed Amber Explanation System (Matches screenshot) */}
                      {hasAnswered && (
                        <div 
                          className={`p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed relative overflow-hidden transition-all duration-300 border-l-4 mt-6 ${
                            isLightMode 
                              ? "bg-amber-50/70 border-zinc-200 border-l-amber-500 text-zinc-800 shadow-sm"
                              : "bg-amber-500/[0.04] border-white/5 border-l-amber-500 text-amber-200"
                          }`}
                          id={`explain-block-${safeIndex}`}
                        >
                          <div className="flex gap-3.5 items-start">
                            <div className={`p-1.5 rounded-lg flex-shrink-0 flex items-center justify-center ${
                              isLightMode ? "bg-amber-100 text-amber-700" : "bg-amber-500/15 text-amber-400"
                            }`}>
                              <Lightbulb className="w-4 h-4 stroke-[2]" />
                            </div>
                            <div className="space-y-1">
                              <span className={`font-bold font-display text-xs ${isLightMode ? "text-amber-900" : "text-amber-300"}`}>
                                Explanation
                              </span>
                              <p className={`mt-0.5 leading-relaxed font-sans ${isLightMode ? "text-zinc-650" : "text-slate-300"}`}>
                                {q.explanation}
                              </p>
                              {!isCorrect && q.correct_answer && (
                                <p className={`mt-2.5 text-xs font-semibold font-mono ${isLightMode ? "text-green-700" : "text-green-400"}`}>
                                  ✓ Expected: {q.correct_answer}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Low console toolbar: Previous, Ask AI input, Next */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-6 items-center justify-between border-t border-white/5 mt-6" id="quiz-footer-actions">
                        <button
                          type="button"
                          disabled={safeIndex === 0}
                          onClick={() => {
                            setCurrentQuizIdx(prev => Math.max(0, prev - 1));
                            setIsQuestionDropdownOpen(false);
                          }}
                          className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold font-mono transition-all w-full sm:w-auto justify-center cursor-pointer ${
                            safeIndex === 0
                              ? "opacity-35 cursor-not-allowed text-zinc-500 pointer-events-none"
                              : (isLightMode 
                                  ? "bg-zinc-100 border border-zinc-250 text-zinc-700 hover:bg-zinc-200" 
                                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10")
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous</span>
                        </button>

                        {/* Ask AI Contextual prompt input panel */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (quizHelpInput.trim()) {
                              handleAskAIHelp(quizHelpInput, q);
                              setQuizHelpInput("");
                            }
                          }}
                          className={`flex items-center flex-grow w-full rounded-xl border px-3 py-1.5 transition-colors ${
                            isLightMode 
                              ? "bg-white border-zinc-300 focus-within:border-indigo-400" 
                              : "bg-[#0a0a0b] border-zinc-800 focus-within:border-indigo-500/40"
                          }`}
                        >
                          <input
                            type="text"
                            value={quizHelpInput}
                            onChange={(e) => setQuizHelpInput(e.target.value)}
                            placeholder="Ask AI for help..."
                            className={`text-xs focus:outline-none flex-grow bg-transparent font-sans px-2 py-1 placeholder:text-zinc-500 ${
                              isLightMode ? "text-zinc-800" : "text-slate-200"
                            }`}
                          />
                          <button
                            type="submit"
                            disabled={!quizHelpInput.trim()}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                              quizHelpInput.trim() 
                                ? "bg-purple-600 hover:bg-purple-500 text-white cursor-pointer" 
                                : "bg-zinc-800/45 text-zinc-500 opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>

                        <button
                          type="button"
                          onClick={() => {
                            if (safeIndex < activeQuestions.length - 1) {
                              setCurrentQuizIdx(prev => prev + 1);
                              setIsQuestionDropdownOpen(false);
                            } else {
                              // Wrap up diagnostic session returning to configured parameters
                              setQuizStarted(false);
                            }
                          }}
                          className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs font-bold font-mono transition-all w-full sm:w-auto justify-center cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/20"
                        >
                          <span>{safeIndex === activeQuestions.length - 1 ? "Finish Quiz" : "Next"}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 3: Active Recall Flashcards */}
      {activeTab === "flashcards" && (
        <motion.div
          key="flashcards"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`rounded-3xl p-6 relative border ${isLightMode ? "bg-white border-zinc-200 shadow-sm" : "bg-white/5 border-white/10 backdrop-blur-md"}`}
          id="tab-flashcards-content"
        >
          {(() => {
            const getCardStyle = (theme?: string) => {
              const mode = isLightMode ? "light" : "dark";
              const themes: Record<string, Record<"light" | "dark", string>> = {
                indigo: {
                  light: "bg-gradient-to-br from-indigo-50/95 via-purple-50/90 to-pink-50/95 border-indigo-250 text-indigo-950 shadow-xl shadow-indigo-100",
                  dark: "bg-gradient-to-br from-[#1e1b4b]/95 via-[#311b92]/80 to-[#4a148c]/95 border-indigo-500/35 text-white shadow-2xl shadow-indigo-950/40"
                },
                rose: {
                  light: "bg-gradient-to-br from-rose-50/95 via-orange-50/90 to-red-50/95 border-rose-250 text-rose-950 shadow-xl shadow-rose-100",
                  dark: "bg-gradient-to-br from-[#4c0519]/95 via-[#881337]/80 to-[#b91c1c]/95 border-rose-500/35 text-white shadow-2xl shadow-rose-950/40"
                },
                emerald: {
                  light: "bg-gradient-to-br from-emerald-50/95 via-teal-50/90 to-cyan-50/95 border-emerald-250 text-emerald-950 shadow-xl shadow-emerald-100",
                  dark: "bg-gradient-to-br from-[#022c22]/95 via-[#064e3b]/80 to-[#0f766e]/95 border-emerald-500/35 text-white shadow-2xl shadow-emerald-950/40"
                },
                amber: {
                  light: "bg-gradient-to-br from-amber-50/95 via-yellow-50/90 to-orange-50/95 border-amber-250 text-amber-950 shadow-xl shadow-amber-100",
                  dark: "bg-gradient-to-br from-[#451a03]/95 via-[#78350f]/80 to-[#b45309]/95 border-amber-500/35 text-white shadow-2xl shadow-amber-950/40"
                },
                fuchsia: {
                  light: "bg-gradient-to-br from-fuchsia-50/95 via-purple-50/90 to-pink-50/95 border-fuchsia-250 text-fuchsia-950 shadow-xl shadow-fuchsia-100",
                  dark: "bg-gradient-to-br from-[#4a044e]/95 via-[#701a75]/80 to-[#a21caf]/95 border-fuchsia-500/35 text-white shadow-2xl shadow-fuchsia-950/40"
                },
                blue: {
                  light: "bg-gradient-to-br from-sky-50/95 via-blue-50/90 to-indigo-50/95 border-sky-250 text-blue-950 shadow-xl shadow-blue-100",
                  dark: "bg-gradient-to-br from-[#0c4a6e]/95 via-[#0369a1]/80 to-[#1d4ed8]/95 border-blue-500/35 text-white shadow-2xl shadow-blue-950/40"
                },
                violet: {
                  light: "bg-gradient-to-br from-violet-50/95 via-purple-50/90 to-indigo-50/95 border-violet-250 text-violet-950 shadow-xl shadow-violet-100",
                  dark: "bg-gradient-to-br from-[#2e1065]/95 via-[#4c1d95]/80 to-[#6d28d9]/95 border-violet-500/35 text-white shadow-2xl shadow-violet-950/40"
                },
                orange: {
                  light: "bg-gradient-to-br from-orange-50/95 via-amber-50/90 to-red-50/95 border-orange-250 text-orange-950 shadow-xl shadow-orange-100",
                  dark: "bg-gradient-to-br from-[#431407]/95 via-[#7c2d12]/80 to-[#ea580c]/95 border-orange-500/35 text-white shadow-2xl shadow-orange-950/40"
                }
              };
              return (themes[theme || "indigo"] || themes["indigo"])[mode];
            };

            return (
              <>
                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 mb-6 ${isLightMode ? "border-zinc-200" : "border-white/10"}`}>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className={`text-sm font-bold uppercase tracking-wider font-display ${isLightMode ? "text-zinc-900" : "text-slate-101"}`}>Active Recall Flashcards</h4>
                      <p className="text-[11px] text-zinc-500">Practice with custom generated spaced-repetition memory keys.</p>
                    </div>
                  </div>
                  {currentUser.account_tier === "Free" && (
                    <span className="self-start sm:self-auto bg-amber-400/10 text-amber-500 border border-amber-500/25 text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-1 rounded-full">
                      Freemium Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* LEFT COLUMN: Deck Builder & Custom Creator (col-span-5) */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Card 1: AI Generation Settings */}
                    <div className={`p-5 rounded-2xl border ${isLightMode ? "bg-zinc-50/50 border-zinc-200" : "bg-white/5 border-white/10"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 font-mono">
                          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                          AI Flashcard Generator
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Select Pack Size presets */}
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                            Select Flashcard Pack Size
                          </label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {[10, 15, 30, 50, 100].map((num) => {
                              const isFreeOption = num === 10 || num === 15;
                              const isSelected = fcGenQuantity === num;
                              return (
                                <button
                                  key={num}
                                  id={`fc-pack-${num}`}
                                  type="button"
                                  onClick={() => {
                                    setFcGenQuantity(num);
                                  }}
                                  className={`py-2 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center border relative ${
                                    isSelected
                                      ? (isLightMode ? "bg-indigo-600 border-indigo-600 text-white" : "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-950/55")
                                      : (isLightMode ? "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50" : "bg-white/5 border-white/10 text-slate-455 hover:text-slate-100")
                                  }`}
                                >
                                  <span>{num}</span>
                                  <span className={`text-[8px] font-normal uppercase ${isSelected ? "text-indigo-100" : "text-zinc-500"}`}>
                                    {isFreeOption ? "Free" : "👑"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Range slider for perfect precision, up to 100 */}
                        <div>
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                            <span>Custom Cards count:</span>
                            <span className="font-bold text-indigo-400">
                              {fcGenQuantity} Cards { (fcGenQuantity !== 10 && fcGenQuantity !== 15) && "👑" }
                            </span>
                          </div>
                          <input
                            id="range-quantity-slider"
                            type="range"
                            min={1}
                            max={100}
                            value={fcGenQuantity}
                            onChange={(e) => {
                              setFcGenQuantity(parseInt(e.target.value));
                            }}
                            className="w-full h-1.5 bg-zinc-300 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                          <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1">
                            <span>1 Card</span>
                            <span>15 (Free limit)</span>
                            <span>100 (Max limit)</span>
                          </div>
                        </div>

                        {/* Warning for Free Users selecting more than 15 */}
                        {currentUser.account_tier === "Free" && (fcGenQuantity !== 10 && fcGenQuantity !== 15) && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-amber-500 text-[10px] leading-relaxed font-sans">
                            <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <div>
                              <b>Premium Feature</b>: Pack sizes other than 10 or 15 require the Premium tier workspace upgrade.
                            </div>
                          </div>
                        )}

                        {/* Loading Stripe Indicator */}
                        {isGeneratingFlashcards && (
                          <div className="space-y-1.5 animate-pulse" id="fc-generation-loading-stripe">
                            <div className="flex justify-between items-center text-[10px] font-mono text-indigo-400">
                              <span>AI Ingesting Material context...</span>
                              <span className="font-bold">Please wait</span>
                            </div>
                            <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden relative">
                              <div className="absolute inset-0 bg-indigo-600 loading-stripe-bar rounded-full" style={{ width: "100%" }} />
                            </div>
                          </div>
                        )}

                        {/* Error display */}
                        {fcGenError && (
                          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[11px] leading-relaxed">
                            {fcGenError}
                          </div>
                        )}

                        {/* Trigger Action */}
                        <button
                          id="btn-generate-fc"
                          type="button"
                          disabled={isGeneratingFlashcards}
                          onClick={handleGenerateAIFlashcards}
                          className={`w-full py-3.5 px-4 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            isGeneratingFlashcards
                              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                              : (isLightMode ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-100" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-950/40")
                          }`}
                        >
                          {isGeneratingFlashcards ? (
                            <>
                              <RotateCw className="w-4 h-4 animate-spin" />
                              Generating Pack...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              {`Generate ${fcGenQuantity} Flashcards`}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Card 2: Create Custom Flashcard */}
                    <div className={`p-5 rounded-2xl border ${isLightMode ? "bg-zinc-50/55 border-zinc-200" : "bg-white/5 border-white/10"}`}>
                      <button
                        id="btn-toggle-custom-f"
                        type="button"
                        onClick={() => setIsAddingCustomCard(!isAddingCustomCard)}
                        className="w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider text-purple-400"
                      >
                        <span className="flex items-center gap-1.5 text-purple-400 font-mono">
                          <Plus className="w-4 h-4" />
                          Create Custom Flashcard { currentUser.account_tier !== "Premium" && "👑" }
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {isAddingCustomCard ? "Collapse" : "Expand"}
                        </span>
                      </button>

                      {isAddingCustomCard && (
                        <div className="mt-4 space-y-4 pt-4 border-t border-zinc-200 dark:border-white/5">
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                              Question / Front Text
                            </label>
                            <textarea
                              id="custom-fc-front"
                              rows={2}
                              placeholder="e.g., What is cellular respiration?"
                              value={customCardFront}
                              onChange={(e) => setCustomCardFront(e.target.value)}
                              className={`w-full text-xs p-2.5 border rounded-xl font-sans focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                                isLightMode ? "bg-white border-zinc-300 text-zinc-900" : "bg-zinc-900 border-white/10 text-white"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                              Answer / Explanation Back Text
                            </label>
                            <textarea
                              id="custom-fc-back"
                              rows={3}
                              placeholder="e.g., Cellular respiration is a metabolic pathway that breaks down glucose..."
                              value={customCardBack}
                              onChange={(e) => setCustomCardBack(e.target.value)}
                              className={`w-full text-xs p-2.5 border rounded-xl font-sans focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                                isLightMode ? "bg-white border-zinc-300 text-zinc-900" : "bg-zinc-900 border-white/10 text-white"
                              }`}
                            />
                          </div>

                          {/* Color selector for customized appearance */}
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                              Card Color Theme
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[
                                { key: "indigo", name: "Lavender", bg: "bg-indigo-500" },
                                { key: "rose", name: "Rose", bg: "bg-rose-500" },
                                { key: "emerald", name: "Emerald", bg: "bg-emerald-500" },
                                { key: "amber", name: "Amber", bg: "bg-amber-500" },
                                { key: "fuchsia", name: "Fuchsia", bg: "bg-fuchsia-500" },
                                { key: "blue", name: "Ocean", bg: "bg-sky-500" },
                                { key: "violet", name: "Violet", bg: "bg-violet-500" },
                                { key: "orange", name: "Sunset", bg: "bg-orange-500" }
                              ].map((col) => {
                                const isColorSelected = customCardColor === col.key;
                                return (
                                  <button
                                    key={col.key}
                                    type="button"
                                    onClick={() => setCustomCardColor(col.key)}
                                    className={`p-1.5 border rounded-xl flex items-center justify-center gap-1 font-sans text-[9px] cursor-pointer transition-all ${
                                      isColorSelected 
                                        ? (isLightMode ? "border-purple-600 bg-zinc-100 font-semibold" : "border-purple-500 bg-white/10 font-semibold text-white") 
                                        : (isLightMode ? "border-zinc-200 text-zinc-650" : "border-transparent text-slate-400 opacity-80 hover:opacity-100")
                                    }`}
                                  >
                                    <span className={`w-2.5 h-2.5 rounded-full ${col.bg} shrink-0`} />
                                    <span className="truncate">{col.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Feedback states */}
                          {customCardSuccess && (
                            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] leading-relaxed flex items-center gap-1.5 font-sans">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              Custom flashcard saved to library stack successfully!
                            </div>
                          )}

                          {customCardError && (
                            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] leading-relaxed">
                              {customCardError}
                            </div>
                          )}

                          {/* Paywall Warning inside custom creator */}
                          {currentUser.account_tier === "Free" && (
                            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-amber-500 text-[10px] leading-relaxed font-sans">
                              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 animate-pulse" />
                              <div>
                                Custom card design is exclusive to the premium tier workspace upgrade.
                              </div>
                            </div>
                          )}

                          <button
                            id="btn-save-custom-card"
                            type="button"
                            onClick={(e) => handleCreateCustomFlashcard(e as any)}
                            className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-mono rounded-xl text-[11px] leading-none uppercase tracking-wider transition-all cursor-pointer shadow"
                          >
                            ＋ Save Flashcard
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* RIGHT COLUMN: Spaced-Repetition Interactive Flipping Deck (col-span-7) */}
                  <div className="lg:col-span-7 flex flex-col justify-between min-h-[360px]">
                    
                    {flashcards.length === 0 ? (
                      <div className={`p-10 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3 h-full min-h-[300px] ${
                        isLightMode ? "bg-zinc-50/50 border-zinc-200" : "bg-white/5 border-white/10"
                      }`}>
                        <Layers className="w-8 h-8 text-indigo-400 opacity-60 animate-bounce" />
                        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                          No flashcards encountered in your active recall deck library yet. Choose your pack size on the left and select generate, or construct your first custom card!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6 flex flex-col justify-between h-full" id="flashcard-deck">
                        <div>
                          <div className="flex justify-between items-center text-xs text-slate-500 font-mono mb-3">
                            <span className="flex items-center gap-1">
                              Recall Deck Loop: 
                              <span className="text-indigo-400 font-bold font-mono">
                                {flashcards[currentFCIndex]?.is_custom ? "Personal Card ✨" : "AI Ingested"}
                              </span>
                            </span>
                            <span>{currentFCIndex + 1} / {flashcards.length} cards</span>
                          </div>

                          {/* 3D double sided flip segment */}
                          {flashcards[currentFCIndex] && (
                            <div 
                              id={`fcard-wrapper-${currentFCIndex}`}
                              onClick={() => toggleCardFlip(flashcards[currentFCIndex].id)}
                              className="h-72 relative perspective-1000 cursor-pointer group"
                            >
                              {/* Render style according to color_theme */}
                              <div 
                                key={currentFCIndex}
                                style={{ transition: "transform 0.6s" }}
                                className={`w-full h-full duration-550 preserve-3d relative rounded-2xl shadow-xl ${
                                  flippedCardIds[flashcards[currentFCIndex].id ?? ""] ? "rotate-y-180" : ""
                                }`}
                              >
                                {/* FRONT SIDE */}
                                <div className={`absolute inset-0 p-8 flex flex-col justify-between rounded-2xl backface-hidden border ${
                                  getCardStyle(flashcards[currentFCIndex].color_theme || "indigo")
                                }`}>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-mono tracking-widest uppercase opacity-75">
                                      {flashcards[currentFCIndex].is_custom ? "✨ Personal recall" : "🧠 Recall Prompt"}
                                    </span>
                                    
                                    {/* Trash button to delete custom or AI card */}
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        title="Delete Flashcard"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteFlashcard(flashcards[currentFCIndex].id);
                                        }}
                                        className="p-1 px-1.5 rounded-lg bg-zinc-950/25 border border-white/5 text-rose-400 hover:bg-zinc-950/50 hover:text-rose-500 transition-all cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                      <RotateCw className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                  
                                  <h4 className="text-center text-sm md:text-base font-semibold px-4 font-sans leading-relaxed tracking-tight overflow-y-auto max-h-36">
                                    {flashcards[currentFCIndex].question_front}
                                  </h4>
                                  
                                  <div className="text-center text-[9px] font-mono opacity-65">
                                    Click anywhere on the card to flip answers
                                  </div>
                                </div>

                                {/* BACK SIDE */}
                                <div className={`absolute inset-0 rotate-y-180 p-8 flex flex-col justify-between rounded-2xl backface-hidden border ${
                                  getCardStyle(flashcards[currentFCIndex].color_theme || "indigo")
                                }`}>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-mono tracking-widest uppercase opacity-75 animate-pulse">
                                      ✅ VERIFIED ANSWER
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        title="Delete Flashcard"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteFlashcard(flashcards[currentFCIndex].id);
                                        }}
                                        className="p-1 px-1.5 rounded-lg bg-zinc-950/25 border border-white/5 text-rose-400 hover:bg-zinc-950/50 hover:text-rose-500 transition-all cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                      <RotateCw className="w-4 h-4 opacity-50" />
                                    </div>
                                  </div>
                                  
                                  <div className="overflow-y-auto max-h-36 px-2 text-center text-xs md:text-sm font-sans leading-relaxed">
                                    {flashcards[currentFCIndex].answer_back}
                                  </div>
                                  
                                  <div className="text-center text-[9px] font-mono opacity-65">
                                    Click to rotate card back to front
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Carousel navigation buttons */}
                        <div className="flex justify-between items-center gap-4 mt-4">
                          <button
                            id="prev-fc-btn"
                            type="button"
                            disabled={currentFCIndex === 0}
                            onClick={() => setCurrentFCIndex(p => Math.max(0, p - 1))}
                            className={`px-4 py-2.5 rounded-xl transition-colors text-xs font-mono disabled:opacity-40 select-none cursor-pointer flex items-center gap-1.5 border ${
                              isLightMode 
                                ? "bg-white border-zinc-250 hover:bg-zinc-50 text-zinc-650" 
                                : "bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400"
                            }`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Prev Card
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setFlippedCardIds({})}
                            className="text-[10px] font-mono hidden sm:block text-slate-500 hover:text-indigo-400 cursor-pointer"
                          >
                            Reset facing front
                          </button>

                          <button
                            id="next-fc-btn"
                            type="button"
                            disabled={currentFCIndex === flashcards.length - 1}
                            onClick={() => setCurrentFCIndex(p => Math.min(flashcards.length - 1, p + 1))}
                            className={`px-4 py-2.5 rounded-xl transition-colors text-xs font-mono disabled:opacity-40 select-none cursor-pointer flex items-center gap-1.5 border ${
                              isLightMode 
                                ? "bg-white border-zinc-250 hover:bg-zinc-50 text-zinc-655" 
                                : "bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400"
                            }`}
                          >
                            Next Card
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                  </div>

                </div>
              </>
            );
          })()}
        </motion.div>
      )}

      {/* TAB 4: Multimodal Assistant AI Chatbot */}
      {activeTab === "chatbot" && (
        <motion.div
          key="chatbot"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`rounded-3xl p-6 border ${isLightMode ? "bg-white border-zinc-200 shadow-sm" : "bg-white/5 border border-white/10 backdrop-blur-md"}`}
          id="tab-chatbot-content"
        >
          <div className={`flex items-center gap-2 border-b pb-4 mb-4 ${isLightMode ? "border-zinc-200" : "border-white/10"}`}>
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h4 className={`text-sm font-bold uppercase tracking-wider font-display ${isLightMode ? "text-zinc-909" : "text-slate-100"}`}>Multimodal Assistant Chat</h4>
          </div>

          {currentUser.account_tier === "Free" ? (
            <div className={`flex flex-col items-center justify-center p-12 text-center space-y-4 rounded-2xl relative overflow-hidden min-h-[300px] border ${isLightMode ? "bg-zinc-50/50 border-zinc-200 shadow-sm" : "bg-white/5 border border-white/10 backdrop-blur-xl"}`} id="premium-chatbot-lock">
              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-505/10 rounded-full blur-2xl" />
              <div className="p-3 bg-indigo-500/10 border border-[#a855f7]/20 rounded-full animate-bounce">
                <Lock className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-sm font-bold ${isLightMode ? "text-zinc-900" : "text-white"}`}>Unlock Academic AI Study Companion</h3>
                <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isLightMode ? "text-zinc-600" : "text-slate-400"}`}>
                  Interactive Q&amp;A document tutoring is a Premium Feature. Live-solve formulas, summarize citations, and brainstorm with our full context-window AI Tutor.
                </p>
              </div>
              <button
                id="upgrade-paywall-chat-btn"
                type="button"
                onClick={onOpenPaywall}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono uppercase tracking-widest text-[10px] py-3.5 px-6 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-950/40"
              >
                Access Premium for $14.99/mo
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-[400px] justify-between" id="chatbot-terminal">
              {/* Thread Scroll lists */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 p-2" id="chats-messages-scroll">
                {chatLog.map((msg, i) => {
                  const isAI = msg.message_sender === "AI";
                  return (
                    <div 
                      key={msg.id || i} 
                      className={`flex gap-3 max-w-[85%] ${isAI ? "self-start" : "self-end ml-auto flex-row-reverse"}`}
                      id={`chat-bubble-${msg.id}`}
                    >
                      <div className={`p-2.5 rounded-full border shrink-0 ${
                        isAI 
                          ? (isLightMode ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-indigo-505/10 border-indigo-505/20 text-indigo-400") 
                          : (isLightMode ? "bg-zinc-100 border-zinc-200 text-zinc-600" : "bg-white/10 border-white/20 text-slate-300")
                      }`}>
                        {isAI ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>

                      <div className={`p-3.5 rounded-2xl text-xs space-y-1 leading-relaxed border ${
                        isAI 
                          ? (isLightMode ? "bg-zinc-50 border-zinc-200 text-zinc-850" : "bg-white/5 border border-white/10 text-slate-200") 
                          : "bg-indigo-600 text-white border-transparent"
                      }`}>
                        {isAI ? (
                          <div dangerouslySetInnerHTML={{ __html: msg.text_payload.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                        ) : (
                          <p>{msg.text_payload}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {chatLoading && (
                  <div className="flex gap-3 max-w-[80%] self-start" id="chat-loading-indicator">
                    <div className="p-2 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-full animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className={`p-3.5 rounded-2xl border border-dashed text-[10px] font-mono ${isLightMode ? "bg-zinc-50 border-zinc-200 text-zinc-500" : "bg-white/5 border-white/10 text-slate-500"}`}>
                      Gemini assistant compiling contextual guidance...
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form with Mocks: attachments & tape voice dictate */}
              <form onSubmit={handleSendChatMessage} className={`border-t pt-4 mt-3 space-y-2 ${isLightMode ? "border-zinc-200" : "border-white/10"}`}>
                
                {attachedFileMock && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] w-max border ${
                    isLightMode 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                      : "bg-indigo-500/5 border border-indigo-500/20 text-indigo-305"
                  }`} id="attached-mock-indicator">
                    <Paperclip className="w-3 h-3 text-indigo-400" />
                    <span>Queued Snapshot: {attachedFileMock}</span>
                    <button
                      id="remove-attached-btn"
                      type="button"
                      onClick={() => setAttachedFileMock(null)}
                      className="text-red-500 ml-1 hover:text-red-700 font-bold"
                    >
                      (Remove)
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    id="chat-input-field"
                    type="text"
                    placeholder={dictating ? "Recording voice dictation..." : "Ask your document anything..."}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    className={`text-xs py-3 px-4 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors flex-1 font-sans border ${
                      isLightMode 
                        ? "bg-white border-zinc-250 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500/80" 
                        : "bg-white/5 border border-white/10 text-slate-100 placeholder:text-zinc-650"
                    }`}
                  />

                  {/* Simulated Audio Dictation button */}
                  <button
                    id="voice-dictation-btn"
                    type="button"
                    onClick={simulateDictation}
                    disabled={chatLoading}
                    className={`p-3 rounded-xl transition-all border cursor-pointer ${
                      dictating 
                        ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/30 animate-pulse" 
                        : (isLightMode 
                            ? "bg-white border-zinc-250 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-xs" 
                            : "bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200")
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Simulated attachments drop triggers */}
                  <div className="relative group">
                    <button
                      id="attach-file-btn"
                      type="button"
                      disabled={chatLoading}
                      className={`p-3 rounded-xl cursor-pointer border ${
                        isLightMode 
                          ? "bg-white border-zinc-250 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm" 
                          : "bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <div className={`hidden group-hover:block absolute bottom-full right-0 p-2 rounded-xl shadow-2xl w-40 z-20 space-y-1 border ${
                      isLightMode 
                        ? "bg-white border-zinc-200" 
                        : "bg-zinc-950 border border-white/10 backdrop-blur-md"
                    }`}>
                      <span className="text-[8px] font-mono text-zinc-500 block p-1 uppercase">Attach Snapshot</span>
                      <button
                        id="attach-pdf-mock"
                        type="button"
                        onClick={() => handleAttachMockFile("PDF")}
                        className={`w-full text-left text-[10px] p-1 rounded ${
                          isLightMode ? "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900" : "text-slate-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        📸 Photo Snapshot
                      </button>
                      <button
                        id="attach-jpeg-mock"
                        type="button"
                        onClick={() => handleAttachMockFile("Note")}
                        className={`w-full text-left text-[10px] p-1 rounded ${
                          isLightMode ? "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900" : "text-slate-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        📝 Homework Scan
                      </button>
                    </div>
                  </div>

                  <button
                    id="send-chat-btn"
                    type="submit"
                    disabled={chatLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 5: Settings & Profile Management */}
      {activeTab === "settings" && (
        <motion.div
          key="settings"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-md"
          id="tab-settings-content"
        >
          <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-6">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-display">Settings & Workspace Adjustments</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-layouts">
            
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider block font-semibold">Workspace tuning choice</span>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans mb-3">
                Adjusting this setting automatically converts the vocabulary, depth, and explanatory structures of any documents or testing modules created next.
              </p>
              
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {subjects.map((sub) => {
                  const isChecked = currentUser.selected_subject === sub;
                  return (
                    <button
                      id={`tune-sub-btn-${sub}`}
                      type="button"
                      key={sub}
                      onClick={() => onSubjectChange(sub)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left font-mono transition-all cursor-pointer ${
                        isChecked 
                          ? "bg-white/10 border-indigo-505/30 text-indigo-300 font-semibold shadow-inner" 
                          : "bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300 hover:bg-white/[0.02]"
                      }`}
                    >
                      <span>🎓 {sub}</span>
                      {isChecked && <Flame className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />}
                    </button>
                  );
                })}

                {/* Special Custom Subject option button */}
                {(() => {
                  const isCustom = !subjects.includes(currentUser.selected_subject);
                  return (
                    <button
                      id="tune-sub-btn-custom"
                      type="button"
                      onClick={() => onSubjectChange("Custom")}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left font-mono transition-all cursor-pointer ${
                        isCustom 
                          ? "bg-white/10 border-indigo-500/30 text-indigo-300 font-bold shadow-inner" 
                          : "bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300 hover:bg-white/[0.02]"
                      }`}
                    >
                      <span>
                        {isCustom ? `🔮 Custom: ${currentUser.selected_subject}` : "🔮 Setup Custom Subject..."}
                      </span>
                      {isCustom && <Flame className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />}
                    </button>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-6">
              {/* Plan Management Segment */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                <span className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider block font-semibold">Billing details</span>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Monitor and manage subscription structures. Upgraded memberships authorize endless uploads, TTS readers and cards.
                </p>

                <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block leading-none">Subscription Profile</span>
                    <strong className="text-xs text-indigo-300 font-mono">{currentUser.account_tier}</strong>
                  </div>
                  {currentUser.account_tier === "Free" ? (
                    <button
                      id="upgrade-trigger-btn"
                      type="button"
                      onClick={onOpenPaywall}
                      className="bg-indigo-600 hover:bg-indigo-505 text-white text-[10px] font-mono px-3.5 py-2 rounded-xl transition-colors shrink-0 uppercase cursor-pointer"
                    >
                      Upgrade To Catalyst
                    </button>
                  ) : (
                    <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono px-3 py-1 rounded-full">
                      ✓ Catalyst Active
                    </span>
                  )}
                </div>
              </div>

              {/* Account logout */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                <span className="text-xs font-semibold font-mono uppercase tracking-wider block text-slate-300 font-semibold">Command operations</span>
                <button
                  id="logout-btn"
                  type="button"
                  onClick={onLogout}
                  className="w-full bg-red-950/20 border border-red-800/30 hover:bg-red-950/30 text-red-400 text-xs py-3 rounded-xl transition-all font-mono cursor-pointer"
                >
                  Terminate Active Session
                </button>
              </div>

            </div>

          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Google Forms Confirmation Modal */}
      <AnimatePresence>
        {showConfirmFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-md w-full rounded-3xl p-6 border shadow-2xl relative z-10 ${
                isLightMode ? "bg-white border-zinc-200 text-zinc-900" : "bg-zinc-900 border-white/10 text-slate-100"
              }`}
            >
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <FileText className="w-6 h-6 text-purple-400 shrink-0" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                  Export to Google Forms?
                </h3>
              </div>

              <div className="py-4 space-y-3 text-xs leading-relaxed">
                <p>
                  This action will programmatically connect to Google Drive and compile a brand new graded quiz in your Google Forms account.
                </p>
                <div className={`p-3 rounded-xl border font-mono text-[11px] space-y-1.5 ${
                  isLightMode ? "bg-zinc-50 border-zinc-200" : "bg-white/5 border-white/5"
                }`}>
                  <div>
                    <span className="text-slate-500">Form Name:</span>{" "}
                    <span className="font-semibold text-indigo-400">
                      {currentMaterial?.title ? `${currentMaterial.title} - ${quizType} Quiz` : `CramUp ${quizType} Quiz`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Question Count:</span>{" "}
                    <span className="font-semibold text-indigo-400">{quizQuestions.length} questions</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Quiz Type:</span>{" "}
                    <span className="font-semibold text-indigo-400">{quizType}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  Note: A secure popup will verify your permissions if you haven't authorized Google Forms in this session yet.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowConfirmFormModal(false)}
                  className={`px-4 py-2 rounded-xl border transition-colors cursor-pointer ${
                    isLightMode
                      ? "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExportToGoogleForms}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer font-bold"
                >
                  Confirm Export
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
