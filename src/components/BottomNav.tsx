import React from "react";
import { 
  LayoutGrid, 
  Upload as UploadIcon, 
  BookOpen, 
  Crown, 
  Sun, 
  Moon, 
  FileText, 
  LogOut,
  Settings 
} from "lucide-react";
import { AppUser } from "../types";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: AppUser;
  onLogout: () => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  materialsCount: number;
}

export default function BottomNav({ 
  activeTab, 
  onTabChange, 
  currentUser, 
  onLogout,
  isLightMode,
  onToggleTheme,
  materialsCount
}: BottomNavProps) {
  
  // Resolve Name & Email matching user screenshot
  const isCramupEmail = currentUser.email.toLowerCase().includes("cramup") || currentUser.email.toLowerCase() === "cramup.ai@gmail.com";
  const rawFullName = currentUser.display_name || (isCramupEmail ? "Vihandu Randil Marasinghe" : currentUser.email.split("@")[0].charAt(0).toUpperCase() + currentUser.email.split("@")[0].slice(1));
  const initials = rawFullName.trim().charAt(0).toUpperCase() || "U";
  const fullName = rawFullName.length > 20 ? rawFullName.slice(0, 18) + "..." : rawFullName;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "upload", label: "Upload", icon: UploadIcon },
    { id: "library", label: "Library", icon: BookOpen, badge: materialsCount },
    { id: "plans", label: "Plans", icon: Crown }
  ];

  const mobileNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "upload", label: "Upload", icon: UploadIcon },
    { id: "library", label: "Library", icon: BookOpen, badge: materialsCount },
    { id: "plans", label: "Plans", icon: Crown },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation (Visible on smaller screens Only) */}
      <nav 
        className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-30 flex items-center justify-around px-2 pb-1 transition-all ${
          isLightMode 
            ? "bg-white border-zinc-200 text-zinc-950 shadow-md" 
            : "bg-[#09090b]/95 border-white/10 text-slate-100 shadow-lg backdrop-blur-md"
        }`}
        id="mobile-bottom-nav"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`nav-btn-${item.id}`}
              type="button"
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer relative border ${
                isActive 
                  ? "text-[#a855f7] bg-white/5 border-white/5 font-medium" 
                  : isLightMode 
                    ? "text-zinc-500 border-transparent hover:text-zinc-900" 
                    : "text-zinc-400 border-transparent hover:text-white"
              }`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span className="text-[8.5px] mt-0.5 tracking-tight font-sans font-medium whitespace-nowrap">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-2 bg-[#a855f7] text-white text-[8px] font-mono w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Desktop Sidebar Layout matching user's exact uploaded design */}
      <aside 
        className={`hidden md:flex flex-col w-[260px] border-r shrink-0 z-30 transition-all duration-300 sticky top-0 h-screen overflow-y-auto self-start ${
          isLightMode 
            ? "bg-zinc-50 border-zinc-200 text-zinc-900" 
            : "bg-[#09090b] border-white/5 text-slate-100"
        }`}
        id="desktop-sidebar-nav"
      >
        <div className="flex-1 flex flex-col p-5 space-y-6">
          
          {/* Logo Brand Segment of the Sidebar */}
          <div className="flex items-center gap-2.5 px-2 py-1.5 select-none">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8b5cf6] to-[#ec4899] flex items-center justify-center shadow-lg shadow-purple-500/10">
              {/* Cramup logo rocket or double chevron */}
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-300 to-pink-300 bg-clip-text text-transparent font-display">
                Cramup.AI
              </h1>
            </div>
          </div>

          {/* Navigation link elements with custom active highlighting */}
          <div className="space-y-1 pt-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              // Custom active/inactive styling based on current choice & dark/light mode
              let btnClass = "";
              if (isActive) {
                btnClass = isLightMode
                  ? "bg-zinc-200/60 border-zinc-300 text-zinc-950 font-semibold"
                  : "bg-[#1d172e] border-purple-500/10 text-[#c084fc] font-semibold";
              } else {
                btnClass = isLightMode
                  ? "text-zinc-600 hover:text-zinc-950 border-transparent hover:bg-zinc-200/30"
                  : "text-zinc-400 hover:text-slate-200 border-transparent hover:bg-[#121214]";
              }

              return (
                <button
                  id={`sidebar-btn-${item.id}`}
                  type="button"
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs transition-all duration-150 cursor-pointer border ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#a855f7]" : ""}`} />
                    <span className="font-sans font-medium tracking-wide">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-purple-600/10 border border-purple-500/20 text-[#c084fc] text-[9px] px-2 py-0.5 rounded-full font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Sidebar Auxiliary Bottom controls */}
          <div className="space-y-3.5 pt-4 border-t border-white/5">
            {/* Sun/Moon Toggle Theme action */}
            <button
              id="sidebar-theme-toggle"
              type="button"
              onClick={onToggleTheme}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer border border-transparent transition-all duration-150 ${
                isLightMode 
                  ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/40" 
                  : "text-zinc-400 hover:text-slate-200 hover:bg-[#121214]"
              }`}
            >
              {isLightMode ? (
                <>
                  <Moon className="w-4 h-4 text-purple-600" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-[#a855f7]" />
                  <span>Light Mode</span>
                </>
              )}
            </button>

            {/* Legal & Policies trigger button */}
            <button
              id="sidebar-legal-btn"
              type="button"
              onClick={() => onTabChange("legal")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all duration-150 text-left ${
                activeTab === "legal"
                  ? isLightMode
                    ? "bg-purple-100/60 border-purple-300 text-[#6d28d9]"
                    : "bg-[#1d172e] border-purple-500/20 text-[#c084fc]"
                  : isLightMode 
                    ? "text-zinc-650 border-transparent hover:text-zinc-950 hover:bg-zinc-200/40" 
                    : "text-zinc-400 border-transparent hover:text-slate-200 hover:bg-[#121214]"
              }`}
            >
              <FileText className={`w-4 h-4 ${activeTab === "legal" ? "text-[#a855f7]" : "text-zinc-500"}`} />
              <span>Legal & Policies</span>
            </button>
          </div>

          {/* User profile segment matching screenshot bottom left */}
          <button
            id="sidebar-profile-settings-btn"
            type="button"
            onClick={() => onTabChange("settings")}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
              activeTab === "settings"
                ? isLightMode
                  ? "bg-purple-100/60 border-purple-300 text-purple-950"
                  : "bg-[#1d172e] border-purple-500/20 text-[#c084fc]"
                : isLightMode 
                  ? "bg-zinc-100/80 border-zinc-200 text-zinc-900 hover:bg-zinc-200/50" 
                  : "bg-[#0b0a0e]/40 border-white/5 text-slate-100 hover:bg-[#121214]"
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Rounded initials avatar - purple bg */}
              <div className="w-9 h-9 rounded-full bg-[#6d28d9] flex items-center justify-center text-white font-bold shrink-0 text-sm">
                {initials}
              </div>
              <div className="overflow-hidden">
                <span className={`block text-xs font-semibold truncate leading-none ${activeTab === "settings" ? "text-purple-400" : isLightMode ? "text-zinc-900" : "text-white"}`}>{fullName}</span>
                <span className="block text-[10px] text-zinc-400 mt-1 truncate font-medium font-sans leading-none">{currentUser.email}</span>
              </div>
            </div>

            {/* Settings Cog icon */}
            <div
              className={`p-1.5 rounded-lg transition-colors ${
                activeTab === "settings"
                  ? "text-[#a855f7] bg-purple-500/10"
                  : "text-zinc-400 hover:text-purple-400 hover:bg-white/5"
              }`}
            >
              <Settings className="w-4 h-4" />
            </div>
          </button>

        </div>
      </aside>
    </>
  );
}
