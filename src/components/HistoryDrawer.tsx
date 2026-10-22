import React from 'react';
import { GeneratedClip } from '../types/voice';
import { Play, Download, Trash2, Clock, Volume2, Sparkles } from 'lucide-react';

interface HistoryDrawerProps {
  history: GeneratedClip[];
  onSelectClip: (clip: GeneratedClip) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onSelectClip,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return null;
  }

  const handleDownloadClip = (clip: GeneratedClip, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = clip.audioUrl;
    link.download = `${clip.title || 'เสียงพากย์AI'}_${clip.voiceName}_${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base">
              ประวัติเสียงพากย์ที่สร้างแล้ว ({history.length})
            </h3>
            <p className="text-xs text-slate-400">
              คลิกเพื่อเปิดฟังซ้ำ หรือกดดาวน์โหลดไฟล์ .wav ลงเครื่องได้ทันที
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
          title="ล้างประวัติเสียงพากย์"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>ล้างทั้งหมด</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {history.map((clip) => (
          <div
            key={clip.id}
            onClick={() => onSelectClip(clip)}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-950 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-200 line-clamp-1">
                  {clip.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                  {clip.speedRate}x
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                &ldquo;{clip.text}&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
              <span className="text-[11px] text-slate-500">
                {clip.voiceName} • {clip.speed === 'slow' ? 'ช้า' : clip.speed === 'normal' ? 'ปกติ' : 'เร็ว'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleDownloadClip(clip, e)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                  title="ดาวน์โหลดไฟล์ .wav"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
