import React, { useState } from 'react';
import { Sparkles, Radio, Mic2, Music, Download, ChevronUp, ChevronDown, Wand2, Volume2 } from 'lucide-react';
import studioBannerImg from '../assets/images/voice_studio_banner_1791625858067.jpg';

interface StudioHeroBannerProps {
  onOpenAssistant: () => void;
  onScrollToEditor?: () => void;
}

export const StudioHeroBanner: React.FC<StudioHeroBannerProps> = ({
  onOpenAssistant,
  onScrollToEditor,
}) => {
  const [isCompact, setIsCompact] = useState(false);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl bg-slate-950 transition-all duration-300 group">
      {/* Background Image with Cinematic Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={studioBannerImg}
          alt="AI Voiceover Recording Studio"
          className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-700 opacity-60"
        />
        {/* Gradients to blend seamlessly into dark app theme */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
        <div className="absolute inset-0 bg-amber-500/5 mix-blend-overlay" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
        {/* Top Badges & Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
              <Mic2 className="w-3.5 h-3.5 fill-current" />
              <span>AI STUDIO BOOTH PRO</span>
            </span>

            <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/40 text-cyan-300 font-medium text-xs backdrop-blur-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Gemini 3.8 Neural Speech Engine</span>
            </span>

            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-slate-900/80 border border-rose-500/30 text-rose-300 font-medium text-xs backdrop-blur-md">
              🌸 3 เสียงผู้หญิง • 👨 3 เสียงผู้ชาย
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCompact(!isCompact)}
            className="text-xs text-slate-400 hover:text-amber-300 px-3 py-1 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            title={isCompact ? 'ขยายภาพปกสตูดิโอ' : 'ย่อภาพปก'}
          >
            {isCompact ? (
              <>
                <span>ขยายภาพปก</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>ย่อภาพปก</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Hero Title & Description */}
        {!isCompact && (
          <div className="space-y-3 max-w-2xl mb-6 animate-in fade-in duration-200">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              สตูดิโอสร้างเสียงพากย์ AI <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400 bg-clip-text text-transparent">
                คุณภาพระดับโปรดักชัน
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed drop-shadow">
              แปลงข้อความเป็นเสียงพากย์ภาษาไทยคมชัด ปรับอารมณ์ตัวละคร (สาวหวาน, สาวมั่น, หนังแอ็คชั่น, นิทาน) ปรับความเร็ว 3 ระดับ พร้อมมิกซ์เสียงดนตรีบรรยากาศคาเฟ่และธรรมชาติเข้ากับเสียงพากย์อัตโนมัติ ดาวน์โหลดไฟล์ <span className="font-mono text-amber-300 font-bold">.WAV</span> ไปตัดต่อในคลิปได้ทันที
            </p>
          </div>
        )}

        {/* Feature Highlights & CTA Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
          {/* Feature Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 backdrop-blur-sm">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Studio 24kHz WAV</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 backdrop-blur-sm">
              <Music className="w-3.5 h-3.5 text-teal-400" />
              <span>5 เสียง Ambient & คาเฟ่</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 backdrop-blur-sm">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>ดาวน์โหลด .WAV ฟรี</span>
            </div>
          </div>

          {/* CTA Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenAssistant}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>AI เขียนบทพากย์อัตโนมัติ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
