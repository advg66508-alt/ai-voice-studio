import React from 'react';
import { Mic2, Radio, Sparkles, Volume2, Info } from 'lucide-react';

interface NavbarProps {
  onOpenAssistant: () => void;
  onOpenCodeModal?: () => void;
  hasAudio: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAssistant, hasAudio }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
            <Mic2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-100 text-base sm:text-lg tracking-tight">
                ห้องพากย์เสียง AI
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PRO STUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Text-to-Speech ภาษาไทย • ปรับความเร็ว ช้า/ปกติ/เร็ว • เสียงชาย/หญิง • ดาวน์โหลด .WAV
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI เขียนบทพากย์</span>
          </button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gemini 3.8 TTS Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};


