import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  CheckCircle2,
  Music,
  Activity,
  BarChart3,
  MessageSquareQuote,
} from 'lucide-react';
import { AudioSpectrumVisualizer } from './AudioSpectrumVisualizer';
import { AudioWaveformChart } from './AudioWaveformChart';

interface AudioPlayerProps {
  audioUrl: string | null;
  audioBase64?: string | null;
  title?: string;
  voiceName?: string;
  spokenText?: string | null;
  dialectLabel?: string | null;
  isMixing?: boolean;
  generationId?: number;
  speedRate: number;
  onSpeedRateChange: (rate: number) => void;
  speedPreset: 'slow' | 'normal' | 'fast';
  onSpeedPresetChange: (preset: 'slow' | 'normal' | 'fast', rate: number) => void;
  genderLabel?: string;
  ambientLabel?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  audioBase64,
  title = 'เสียงพากย์ AI',
  voiceName = 'Kore',
  spokenText,
  dialectLabel,
  isMixing = false,
  generationId = 0,
  speedRate,
  onSpeedPresetChange,
  speedPreset,
  genderLabel = 'เสียงผู้หญิง',
  ambientLabel,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAutoPlayedGenRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeVisualizerTab, setActiveVisualizerTab] = useState<'recharts' | 'spectrum'>('recharts');

  // IMPORTANT: speedRate is already baked into audioUrl via pitch-preserving WSOLA in audioMixer.ts!
  // Keeping playbackRate === 1.0 guarantees 100% identical audio between browser Play and downloaded .wav!
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = 1.0;
    }
  }, [audioUrl, speedRate]);

  // Reset timeline when audioUrl updates, and auto-play when a brand-new generation completes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = 1.0;

      if (generationId > 0 && generationId !== lastAutoPlayedGenRef.current) {
        lastAutoPlayedGenRef.current = generationId;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay blocked by browser policy; user can click Play button
            setIsPlaying(false);
          });
      }
    }
  }, [audioUrl, generationId]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = 1.0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio play error:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      audioRef.current.playbackRate = 1.0;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = 1.0;
      setCurrentTime(0);
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec)) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Download audio file function (downloads the exact WSOLA speed-scaled + dialect-voiced + ambient-mixed WAV)
  const handleDownload = () => {
    if (!audioUrl) return;

    const cleanVoice = voiceName.replace(/[^a-zA-Z0-9ก-๙_-]/g, '_').replace(/_+/g, '_');
    const speedThai = speedPreset === 'slow' ? 'ช้า' : speedPreset === 'normal' ? 'ปกติ' : 'เร็ว';
    const fileName = `พากย์เสียงAI_${cleanVoice}_ความเร็ว${speedThai}_${Date.now()}.wav`;

    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  if (!audioUrl) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center text-slate-500 space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto text-slate-400">
          <Play className="w-6 h-6 ml-1" />
        </div>
        <div>
          <p className="font-semibold text-slate-300 text-sm mb-1">ยังไม่มีเสียงพากย์ที่สร้าง</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            ทำตามขั้นตอนด้านซ้าย: เลือกภาษาถิ่น & เสียงพากย์ (เช่น สาวนุ้ย แหลงใต้), พิมพ์ข้อความ แล้วกดปุ่ม &quot;สร้างเสียงพากย์ AI&quot;
          </p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-left max-w-md mx-auto space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <span>💡 คำอธิบายเครื่องเล่น & ไฟล์ดาวน์โหลด (.WAV):</span>
          </div>
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            เมื่อสร้างเสร็จ เสียงที่คุณกดฟังในเครื่องเล่นนี้และไฟล์ <strong className="text-white">.WAV ที่กดดาวน์โหลด</strong> จะตรงกับสำเนียงภาษาถิ่น (เหนือ/อีสาน/ใต้/กลาง) สไตล์อารมณ์ และความเร็วที่คุณเลือก 100% ทุกประการ!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden ring-1 ring-amber-500/20">
      {/* Glow accent */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-100 text-sm">{title}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                {genderLabel} • {voiceName}
              </span>
              {dialectLabel && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                  🗣️ {dialectLabel}
                </span>
              )}
              {ambientLabel && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-medium flex items-center gap-1">
                  <Music className="w-3 h-3" />
                  <span>{ambientLabel}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>
                ความเร็วไฟล์เสียง: {speedRate.toFixed(2)}x ({speedPreset === 'slow' ? 'ช้า' : speedPreset === 'normal' ? 'ปกติ' : 'เร็ว'})
              </span>
              <span>•</span>
              <span className="text-emerald-400">
                {isMixing ? 'กำลังอัปเดตไฟล์ .wav...' : 'ไฟล์ .wav พร้อมดาวน์โหลด (ตรงตามที่เล่น 100%)'}
              </span>
            </p>
          </div>
        </div>

        {/* PRIMARY DOWNLOAD BUTTON */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isMixing}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-60 ${
            downloadSuccess
              ? 'bg-emerald-600 text-white shadow-emerald-900/40 ring-2 ring-emerald-400'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/40 hover:scale-[1.02] active:scale-[0.98]'
          }`}
          title="ดาวน์โหลดไฟล์เสียง (.wav) ลงเครื่องคอมพิวเตอร์หรือโทรศัพท์"
        >
          {downloadSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>ดาวน์โหลดสำเร็จ!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์เสียง (.wav)</span>
            </>
          )}
        </button>
      </div>

      {/* Actual Spoken Dialect Transcript Display */}
      {spokenText && (
        <div className="mb-4 p-3 rounded-xl bg-slate-950/85 border border-amber-500/25 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5 text-amber-400" />
              <span>บทพูดที่ออกเสียงจริงในไฟล์เสียง ({dialectLabel || voiceName}):</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">✓ บันทึกลงไฟล์ .wav แล้ว</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            &ldquo;{spokenText}&rdquo;
          </p>
        </div>
      )}

      {/* Visualizer Mode Tabs */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveVisualizerTab('recharts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeVisualizerTab === 'recharts'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>📊 ภาพรวมรูปคลื่นเสียง (Waveform)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveVisualizerTab('spectrum')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeVisualizerTab === 'spectrum'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>⚡ สเปกตรัมความถี่ Real-time</span>
          </button>
        </div>

        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
          24kHz Studio WAV
        </span>
      </div>

      {/* Visualizer Body */}
      <div className="mb-4">
        {activeVisualizerTab === 'recharts' ? (
          <AudioWaveformChart
            audioUrl={audioUrl}
            audioBase64={audioBase64}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={(targetSec) => {
              setCurrentTime(targetSec);
              if (audioRef.current) {
                audioRef.current.currentTime = targetSec;
              }
            }}
          />
        ) : (
          <AudioSpectrumVisualizer
            audioElement={audioRef.current}
            isPlaying={isPlaying}
            audioUrl={audioUrl}
            currentTime={currentTime}
            duration={duration}
            speedRate={speedRate}
            genderLabel={genderLabel}
            voiceName={voiceName}
          />
        )}
      </div>

      {/* Progress scrubber */}
      <div className="space-y-1 mb-4">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-400 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls and Speed bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Replay */}
          <button
            type="button"
            onClick={handleRestart}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="เริ่มเล่นใหม่ตั้งแต่ต้น"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1.5 rounded-xl">
            <button
              type="button"
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-700 rounded appearance-none accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Realtime Speed Controller on player (also updates downloadable WAV!) */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <span className="text-[11px] text-slate-400 font-medium px-1 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-amber-400" /> ความเร็ว:
          </span>
          <button
            type="button"
            onClick={() => onSpeedPresetChange('slow', 0.75)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              speedPreset === 'slow'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ช้า (0.75x)
          </button>
          <button
            type="button"
            onClick={() => onSpeedPresetChange('normal', 1.0)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              speedPreset === 'normal'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ปกติ (1.0x)
          </button>
          <button
            type="button"
            onClick={() => onSpeedPresetChange('fast', 1.35)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              speedPreset === 'fast'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            เร็ว (1.35x)
          </button>
        </div>
      </div>

      {/* คำอธิบายวิธีใช้งานและดาวน์โหลด */}
      <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-start gap-2.5">
        <span className="text-base shrink-0">💡</span>
        <div className="space-y-0.5 text-[11px] leading-relaxed">
          <strong className="text-emerald-300 font-semibold block">เสียงที่เล่นและไฟล์ที่ดาวน์โหลดตรงกัน 100%:</strong>
          <span>ระบบประมวลผลสำเนียงภาษาถิ่น อารมณ์ความเร็วแบบคงระดับเสียงธรรมชาติ (Pitch-Preserving WSOLA) และเพลงบรรยากาศลงในไฟล์ <strong className="text-white">.WAV</strong> โดยตรง เมื่อกดดาวน์โหลดจะได้เสียงเดียวกับที่คุณกดฟังทุกประการ</span>
        </div>
      </div>
    </div>
  );
};
