import React, { useState, useRef } from 'react';
import { SFXType, SFX_PRESETS, generateSFXBuffer } from '../utils/audioMixer';
import { Sparkles, Play, Square, Volume2, Plus, Info } from 'lucide-react';

interface SFXToolbarProps {
  onInsertSFX: (tag: string) => void;
  currentScriptText: string;
}

export const SFXToolbar: React.FC<SFXToolbarProps> = ({
  onInsertSFX,
  currentScriptText,
}) => {
  const [previewingSFX, setPreviewingSFX] = useState<SFXType | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Count active SFX tags in the script
  const activeTagsInScript = SFX_PRESETS.filter((p) =>
    currentScriptText.includes(p.tag)
  );

  const stopPreview = () => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
        activeSourceRef.current.disconnect();
      } catch {
        // ignore
      }
      activeSourceRef.current = null;
    }
    setPreviewingSFX(null);
  };

  const handlePreviewSFX = async (type: SFXType, e: React.MouseEvent) => {
    e.stopPropagation();

    if (previewingSFX === type) {
      stopPreview();
      return;
    }

    stopPreview();

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      setPreviewingSFX(type);
      const buffer = await generateSFXBuffer(type, ctx.sampleRate);
      if (!buffer) {
        setPreviewingSFX(null);
        return;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      source.onended = () => {
        setPreviewingSFX(null);
      };

      activeSourceRef.current = source;
      source.start();
    } catch (err) {
      console.error('SFX preview error:', err);
      setPreviewingSFX(null);
    }
  };

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2.5">
      {/* Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>แทรกเสียงเอฟเฟกต์พิเศษ (SFX):</span>
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            คลิกเพื่อวางตำแหน่งเสียงเอฟเฟกต์ในสคริปต์
          </span>
        </div>

        {/* Counter of tags currently in script */}
        {activeTagsInScript.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
            ใส่แล้ว {activeTagsInScript.length} เสียงในสคริปต์
          </span>
        )}
      </div>

      {/* Quick Insert Buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {SFX_PRESETS.map((preset) => {
          const isThisPreviewing = previewingSFX === preset.id;
          const isPresentInScript = currentScriptText.includes(preset.tag);

          return (
            <div
              key={preset.id}
              className={`inline-flex items-center rounded-lg border transition-all text-xs overflow-hidden ${
                isPresentInScript
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-600'
              }`}
            >
              {/* Insert Button */}
              <button
                type="button"
                onClick={() => onInsertSFX(preset.tag)}
                className="px-2.5 py-1.5 flex items-center gap-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
                title={`คลิกเพื่อใส่ ${preset.tag} ในบทพากย์`}
              >
                <span>{preset.icon}</span>
                <span className="font-medium text-[11px]">{preset.title}</span>
                <Plus className="w-3 h-3 text-slate-400" />
              </button>

              {/* Mini Preview Button */}
              <button
                type="button"
                onClick={(e) => handlePreviewSFX(preset.id, e)}
                className={`p-1.5 border-l border-slate-800 transition-colors ${
                  isThisPreviewing
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                }`}
                title={isThisPreviewing ? 'หยุดฟัง' : 'ลองฟังเสียงเอฟเฟกต์'}
              >
                {isThisPreviewing ? (
                  <Square className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <Play className="w-2.5 h-2.5 fill-current" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-500">
        💡 เคล็ดลับ: วางเคอร์เซอร์ที่ต้องการแล้วคลิกปุ่มด้านบน เช่น &ldquo;สวัสดีทุกคน! <span className="text-amber-400">[SFX:แจ้งเตือน]</span> วันนี้มีโปรใหญ่ <span className="text-amber-400">[SFX:แคชเชียร์]</span>&rdquo; ระบบจะมิกซ์เสียงเอฟเฟกต์ลงในคลิปให้ตรงจังหวะทันที
      </p>
    </div>
  );
};
