import React from 'react';
import { SpeedPreset } from '../types/voice';
import { Gauge, Zap, Turtle, Rocket, Sliders } from 'lucide-react';

interface SpeedSelectorProps {
  speed: SpeedPreset;
  onSpeedChange: (speed: SpeedPreset, rate: number) => void;
  speedRate: number;
  onSpeedRateChange: (rate: number) => void;
}

export const SPEED_CONFIG: Record<
  SpeedPreset,
  { label: string; sublabel: string; rate: number; icon: React.ReactNode; color: string }
> = {
  slow: {
    label: 'ช้า',
    sublabel: 'เน้นความชัดเจน นุ่มนวล สุขุม (0.75x)',
    rate: 0.75,
    icon: <Turtle className="w-5 h-5" />,
    color: 'from-blue-500/20 to-cyan-500/10 text-cyan-300 border-cyan-500/40 hover:border-cyan-400',
  },
  normal: {
    label: 'ปกติ',
    sublabel: 'จังหวะธรรมชาติ มาตรฐาน สนทนาทั่วไป (1.0x)',
    rate: 1.0,
    icon: <Zap className="w-5 h-5" />,
    color: 'from-amber-500/20 to-orange-500/10 text-amber-300 border-amber-500/40 hover:border-amber-400',
  },
  fast: {
    label: 'เร็ว',
    sublabel: 'กระชับ คล่องแคล่ว เร่งเร้า สปอตโฆษณา (1.35x)',
    rate: 1.35,
    icon: <Rocket className="w-5 h-5" />,
    color: 'from-rose-500/20 to-pink-500/10 text-rose-300 border-rose-500/40 hover:border-rose-400',
  },
};

export const SpeedSelector: React.FC<SpeedSelectorProps> = ({
  speed,
  onSpeedChange,
  speedRate,
  onSpeedRateChange,
}) => {
  const [showCustomSlider, setShowCustomSlider] = React.useState(false);

  const handleSelectPreset = (presetKey: SpeedPreset) => {
    const defaultRate = SPEED_CONFIG[presetKey].rate;
    onSpeedChange(presetKey, defaultRate);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative z-20">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-base">
              ความเร็วในการพูดของ AI
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 font-mono">
                {speedRate.toFixed(2)}x ({SPEED_CONFIG[speed].label})
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              เลือกระดับความเร็วในการออกเสียงพากย์ (ช้า / ปกติ / เร็ว)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomSlider(!showCustomSlider)}
          className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
          title="ปรับความเร็วละเอียดแบบกำหนดเอง"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showCustomSlider ? 'ซ่อนตัวเลื่อนละเอียด' : 'ปรับละเอียด'}</span>
        </button>
      </div>

      {/* คำอธิบายวิธีใช้งานจุดที่ 3 */}
      <div className="mb-3.5 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs flex items-start gap-2.5">
        <span className="text-base shrink-0">💡</span>
        <div className="space-y-0.5 text-[11px] leading-relaxed">
          <strong className="text-cyan-300 font-semibold block">คำอธิบายวิธีเลือกระดับความเร็ว:</strong>
          <span>
            🐢 <strong>ช้า (0.75x):</strong> เหมาะสำหรับบทเรียน, เล่านิทาน, สารคดีที่ต้องการความชัดเจนทุกพยางค์<br/>
            ⚡ <strong>ปกติ (1.0x):</strong> จังหวะมาตรฐานพูดเป็นธรรมชาติ เหมาะสำหรับงานโฆษณา รีวิว และวิดีโอทั่วไป (แนะนำ)<br/>
            🚀 <strong>เร็ว (1.35x):</strong> จังหวะกระชับ ฉับไว เหมาะสำหรับคลิปสั้น TikTok, Reels, สรุปข่าว
          </span>
        </div>
      </div>

      {/* 3 Main Speed Presets as requested by user */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['slow', 'normal', 'fast'] as SpeedPreset[]).map((key) => {
          const config = SPEED_CONFIG[key];
          const isSelected = speed === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectPreset(key)}
              className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? `bg-gradient-to-br ${config.color} ring-2 ring-amber-500/50 shadow-md`
                  : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected ? 'bg-white/10 text-white' : 'bg-slate-700/50 text-slate-400'
                    }`}
                  >
                    {config.icon}
                  </div>
                  <span className="font-bold text-base text-slate-100">{config.label}</span>
                </div>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-black/30 text-slate-200">
                  {config.rate}x
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{config.sublabel}</p>

              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Fine-Tuning Slider */}
      {showCustomSlider && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">ปรับความเร็วแบบอิสระ (0.50x - 2.00x):</span>
            <span className="font-mono text-amber-400 font-bold">{speedRate.toFixed(2)}x</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">0.5x</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speedRate}
              onChange={(e) => onSpeedRateChange(parseFloat(e.target.value))}
              className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <span className="text-xs text-slate-500">2.0x</span>
          </div>
        </div>
      )}
    </div>
  );
};
