import React, { useState, useRef } from 'react';
import {
  AmbientSoundType,
  AMBIENT_PRESETS,
  generateAmbientBuffer,
} from '../utils/audioMixer';
import { Music, Volume2, Play, Square, Sparkles, Check, Info } from 'lucide-react';

interface BackgroundMusicSelectorProps {
  selectedAmbient: AmbientSoundType;
  onAmbientChange: (type: AmbientSoundType) => void;
  ambientVolume: number;
  onVolumeChange: (vol: number) => void;
  mixIntoDownload: boolean;
  onMixIntoDownloadChange: (mix: boolean) => void;
}

export const BackgroundMusicSelector: React.FC<BackgroundMusicSelectorProps> = ({
  selectedAmbient,
  onAmbientChange,
  ambientVolume,
  onVolumeChange,
  mixIntoDownload,
  onMixIntoDownloadChange,
}) => {
  const [isPreviewing, setIsPreviewing] = useState<AmbientSoundType | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const currentPreset =
    AMBIENT_PRESETS.find((p) => p.id === selectedAmbient) || AMBIENT_PRESETS[0];

  // Stop preview playback
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
    setIsPreviewing(null);
  };

  // Play 6s preview of selected ambient sound
  const playPreview = async (type: AmbientSoundType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (isPreviewing === type) {
      stopPreview();
      return;
    }

    stopPreview();
    if (type === 'none') return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      setIsPreviewing(type);
      const buffer = await generateAmbientBuffer(type, 6, ctx.sampleRate);
      if (!buffer) {
        setIsPreviewing(null);
        return;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.value = ambientVolume;

      source.connect(gain);
      gain.connect(ctx.destination);

      source.onended = () => {
        setIsPreviewing(null);
      };

      activeSourceRef.current = source;
      source.start();
    } catch (err) {
      console.error('Preview Ambient Error:', err);
      setIsPreviewing(null);
    }
  };

  const handleSelect = (preset: typeof AMBIENT_PRESETS[0]) => {
    onAmbientChange(preset.id);
    if (preset.id !== 'none' && ambientVolume === 0) {
      onVolumeChange(preset.defaultVolume);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative z-20 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-base">
                เสียงพื้นหลังและบรรยากาศ (Background Music & Ambient)
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  selectedAmbient !== 'none'
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {currentPreset.icon} {currentPreset.title}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ใส่เสียงบรรยากาศคาเฟ่ ธรรมชาติ คลื่นทะเล หรือดนตรี Lo-Fi เข้าไปในไฟล์เสียงพากย์ได้ทันที
            </p>
          </div>
        </div>

        {/* Mix into download toggle */}
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
          <input
            type="checkbox"
            checked={mixIntoDownload}
            onChange={(e) => onMixIntoDownloadChange(e.target.checked)}
            className="rounded accent-teal-500 cursor-pointer"
          />
          <span className="font-medium">มิกซ์รวมลงในไฟล์ดาวน์โหลด (.wav)</span>
        </label>
      </div>

      {/* คำอธิบายวิธีใช้งานดนตรีพื้นหลัง */}
      <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-200 text-xs flex items-start gap-2.5">
        <span className="text-base shrink-0">💡</span>
        <div className="space-y-0.5 text-[11px] leading-relaxed">
          <strong className="text-teal-300 font-semibold block">คำอธิบายวิธีใช้เสียงดนตรีพื้นหลัง (ทางเลือกเสริม):</strong>
          <span>หากต้องการให้คลิปมีดนตรีคลอเบาๆ สามารถคลิกเลือกบรรยากาศ เช่น คาเฟ่, ธรรมชาติ, หรือ Lo-Fi ได้ หรือเลือก <strong>"ไม่มีเสียงพื้นหลัง"</strong> หากต้องการเฉพาะเสียงพูดพากย์ล้วนๆ คมชัด 100%</span>
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {AMBIENT_PRESETS.map((preset) => {
          const isSelected = selectedAmbient === preset.id;
          const isThisPreviewing = isPreviewing === preset.id;

          return (
            <div
              key={preset.id}
              onClick={() => handleSelect(preset)}
              className={`p-3 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-teal-500/15 border-teal-400 text-white shadow-md ring-2 ring-teal-400/40'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-750 hover:border-slate-500'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl">{preset.icon}</span>
                  {preset.id !== 'none' && (
                    <button
                      type="button"
                      onClick={(e) => playPreview(preset.id, e)}
                      className={`p-1 rounded-md text-[10px] font-bold transition-colors ${
                        isThisPreviewing
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-slate-700 hover:bg-teal-500 hover:text-slate-950 text-slate-300'
                      }`}
                      title={isThisPreviewing ? 'หยุดฟัง' : 'ลองฟังตัวอย่างเสียง'}
                    >
                      {isThisPreviewing ? (
                        <Square className="w-3 h-3 fill-current" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                    </button>
                  )}
                </div>

                <div className="font-bold text-xs text-slate-100 truncate">
                  {preset.title}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/60 mt-2 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 line-clamp-1">{preset.subtitle.split('•')[0]}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Volume Slider for Background Music */}
      {selectedAmbient !== 'none' && (
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-teal-400" />
            <div>
              <span className="text-xs font-bold text-slate-200">
                ระดับเสียงพื้นหลัง: <span className="font-mono text-teal-400">{Math.round(ambientVolume * 100)}%</span>
              </span>
              <p className="text-[11px] text-slate-400">
                (แนะนำ 15% - 22% เพื่อให้เสียงคนพากย์เด่นชัด ไม่โดนดนตรีกลบ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-64">
            <span className="text-[11px] text-slate-500 font-mono">5%</span>
            <input
              type="range"
              min="0.05"
              max="0.45"
              step="0.01"
              value={ambientVolume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-[11px] text-slate-500 font-mono">45%</span>

            <button
              type="button"
              onClick={() => playPreview(selectedAmbient)}
              className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-medium shrink-0 flex items-center gap-1 cursor-pointer"
            >
              {isPreviewing === selectedAmbient ? (
                <>
                  <Square className="w-3 h-3 fill-current text-rose-400" />
                  <span>หยุด</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current text-teal-400" />
                  <span>ลองฟัง</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
