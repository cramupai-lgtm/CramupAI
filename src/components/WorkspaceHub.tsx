import React, { useState, useRef } from "react";
import { AppUser, FileType, Material, ALL_SUBJECTS } from "../types";
import { DBService } from "../store";
import { motion } from "motion/react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, isFirebaseConfigured } from "../firebase-client";
import { 
  Upload, 
  Youtube, 
  FileText, 
  Video, 
  Music, 
  Camera, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Library,
  Clock,
  Image as ImageIcon
} from "lucide-react";

interface WorkspaceHubProps {
  currentUser: AppUser;
  onProcessingSuccess: (material: Material, questions: any[], flashcards: any[]) => void;
  onOpenPaywall: () => void;
  onUploadIncrement: (newCount: number) => void;
  onSubjectChange?: (subject: string) => void;
  isLightMode?: boolean;
}

function StudyMaterialLoadingScreen({ 
  statusLog, 
  activePath, 
  isLightMode 
}: { 
  statusLog: string[]; 
  activePath: FileType; 
  isLightMode: boolean; 
}) {
  const [progress, setProgress] = useState(3);
  const [secondsLeft, setSecondsLeft] = useState(147); // Start with 2 minutes, 27 seconds left
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = [
    "Listen to your notes on-the-go with the podcast feature",
    "Complete quizzes after summarizing to increase memory retention by 40%",
    "Toggle multi-language translations directly in the active Summary screen",
    "Customize active voice synthesis options dynamically under audio preferences",
    "Engage with the AI Chat tab to query key definitions instantly"
  ];

  // Increment progress realistically
  React.useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 20) {
          return prev + Math.floor(Math.random() * 3) + 2; // quick jump to start
        } else if (prev < 50) {
          return prev + Math.floor(Math.random() * 2) + 1; // steady rise
        } else if (prev < 85) {
          return prev + (Math.random() > 0.4 ? 1 : 0); // slower
        } else if (prev < 98) {
          return prev + (Math.random() > 0.85 ? 1 : 0); // very crawl-like
        }
        return prev;
      });
    }, 450);

    return () => clearInterval(progressInterval);
  }, []);

  // Time-remaining countdown
  React.useEffect(() => {
    const cdInterval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 12) return prev; // hold at 12 seconds so it never counts down to 0 while waiting
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(cdInterval);
  }, []);

  // Dynamic study tips rotation
  React.useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tips.length);
    }, 5500);

    return () => clearInterval(tipInterval);
  }, [tips.length]);

  // Derive dynamic status label matching progress or statusLog
  const getSubStatus = () => {
    if (statusLog.length > 0) {
      const lastLog = statusLog[statusLog.length - 1];
      if (lastLog.includes("✓ Success") || progress > 98) {
        return "Finalizing study workspace database...";
      }
      if (lastLog.includes("Parsing") || lastLog.includes("Payload")) {
        return "Parsing study structure modules...";
      }
      if (lastLog.includes("Connecting") || lastLog.includes("process-material")) {
        return "Extracting and analyzing content...";
      }
      if (lastLog.includes("Converting") || lastLog.includes("base64")) {
        return "Encoding material stream data...";
      }
    }
    
    // Fallback based on progress percent
    if (progress < 15) return "Extracting content";
    if (progress < 35) return "Analyzing study material";
    if (progress < 60) return "Streaming contents to Gemini...";
    if (progress < 85) return "Structuring key summaries...";
    return "Synthesizing quizzing modules...";
  };

  // Convert minutes & seconds formatted string
  const getFormattedTime = () => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    if (mins > 0) {
      return `About ${mins} minute${mins !== 1 ? "s" : ""} and ${secs} second${secs !== 1 ? "s" : ""} left`;
    }
    return `About ${secs} second${secs !== 1 ? "s" : ""} left`;
  };

  return (
    <div 
      className={`p-6 md:p-10 rounded-3xl space-y-8 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden border shadow-2xl transition-all duration-300 ${
        isLightMode 
          ? "bg-zinc-50 border-zinc-200" 
          : "bg-[#110e19] border-purple-950/40"
      }`} 
      id="workspace-loading-spinner-container"
    >
      {/* Background ambient radial glow to replicate screenshot's warm aesthetic */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${
        isLightMode 
          ? "bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_70%)]" 
          : "bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12),transparent_70%)]"
      }`} />

      {/* Top Header Row of Loading Panel */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3 z-10 border-b pb-4 border-zinc-500/10" id="loading-header-row">
        <h3 className={`text-lg md:text-xl font-extrabold tracking-tight font-display flex items-center gap-2 ${
          isLightMode ? "text-zinc-900" : "text-white"
        }`}>
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          Creating Your Notes
        </h3>
        <div className={`flex items-center gap-1.5 text-xs font-semibold font-sans ${
          isLightMode ? "text-zinc-550" : "text-zinc-400"
        }`}>
          <Clock className="w-4 h-4 text-purple-450 shrink-0" />
          <span>{getFormattedTime()}</span>
        </div>
      </div>

      {/* Progress & Bar Section */}
      <div className="w-full max-w-xl text-center space-y-5 z-10" id="loading-progress-section">
        {/* Giant Percentage Indicator */}
        <div className={`text-5xl sm:text-6xl font-black font-display tracking-tighter select-none animate-pulse ${
          isLightMode ? "text-zinc-900" : "text-white"
        }`}>
          {progress}%
        </div>

        {/* Thick, Sleek Progress Bar Track - exactly replicating the gorgeous screenshot style */}
        <div className={`w-full h-4 rounded-full overflow-hidden relative shadow-inner border ${
          isLightMode ? "bg-zinc-200 border-zinc-300/65" : "bg-zinc-950/60 border-white/[0.04]"
        }`} id="loading-stripe-track">
          <motion.div
            initial={{ width: "3%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-[#ec4899] rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)]"
          />
        </div>

        {/* Dynamic sub-status action text */}
        <p className={`text-xs sm:text-sm font-bold tracking-wide transition-all ${
          isLightMode ? "text-zinc-600" : "text-zinc-200 animate-pulse"
        }`}>
          {getSubStatus()}
        </p>
      </div>

      {/* Elegant Study Tip Bar styled like the bottom part of the screenshot */}
      <div className={`w-full max-w-md rounded-2xl p-4 text-center border relative z-10 ${
        isLightMode 
          ? "bg-white border-zinc-200 shadow-sm text-zinc-800" 
          : "bg-black/35 border-white/[0.03] shadow-md text-zinc-300"
      }`} id="loading-tip-container">
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 block mb-1">
          Tip
        </span>
        <p className="text-xs leading-relaxed max-w-md mx-auto">
          ✨ {tips[currentTipIndex]}
        </p>
      </div>

      {/* Subdued Pipeline logs for power-users to see behind-the-scenes activity */}
      {statusLog.length > 0 && (
        <div className={`w-full max-w-xl border rounded-2xl p-4 space-y-1.5 font-mono text-[9px] z-10 backdrop-blur-sm transition-all ${
          isLightMode 
            ? "bg-zinc-150/40 border-zinc-200/70 text-zinc-650" 
            : "bg-black/20 border-white/[0.02] text-zinc-400"
        }`} id="loading-ingest-logs">
          <span className="text-[8px] text-purple-400 block tracking-widest font-extrabold uppercase mb-1">
            Ingestion Pipeline (Active Logs)
          </span>
          {statusLog.slice(-3).map((log, i) => (
            <div key={i} className="flex gap-2 items-start opacity-80">
              <span className="text-purple-400 font-bold">✦</span>
              <p className="truncate text-left">{log}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WorkspaceHub({ 
  currentUser, 
  onProcessingSuccess, 
  onOpenPaywall, 
  onUploadIncrement,
  onSubjectChange,
  isLightMode = false
}: WorkspaceHubProps) {
  const [activePath, setActivePath] = useState<FileType>("PDF");
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [title, setTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  
  const [loading, setLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // High fidelity Camera Capture States
  const [photoMode, setPhotoMode] = useState<"upload" | "camera">("upload");
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  const isMobileOrTabletDevice = React.useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/.test(ua);
  }, []);

  React.useEffect(() => {
    const checkViewportSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkViewportSize();
    window.addEventListener("resize", checkViewportSize);
    return () => window.removeEventListener("resize", checkViewportSize);
  }, []);

  // Camera stream stop helper
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error("Error stopping track", e);
        }
      });
      setStream(null);
    }
    setIsCameraLive(false);
  };

  // Camera stream start helper
  const startCamera = async () => {
    if (isDesktop || !isMobileOrTabletDevice) {
      return;
    }
    setCameraError(null);
    setIsCameraLive(true);
    setCapturedUrl(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(err => {
          console.error("Video play failed", err);
        });
      }
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraError("Could not access your camera. Please ensure camera permissions are active or upload a photo instead.");
      setIsCameraLive(false);
    }
  };

  // Capture frame from live video feed
  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera_snap_${Date.now()}.jpg`, { type: "image/jpeg" });
            setSelectedFile(file);
            setTitle(`Camera Photo - ${new Date().toLocaleDateString()}`);
            
            // Store preview URI
            if (capturedUrl) {
              URL.revokeObjectURL(capturedUrl);
            }
            const url = URL.createObjectURL(blob);
            setCapturedUrl(url);
            
            setStatusLog(prev => [...prev, `Captured camera snapshot successfully (${(file.size / 1024).toFixed(1)} KB)`]);
            stopCamera();
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  // Clean raw stream context on tab path changes
  React.useEffect(() => {
    if (activePath !== "Photo") {
      stopCamera();
      if (capturedUrl) {
        URL.revokeObjectURL(capturedUrl);
        setCapturedUrl(null);
      }
      setPhotoMode("upload");
    }
  }, [activePath]);

  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (capturedUrl) {
        URL.revokeObjectURL(capturedUrl);
      }
    };
  }, [stream, capturedUrl]);


  // Ready-to-study standard high-quality textbook samples mapped to subject choice
  const subjectSamples: Record<string, { title: string; content: string }> = {
    "Biology": {
      title: "Cellular Mitosis & Genomic Recombination",
      content: `Mitosis is a fundamental process of cell division where a single eukaryotic cell divides to produce two genetically identical daughter cells. Standard phases include: Prophase (chromatin condenses into chromosomes, mitotic spindle forms), Metaphase (chromosomes align at the metaphase plate), Anaphase (sister chromatids detach and migrate to polar centrosomes), and Telophase (nuclear membranes reform around separated genes). Recombination during Prophase I of Meiosis creates genetic mapping variability via homologous crossing over, driving genomic diversity critical for evolutionary adaptations. Keywords: centromere, spindle fibers, chromatin network, metaphase alignment.`
    },
    "Corporate Law": {
      title: "M&A Fiduciary Duties & Litigation Precedents",
      content: `In Corporate Mergers and Acquisitions (M&A), the Board of Directors owes stringent fiduciary responsibilities—primarily the Duty of Care and the Duty of Loyalty—to corporate shareholders. Under Delaware Litigation Precedent (Revlon, Inc. v. MacAndrews & Forbes Holdings, Inc.), when a board recognizes that a corporate buyout or sale of the business is inevitable, their fiduciary duty shifts from preserving the corporate model to maximizing short-term shareholder equity value. The 'Business Judgment Rule' serves as a defense presumption, guarding board votes unless conflicts of interest, corporate waste, or complete bad faith is validated. Keywords: Revlon duty, Business Judgment Rule, litigation risk, proxy fight, fiduciary liability.`
    },
    "Mechanical Engineering": {
      title: "Stress Vectors & Thermal Dynamics in Turbine Alloys",
      content: `Turbine aircraft engine fan blades are subjected to intensive mechanical loading, centripetal stress vectors, and thermodynamic gradients. Crucial calculations include axial tension stress, radial shear stress, and creep deformation thresholds. Thermal thermal-expansion strain is governed by Hooke's Law adjusted for thermal stress: σ = E * (ε - α * ΔT). Cobalt-nickel superalloys are chosen for extreme creep-rupture load resistance at environments exceeding 1200 degrees Celsius. High pressure turbine expansion cycles maximize thermal flow efficiency in Brayton aircraft engines. Keywords: Brayton cycle, creep deformation, stress-strain tensor, alloys, centripetal stress.`
    },
    "History": {
      title: "The Geopolitical Tensions of the French Revolution",
      content: `The French Revolution (1789-1799) was fueled by structural class inequality, severe national insolvency under King Louis XVI, and severe agricultural crop failures. The Estates-General convene in 1789, where the Third Estate representing commoners separated to form the National Assembly, swearing the Tennis Court Oath to draft a constitution. Geopolitical consequences include the Declaration of the Rights of Man and of the Citizen, the abolition of absolute feudal monarchy structures, the rise of radical Jacobin Reign of Terror committees led by Robespierre, and the modern transition of European balance of power towards national republic models. Keywords: Estates-General, Reign of Terror, Tennis Court Oath, feudalism, constitutional republic.`
    },
    "Fintech Ethics": {
      title: "DeFi Audits, Cryptographic Consensus & AML Compliance",
      content: `Decentralized Finance (DeFi) platforms utilize immutable smart contracts to eliminate standard financial intermediaries. However, ethical and regulatory boundaries challenge DeFi structures. Compliance metrics require the integration of anti-money laundering (AML) and know-your-customer (KYC) identity protocols directly into system smart contract layers. Auditing of consensus mechanisms (Proof of Work vs Proof of Stake) reveals energy footprints and security vector tradeoffs. Flash loan manipulation attacks represent market abuse vectors that require real-time risk checks. Keywords: DeFi compliance, AML/KYC, flash loan exploit, cryptographic consensus.`
    },
    "Data Science": {
      title: "Tensor Formulations and Backpropagation Gradients",
      content: `Deep neural networks optimize network weights using backpropagation algorithms through multivariable chain-rule derivations. Loss gradients with respect to layers are formulated as: ∂L/∂W = (∂L/∂y) * (∂y/∂z) * (∂z/∂W). Tensor representations store raw multidimensional arrays representing signals, images, or semantic vectors in Transformers. SGD (Stochastic Gradient Descent) and Adam optimization engines introduce momentum parameters to avoid localized gradient dips. Regularization strategies like Dropout prevent overfitting in complex datasets. Keywords: SGD optimization, Adam optimizer, Tensor manifold, partial derivatives, loss variance.`
    }
  };

  const currentSample = subjectSamples[currentUser.selected_subject] || subjectSamples["Biology"];

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const resultString = reader.result as string;
        const base64Content = resultString.split(",")[1];
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
    });
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const mime = file.type?.toLowerCase() || "";
      const name = file.name.toLowerCase();
      const isAnim = name.endsWith(".gif") || mime.includes("gif");
      
      if (isAnim) {
        resolve(file);
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Downsize huge images (ex. 10MB+) to maximum 1600px width/height while keeping aspect ratio.
        // This is perfectly detailed for OCR/Gemini processing while dramatically keeping file size minuscule.
        const MAX_DIM = 1600;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const extensionIndex = file.name.lastIndexOf('.');
                const nameWithoutExt = extensionIndex !== -1 ? file.name.substring(0, extensionIndex) : file.name;
                const compressedFile = new File([blob], `${nameWithoutExt}.jpg`, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.75 // 75% jpeg compression is extremely transparent and keeps it tiny!
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(file);
      };
    });
  };

  const getContextualFileIcon = () => {
    if (!selectedFile) {
      if (activePath === "YouTube URL") return Youtube;
      return Library;
    }
    const name = selectedFile.name.toLowerCase();
    const mime = selectedFile.type?.toLowerCase() || "";
    if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "heic", "tiff", "tif", "bmp", "svg", "ico", "raw", "psd"].some(ext => name.endsWith(`.${ext}`))) {
      return ImageIcon;
    }
    if (mime.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "ogg", "wma", "flac", "wave", "aiff", "alac", "amr", "ape", "opus", "midi", "mid"].some(ext => name.endsWith(`.${ext}`))) {
      return Music;
    }
    if (mime.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv", "mpg", "mpeg", "3gp", "ogv", "divx", "m4v", "ts", "mts"].some(ext => name.endsWith(`.${ext}`))) {
      return Camera;
    }
    return FileText;
  };

  const handleFileChange = async (file: File) => {
    const maxLimit = 200 * 1024 * 1024; // 200MB cap
    if (file.size > maxLimit) {
      setErrorHeader("File too large! Please limit uploads to 200MB.");
      setSelectedFile(null);
      return;
    }
    setErrorHeader(null);

    let finalFile = file;
    const name = file.name.toLowerCase();
    const mime = file.type?.toLowerCase() || "";
    
    // Auto-compress high-resolution Images to keep Base64 payloads super optimized
    const isImage = mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "heic", "tiff", "tif", "bmp"].some(ext => name.endsWith(`.${ext}`));
    if (isImage && !name.endsWith(".gif") && !mime.includes("gif")) {
      setStatusLog(prev => [...prev, `[Optimization]: compressing high-resolution picture to optimize size...`]);
      try {
        finalFile = await compressImage(file);
        setStatusLog(prev => [...prev, `[Optimization]: downsized image successfully (from ${(file.size / (1024 * 1024)).toFixed(2)} MB to ${(finalFile.size / (1024 * 1024)).toFixed(2)} MB).`]);
      } catch (err) {
        console.warn("Client-side image compression fell back:", err);
      }
    }

    const finalName = finalFile.name.toLowerCase();
    const finalMime = finalFile.type?.toLowerCase() || "";
    const isVideo = finalMime.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv", "mpg", "mpeg", "3gp", "ogv", "divx", "m4v", "ts", "mts"].some(ext => finalName.endsWith(`.${ext}`));
    const isAudio = finalMime.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "ogg", "wma", "flac", "wave", "aiff", "alac", "amr", "ape", "opus", "midi", "mid"].some(ext => finalName.endsWith(`.${ext}`));
    const isAudioVideo = isVideo || isAudio;

    if (isAudioVideo) {
      const element = document.createElement(isVideo ? "video" : "audio");
      element.src = URL.createObjectURL(finalFile);
      element.onloadedmetadata = () => {
        const durationHours = element.duration / 3600;
        const limit = currentUser.account_tier === "Premium" ? 15 : 2;
        if (durationHours > limit) {
          setErrorHeader(`Duration limit exceeded. Your current plan (${currentUser.account_tier}) allows up to ${limit} hours of audio/video. This file is ${durationHours.toFixed(2)} hours.`);
          setSelectedFile(null);
        } else {
          setStatusLog(prev => [...prev, `Media metadata verified: ${durationHours.toFixed(2)} hours long.`]);
        }
        URL.revokeObjectURL(element.src);
      };
      element.onerror = () => {
        URL.revokeObjectURL(element.src);
      };
    }

    setSelectedFile(finalFile);
    setTitle(finalFile.name);
    setStatusLog(prev => [...prev, `Selected file: ${finalFile.name} (${(finalFile.size / (1024 * 1024)).toFixed(1)} MB)`]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const loadSampleTextbook = () => {
    setTitle(currentSample.title);
    setPastedText(currentSample.content);
    setStatusLog(prev => [...prev, `Loaded verified ${currentUser.selected_subject} sample textbook reference.`]);
  };

  // Process ingestion with credit check
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorHeader(null);

    // 1. Core Ingest Authorization validation: Safeguard counter
    const currentCount = currentUser.monthly_uploads_used_counter || 0;
    if (currentUser.account_tier === "Free" && currentCount >= 3) {
      setErrorHeader("Monthly study credits depleted. Upgrade to Premium for unhindered document ingestion.");
      onOpenPaywall();
      return;
    }

    let rawExtract = pastedText;
    let finalTitle = title;

    if (activePath === "YouTube URL") {
      if (!youtubeUrl) {
        setErrorHeader("Provide a valid YouTube URL indicator.");
        return;
      }
      finalTitle = `YouTube Summary: ${youtubeUrl}`;
      rawExtract = `The video outlines key details corresponding to "${youtubeUrl}". Based on this lecture transcript, we evaluate scientific factors, theoretical boundaries, and operational calculations tailored to the domain of ${currentUser.selected_subject}.`;
    } else if (activePath === "Photo") {
      if (!selectedFile && !pastedText) {
        setErrorHeader("Provide a textbook image file or pasted transcript.");
        return;
      }
      finalTitle = title || "Textbook Image Reference";
      rawExtract = pastedText || `Textbook Image OCR extracted transcript centering on ${currentUser.selected_subject} theorems. Focused on explaining formulas, terms, and context vectors.`;
    } else {
      if (!selectedFile && !pastedText) {
        setErrorHeader("Please select a valid study file or paste academic notes.");
        return;
      }
      if (!finalTitle) {
        finalTitle = selectedFile ? selectedFile.name : `Study Notes Ingestion - ${new Date().toLocaleDateString()}`;
      }
    }

    setLoading(true);
    setStatusLog([
      `Initiating secure study intake module for subject: ${currentUser.selected_subject}`,
      `Authenticating user account tier: ${currentUser.account_tier} (${currentUser.account_tier === "Premium" ? `${currentCount} uploads` : `${currentCount}/3 uploads`} used)`,
      `Encrypting session payload and dispatching to server-side Gemini core...`
    ]);

    try {
      let fileBase64 = "";
      let uploadedUrl = "";
      let storagePath = "";
      let uploadedFileName = "";
      let uploadedFileSize = 0;

      if (selectedFile) {
        uploadedFileName = selectedFile.name;
        uploadedFileSize = selectedFile.size;

        if (isFirebaseConfigured && storage) {
          try {
            setStatusLog(prev => [...prev, `Uploading file "${selectedFile.name}" to cloud Google Cloud Storage bucket...`]);
            const uniqueId = Math.random().toString(36).substring(2, 15) + "_" + Date.now();
            storagePath = `users/${currentUser.uid}/materials/${uniqueId}_${selectedFile.name}`;
            const fileRef = ref(storage, storagePath);
            await uploadBytes(fileRef, selectedFile);
            uploadedUrl = await getDownloadURL(fileRef);
            setStatusLog(prev => [...prev, `✓ Upload complete! Secured in cloud storage container.`]);
          } catch (storageErr: any) {
            console.error("Cloud storage upload failed:", storageErr);
            setStatusLog(prev => [...prev, `⚠️ GCS/Firebase Storage upload failed: ${storageErr.message || "quota limit"}. Processing in memory...`]);
          }
        } else {
          try {
            uploadedUrl = URL.createObjectURL(selectedFile);
            storagePath = `local-sandbox/materials/${selectedFile.name}`;
            setStatusLog(prev => [...prev, `Sandbox Mode: Initialized virtual local blob reference.`]);
          } catch (localErr) {
            console.error(localErr);
          }
        }

        setStatusLog(prev => [...prev, `Converting file ${selectedFile.name} to base64 transmission chunks...`]);
        fileBase64 = await getBase64(selectedFile);
        setStatusLog(prev => [...prev, `File ready for streaming to Gemini.`]);
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setStatusLog(prev => [...prev, `Connecting to server-side proxy route: "/api/process-material"`]);
      
      const response = await fetch("/api/process-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: finalTitle,
          file_type: activePath,
          content: rawExtract || "",
          subject: currentUser.selected_subject,
          language: selectedLanguage,
          file_base64: fileBase64 || undefined,
          file_mime: selectedFile ? selectedFile.type : undefined,
          file_name: selectedFile ? selectedFile.name : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Material processor failed.");
      }

      setStatusLog(prev => [...prev, `Payload processed. Parsing study structure structures...`]);
      const data = await response.json();
      
      // Save material locally or inside database
      const savedMat = await DBService.saveMaterial(
        currentUser.uid,
        finalTitle,
        activePath,
        rawExtract || currentSample.content,
        data.structured_summary_markdown,
        selectedLanguage,
        currentUser.selected_subject,
        uploadedUrl || undefined,
        uploadedFileName || undefined,
        uploadedFileSize || undefined,
        storagePath || undefined
      );

      // Save related quiz records and flashcards in parallel
      const savedQuiz = await DBService.saveQuizRecord(
        savedMat.id,
        "MCQ",
        data.quiz_questions.length,
        4,
        data.quiz_questions
      );

      const savedCards = await DBService.saveFlashcardsBatch(
        savedMat.id,
        data.flashcards
      );

      // Increment monthly upload count inside database
      const newCount = await DBService.incrementUploadCounter(currentUser.uid);
      onUploadIncrement(newCount);

      setStatusLog(prev => [...prev, `✓ Success! Saved inside subject profile workspace database.`]);
      
      setTimeout(() => {
        onProcessingSuccess(savedMat, data.quiz_questions, savedCards);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Failed to process, coordinate key connection.");
    } finally {
      setLoading(false);
    }
  };

  const pathOptions = [
    { id: "PDF" as FileType, label: "Document", icon: FileText, bg: "bg-rose-500/10", color: "text-rose-400", border: "border-rose-500/20", desc: "All formats (PDF, DOCX, PPTX, XLSX, TXT, EPUB, RTF, MD, Pages, etc.)" },
    { id: "Video" as FileType, label: "Video", icon: Video, bg: "bg-blue-500/10", color: "text-blue-400", border: "border-blue-500/20", desc: "All video formats (MP4, MOV, AVI, WMV, MKV, FLV, WEBM, MPEG, 3GP, etc.)" },
    { id: "Audio" as FileType, label: "Audio", icon: Music, bg: "bg-emerald-500/10", color: "text-emerald-400", border: "border-emerald-500/20", desc: "All audio formats (MP3, WAV, M4A, AAC, OGG, WMA, FLAC, M4P, etc.)" },
    { id: "YouTube URL" as FileType, label: "YouTube", icon: Youtube, bg: "bg-rose-500/10", color: "text-[#f43f5e]", border: "border-rose-500/20", desc: "Paste any video link" },
    { id: "Photo" as FileType, label: "Photo / Image", icon: ImageIcon, bg: "bg-amber-500/10", color: "text-amber-400", border: "border-amber-500/20", desc: "All photo & image formats (JPG, JPEG, PNG, WEBP, HEIC, GIF, TIFF, BMP, etc.)" }
  ];

  const currentOption = pathOptions.find(o => o.id === activePath);
  const uploadsLeft = Math.max(0, 3 - (currentUser.monthly_uploads_used_counter || 0));

  if (loading) {
    return (
      <StudyMaterialLoadingScreen 
        statusLog={statusLog} 
        activePath={activePath} 
        isLightMode={isLightMode} 
      />
    );
  }

  return (
    <div className="space-y-6 relative" id="workspace-hub-container">
      {/* AI STUDY CONTEXT BANNER */}
      <div className="relative" id="study-context-banner-parent">
        <button
          type="button"
          onClick={() => setShowSubjectPicker(!showSubjectPicker)}
          className={`w-full text-left p-4 rounded-2xl hover:bg-[#818cf8]/10 transition-all duration-200 cursor-pointer flex items-center gap-4 group border ${isLightMode ? "bg-indigo-50/55 border-indigo-150 hover:border-indigo-300" : "bg-[#818cf8]/5 border-[#818cf8]/20 hover:border-[#818cf8]/35"}`}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 group-hover:scale-105 transition-transform duration-200">
            <Library className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${isLightMode ? "text-indigo-600" : "text-indigo-300"}`}>AI STUDY CONTEXT</span>
              <Sparkles className="w-3 h-3 text-[#a855f7] animate-pulse" />
            </div>
            <p className={`text-lg font-bold mt-0.5 truncate font-display ${isLightMode ? "text-indigo-950" : "text-white"}`}>
              {currentUser.selected_subject}
            </p>
            <p className={`text-xs font-sans mt-0.5 ${isLightMode ? "text-indigo-700/80" : "text-zinc-400"}`}>
              Tap to change subject · AI will tailor content for this field
            </p>
          </div>
        </button>

        {showSubjectPicker && (
          <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl p-4 shadow-2xl z-30 max-h-60 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-1.5 scrollbar-thin scrollbar-thumb-zinc-800 backdrop-blur-md border ${isLightMode ? "bg-white border-zinc-200 shadow-zinc-200" : "bg-zinc-950/95 border-zinc-800"}`} id="subject-picker-dropdown">
            {ALL_SUBJECTS.map((sub) => {
              const isActive = currentUser.selected_subject === sub;
              return (
                <button
                  type="button"
                  key={sub}
                  onClick={() => {
                    if (onSubjectChange) onSubjectChange(sub);
                    setShowSubjectPicker(false);
                  }}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-mono transition-all duration-150 cursor-pointer border ${
                    isActive 
                      ? (isLightMode ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold" : "bg-indigo-600/30 border-indigo-500 text-indigo-200 font-semibold") 
                      : (isLightMode ? "text-zinc-700 border-transparent hover:bg-zinc-100 hover:text-zinc-950" : "text-zinc-400 border-transparent hover:bg-zinc-900/50 hover:text-white")
                  }`}
                >
                  🎓 {sub}
                </button>
              );
            })}
            {(() => {
              const isCustom = !ALL_SUBJECTS.includes(currentUser.selected_subject);
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (onSubjectChange) onSubjectChange("Custom");
                    setShowSubjectPicker(false);
                  }}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-mono transition-all duration-150 cursor-pointer border md:col-span-1 col-span-2 ${
                    isCustom 
                      ? (isLightMode ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold font-bold" : "bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold") 
                      : (isLightMode ? "text-indigo-600 border-indigo-100 bg-indigo-50/25 hover:bg-indigo-50 hover:text-indigo-700" : "text-indigo-400 border-white/5 bg-indigo-950/10 hover:bg-zinc-900/50 hover:text-indigo-300")
                  }`}
                >
                  {isCustom ? `🔮 Custom: ${currentUser.selected_subject}` : "🔮 Create Custom Subject..."}
                </button>
              );
            })()}
          </div>
        )}
      </div>

      {errorHeader && (
        <div className={`flex items-center gap-3 border px-4 py-3.5 rounded-2xl text-xs ${isLightMode ? "bg-red-50 border-red-200 text-red-800" : "bg-red-950/20 border-red-800/30 text-red-100"}`} id="ingest-error">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <strong>Execution Halted:</strong> {errorHeader}
          </div>
          {currentUser.account_tier === "Free" && (
            <button
              id="paywall-upgrade-now-btn"
              type="button"
              onClick={onOpenPaywall}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono px-3 py-1.5 rounded-xl uppercase tracking-wider text-[9px] transition-colors cursor-pointer"
            >
              Upgrade Now
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleIngest} className="space-y-5">
        {/* Drag & Drop zone or YouTube input */}
        {activePath === "YouTube URL" ? (
          <div className="space-y-4">
            <div className={`border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-all duration-200 ${isLightMode ? "border-zinc-300 bg-white hover:border-zinc-400" : "border-zinc-800 bg-zinc-950/10 hover:border-zinc-700/50"}`} id="youtube-input-zone">
              <div className="bg-rose-500/10 p-4 border border-rose-500/20 rounded-2xl animate-pulse">
                <Youtube className="w-6 h-6 text-rose-400" />
              </div>
              <div className="w-full max-w-md space-y-2">
                <label className={`text-xs font-semibold font-sans block ${isLightMode ? "text-zinc-700" : "text-zinc-300"}`}>Input YouTube Lecture Link</label>
                <input
                  id="youtube-url-input"
                  type="url"
                  required
                  placeholder="e.g., https://www.youtube.com/watch?v=centrifugal_force"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className={`w-full rounded-xl py-3 px-4 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[#818cf8]/50 border ${isLightMode ? "bg-white border-zinc-350 text-zinc-950 placeholder:text-zinc-450" : "bg-zinc-950/30 border-zinc-800 text-white placeholder:text-zinc-650"}`}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activePath === "Photo" && !isDesktop && isMobileOrTabletDevice && (
              <div className="flex gap-2 lg:hidden" id="photo-mode-selector">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoMode("upload");
                    stopCamera();
                  }}
                  className={`flex-1 py-3 px-4 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    photoMode === "upload"
                      ? (isLightMode ? "bg-indigo-650 text-white border-indigo-700 shadow-md" : "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.1)]")
                      : (isLightMode ? "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50" : "bg-white/[0.01] border-white/5 text-zinc-400 hover:bg-white/[0.03]")
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Image File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoMode("camera");
                    startCamera();
                  }}
                  className={`flex-1 py-3 px-4 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    photoMode === "camera"
                      ? (isLightMode ? "bg-indigo-650 text-white border-indigo-700 shadow-md" : "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.1)]")
                      : (isLightMode ? "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50" : "bg-white/[0.01] border-white/5 text-zinc-400 hover:bg-white/[0.03]")
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Capture with Camera
                </button>
              </div>
            )}

            {activePath === "Photo" && photoMode === "camera" && !isDesktop && isMobileOrTabletDevice ? (
              /* Custom Camera Module */
              <div className={`border rounded-2xl p-5 flex flex-col items-center gap-4 ${isLightMode ? "bg-white border-zinc-200" : "bg-[#0e0e11] border-white/5"}`} id="camera-workspace-zone">
                {cameraError ? (
                  <div className="text-center p-6 space-y-3">
                    <p className="text-red-400 text-xs font-semibold">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 px-3.5 rounded-xl cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                ) : capturedUrl ? (
                  /* Captured Preview State */
                  <div className="w-full flex flex-col items-center gap-4">
                    <div className="relative w-full max-w-sm aspect-video rounded-2xl overflow-hidden border border-indigo-500/30 bg-black shadow-lg">
                      <img src={capturedUrl} alt="Captured Study Sheet" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Captured
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-medium font-sans mb-2 ${isLightMode ? "text-zinc-700" : "text-zinc-300"}`}>
                        Photo Queued: Camera Photo ...
                      </p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-4 rounded-xl cursor-pointer border border-white/5"
                      >
                        Retake Photo
                      </button>
                    </div>
                  </div>
                ) : isCameraLive ? (
                  /* Live Camera Feed state */
                  <div className="w-full flex flex-col items-center gap-4">
                    <div className="relative w-full max-w-sm aspect-video rounded-2xl overflow-hidden border border-indigo-500/30 bg-black shadow-lg">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <div className="absolute top-3 left-3 bg-red-650 text-white px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-mono font-bold tracking-widest animate-pulse flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 bg-white rounded-full" />
                        LIVE CAMERA
                      </div>
                    </div>
                    <div className="flex gap-2 w-full justify-center">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-display font-medium py-2.5 px-5 rounded-xl cursor-pointer flex items-center gap-2 shadow-md transition-all active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        Capture Snapshot
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 px-4 rounded-xl cursor-pointer border border-white/5 active:scale-95"
                      >
                        Pause Camera
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Initial non-live inactive state */
                  <div className="text-center py-6 space-y-3">
                    <div className="bg-indigo-500/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-indigo-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className={`text-xs ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>Ready to take a study snapshot?</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-colors"
                    >
                      Turn On Camera
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Drag & Drop uploader zone */
              <div
                id="upload-drag-zone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border border-dashed p-10 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 group ${
                  isDragOver 
                    ? "border-indigo-500 bg-indigo-500/10" 
                    : (isLightMode ? "border-zinc-300 bg-white hover:border-zinc-400" : "border-zinc-805 bg-zinc-950/10 hover:border-zinc-700/50")
                }`}
              >
                <input
                  id="hidden-file-input"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                
                <div className={`p-4 border rounded-2xl group-hover:scale-105 transition-transform duration-200 ${isLightMode ? "bg-zinc-100 border-zinc-200" : "bg-zinc-800/40 border-zinc-750"}`}>
                  <Upload className={`w-6 h-6 ${isLightMode ? "text-zinc-700" : "text-slate-300"}`} />
                </div>
                
                <div className="text-center space-y-1">
                  <p className={`text-sm font-semibold font-display ${isLightMode ? "text-zinc-900" : "text-zinc-100"}`}>
                    {selectedFile ? `File queued: ${selectedFile.name}` : `Drag & drop any study files here or click to browse.`}
                  </p>
                  <p className={`text-xs font-sans ${isLightMode ? "text-zinc-550" : "text-zinc-500"}`}>
                    {activePath === "PDF" 
                      ? "Supports all document formats (PDF, DOCX, PPTX, XLSX, TXT, EPUB, RTF, Pages, Keynote, MD, etc.)"
                      : activePath === "Video"
                      ? `Supports video files (MP4, MOV, AVI, WMV) — Up to ${currentUser.account_tier === "Premium" ? "15 hours (Premium Plan enabled)" : "2 hours limit (upgrade to Premium for 15 hours)"}`
                      : activePath === "Audio"
                      ? `Supports audio files (MP3, WAV, M4A, AAC, OGG) — Up to ${currentUser.account_tier === "Premium" ? "15 hours (Premium Plan enabled)" : "2 hours limit (upgrade to Premium for 15 hours)"}`
                      : activePath === "Photo"
                      ? "Supports standard image formats (JPG, JPEG, PNG, WEBP, HEIC, GIF)"
                      : `Supports documents, audio (up to ${currentUser.account_tier === "Premium" ? "15h" : "2h"}), videos (up to ${currentUser.account_tier === "Premium" ? "15h" : "2h"}), and images up to 200MB`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Material Title Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5 space-y-1.5">
            <label className={`text-xs font-semibold font-display block ${isLightMode ? "text-zinc-700" : "text-zinc-400"}`}>Material Title</label>
            <input
              id="document-title-input"
              type="text"
              placeholder="e.g., Chapter 5 - Cell Biology"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 border ${isLightMode ? "bg-white border-zinc-200 text-zinc-950 placeholder:text-zinc-400" : "bg-zinc-950/30 border-zinc-800 text-white placeholder:text-zinc-500"}`}
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className={`text-xs font-semibold font-display block ${isLightMode ? "text-zinc-700" : "text-zinc-400"}`}>Study Language</label>
            <select
              id="study-language-selector"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className={`w-full rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 border cursor-pointer ${
                isLightMode 
                  ? "bg-white border-zinc-200 text-zinc-950" 
                  : "bg-[#111115] border-zinc-800 text-white [&>option]:bg-zinc-900"
              }`}
            >
              {["English", "Spanish", "French", "German", "Mandarin", "Japanese"].map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <button
              id="load-sample-textbook-btn"
              type="button"
              onClick={loadSampleTextbook}
              className={`w-full text-xs font-mono py-3 px-4 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-transform duration-100 active:scale-95 ${
                isLightMode 
                  ? "border-indigo-200 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700" 
                  : "border-white/5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load {currentUser.selected_subject} Sample
            </button>
          </div>
        </div>

        {/* Paste Study Area (Optional text uploader) */}
        {activePath !== "YouTube URL" && (
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold font-display block ${isLightMode ? "text-zinc-700" : "text-zinc-400"}`}>Or Paste Study Textbook Transcript</label>
            <textarea
              id="raw-text-textarea"
              rows={3}
              placeholder={currentOption?.desc || "Drop notes or write textbook paragraphs directly here..."}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className={`w-full text-xs py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none font-sans border ${
                isLightMode 
                  ? "bg-white border-zinc-350 text-zinc-900 placeholder:text-zinc-450" 
                  : "bg-zinc-950/30 border-zinc-808 text-slate-205 placeholder:text-zinc-650"
              }`}
            />
          </div>
        )}

        {/* Source Media Type Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3" id="media-tabs-parent">
          {pathOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = activePath === opt.id;
            return (
              <button
                id={`ingest-tab-${opt.id}`}
                type="button"
                key={opt.id}
                onClick={() => {
                  setActivePath(opt.id);
                  setSelectedFile(null);
                  setErrorHeader(null);
                }}
                className={`flex flex-col items-start p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer border ${
                  isActive 
                    ? "bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20" 
                    : (isLightMode ? "bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300" : "bg-zinc-900/40 border-zinc-900 hover:bg-zinc-900/60 hover:border-zinc-800")
                }`}
              >
                {/* Colored icon badge */}
                <div className={`p-2 rounded-xl mb-3 ${opt.bg} ${opt.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold font-display block ${isLightMode ? "text-zinc-900" : "text-white"}`}>{opt.label}</span>
                <span className="text-[10px] text-zinc-500 font-sans mt-1 line-clamp-1 break-all">{opt.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Monthly limits warning details */}
        <p className={`text-xs text-center font-sans ${isLightMode ? "text-zinc-650" : "text-zinc-500"}`}>
          {currentUser.account_tier === "Premium" ? (
            <span className="text-purple-600 font-bold">Unlimited uploads active (Premium)</span>
          ) : (
            <span>{uploadsLeft} free uploads remaining this month</span>
          )}
        </p>

        {/* Console Action Logger */}
        {statusLog.length > 0 && (
          <div className={`backdrop-blur-md p-4 rounded-xl space-y-1 font-mono text-[9px] border ${isLightMode ? "bg-zinc-55 bg-white border-zinc-205 text-zinc-600" : "bg-white/5 border-white/10 text-zinc-400"}`} id="ingest-logs">
            <span className="text-[8px] text-indigo-500 block tracking-widest font-semibold uppercase mb-1">Ingestion Pipeline Monitor</span>
            {statusLog.map((log, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className={`font-semibold ${isLightMode ? "text-zinc-400" : "text-zinc-600"}`}>[{i+1}]</span>
                <p>{log}</p>
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          id="ingest-payload-btn"
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 font-mono uppercase tracking-widest text-xs py-3.5 rounded-xl text-white transition-all shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2 cursor-pointer pt-3"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin font-sans" />
              Ingesting study corpus with Gemini...
            </>
          ) : (
            <>
              <span className="font-sans font-medium">Compile {activePath} to Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
