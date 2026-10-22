import React from 'react';
import { VoiceName } from '../types/voice';
import { VOICES } from '../data/presets';
import { Mic2, UserCheck, Sparkles } from 'lucide-react';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onVoiceChange: (voice: VoiceName) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onVoiceChange,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-base">
              เลือกเสียงนักพากย์ AI (Voice Persona)
            </h3>
            <p className="text-xs text-slate-400">
              เลือกโทนเสียงและบุคลิกของนักพากย์ที่เหมาะกับงานของคุณ
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 3.8 Neural Speech</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {VOICES.map((v) => {
          const isSelected = selectedVoice === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onVoiceChange(v.id)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md ring-2 ring-indigo-500/40'
                  : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${v.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow`}
                  >
                    {v.id.substring(0, 2)}
                  </div>
                  {isSelected && (
                    <div className="p-1 rounded-full bg-indigo-500 text-white">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="font-bold text-sm text-slate-100 mb-0.5">{v.name}</div>
                <div className="text-xs text-indigo-300/90 font-medium mb-1.5">{v.tone}</div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 mt-2">
                <span className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                  {v.bestFor}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
