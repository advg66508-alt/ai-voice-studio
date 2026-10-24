import React, { useState, useMemo, useRef } from 'react';
import { SAMPLE_SCRIPTS, VOICES } from '../data/presets';
import { SampleScript } from '../types/voice';
import { applyVoiceCharacterShift, audioBufferToWav } from '../utils/audioMixer';
import {
  BookOpen,
  Search,
  Volume2,
  Square,
  Check,
  Users,
  Music,
  Zap,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface SampleScriptsSectionProps {
  onApplySample: (sample: SampleScript) => void;
  activeSampleId?: string | null;
}

type CategoryTab = 'all' | 'dialect' | 'commercial' | 'cinema' | 'business' | 'relax' | 'dialogue';

interface CategoryOption {
  id: CategoryTab;
  label: string;
  icon: string;
  count: number;
}

export const SampleScriptsSection: React.FC<SampleScriptsSectionProps> = ({
  onApplySample,
  activeSampleId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [recentlyLoadedId, setRecentlyLoadedId] = useState<string | null>(null);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryTab, number> = {
      all: SAMPLE_SCRIPTS.length,
      dialect: 0,
      commercial: 0,
      cinema: 0,
      business: 0,
      relax: 0,
      dialogue: 0,
    };
    SAMPLE_SCRIPTS.forEach((s) => {
      if (s.categoryGroup && counts[s.categoryGroup as CategoryTab] !== undefined) {
        counts[s.categoryGroup as CategoryTab]++;
      }
    });
    return counts;
  }, []);

  const categories: CategoryOption[] = [
    { id: 'all', label: 'ทั้งหมด', icon: '🌟', count: categoryCounts.all },
    { id: 'dialect', label: 'สำเนียง 4 ภาค', icon: '🗺️', count: categoryCounts.dialect },
    { id: 'commercial', label: 'โฆษณา & รีวิว', icon: '🛍️', count: categoryCounts.commercial },
    { id: 'cinema', label: 'หนัง & เกมโชว์', icon: '🎬', count: categoryCounts.cinema },
    { id: 'business', label: 'ธุรกิจ & ข่าว', icon: '💼', count: categoryCounts.business },
    { id: 'relax', label: 'ผ่อนคลาย & Vlog', icon: '🧘', count: categoryCounts.relax },
    { id: 'dialogue', label: 'บทสนทนา 2 คน', icon: '👥', count: categoryCounts.dialogue },
  ];

  // Filtered samples
  const filteredSamples = useMemo(() => {
    return SAMPLE_SCRIPTS.filter((sample) => {
      // Category filter
      if (selectedCategory !== 'all' && sample.categoryGroup !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = sample.title.toLowerCase().includes(q);
        const matchText = sample.text.toLowerCase().includes(q);
        const matchCategory = sample.category.toLowerCase().includes(q);
        const matchVoice = sample.recommendedVoice.toLowerCase().includes(q);
        const matchTags = sample.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        return matchTitle || matchText || matchCategory || matchVoice || matchTags;
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const sampleAudioCacheRef = useRef<Map<string, string>>(new Map());

  // Handle Quick Speech Preview using authentic Gemini Studio TTS (with in-memory cache)
  const handleQuickListen = async (e: React.MouseEvent, sample: SampleScript) => {
    e.stopPropagation();

    if (playingSampleId === sample.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingSampleId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setPlayingSampleId(sample.id);
    const cleanSpeech = sample.text.replace(/\[SFX:[^\]]+\]/g, '').replace(/<[^>]+>/g, '').trim();

    try {
      let cachedUrl = sampleAudioCacheRef.current.get(sample.id);
      if (!cachedUrl) {
        const res = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanSpeech,
            voiceName: sample.recommendedVoice,
            speed: sample.recommendedSpeed,
            autoTranslate: true,
          }),
        });
        const data = await res.json();
        if (data.audioBase64) {
          const mimeType = data.mimeType || 'audio/wav';
          const pitchFactor = typeof data.voicePitchFactor === 'number' ? data.voicePitchFactor : 1.0;
          const cadenceFactor = typeof data.voiceCadenceFactor === 'number' ? data.voiceCadenceFactor : 1.0;

          if (Math.abs(pitchFactor - 1.0) > 0.015 || Math.abs(cadenceFactor - 1.0) > 0.015) {
            const binary = atob(data.audioBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx: AudioContext = new AudioCtx();
            try {
              const decoded = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
              const shifted = applyVoiceCharacterShift(decoded, pitchFactor, cadenceFactor);
              const wavBlob = audioBufferToWav(shifted);
              cachedUrl = URL.createObjectURL(wavBlob);
            } finally {
              audioCtx.close().catch(() => {});
            }
          } else {
            cachedUrl = `data:${mimeType};base64,${data.audioBase64}`;
          }
          sampleAudioCacheRef.current.set(sample.id, cachedUrl);
        }
      }

      if (cachedUrl) {
        const audio = new Audio(cachedUrl);
        previewAudioRef.current = audio;
        audio.onended = () => setPlayingSampleId(null);
        audio.onerror = () => setPlayingSampleId(null);
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('Sample studio TTS preview fallback:', err);
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.lang = 'th-TH';
      utterance.rate = sample.recommendedSpeed === 'fast' ? 1.2 : sample.recommendedSpeed === 'slow' ? 0.85 : 1.0;
      utterance.onend = () => setPlayingSampleId(null);
      utterance.onerror = () => setPlayingSampleId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingSampleId(null);
    }
  };

  const handleSelectSample = (sample: SampleScript) => {
    setRecentlyLoadedId(sample.id);
    onApplySample(sample);
    setTimeout(() => {
      setRecentlyLoadedId(null);
    }, 2500);
  };

  // Helper to get voice info
  const getVoiceBadge = (voiceName: string) => {
    const v = VOICES.find((item) => item.id === voiceName);
    if (!v) return voiceName;
    if (v.gender === 'female') {
      return `👩 ${v.thaiName}`;
    } else if (v.gender === 'male') {
      return `👨 ${v.thaiName}`;
    }
    return `🎧 ${v.thaiName}`;
  };

  // Ambient sound label mapping
  const getAmbientBadge = (ambient?: string) => {
    switch (ambient) {
      case 'cafe':
        return '☕ คาเฟ่';
      case 'nature':
        return '🌿 ธรรมชาติ/ฝน';
      case 'ocean':
        return '🌊 คลื่นทะเล';
      case 'lofi':
        return '🎵 Lo-Fi';
      case 'cinematic':
        return '🎬 ซีเนมาติก';
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-100 text-sm">
                คลังตัวอย่างบทพากย์สำเร็จรูป
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                {SAMPLE_SCRIPTS.length} ตัวอย่าง
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              คลิกเพื่อโหลดบทพากย์ยอดนิยม ตั้งค่าเสียง สไตล์ และดนตรีพื้นหลังได้ทันที
            </p>
          </div>
        </div>
      </div>

      {/* คำอธิบายวิธีใช้งาน */}
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs flex items-start gap-2.5">
        <span className="text-base shrink-0">💡</span>
        <div className="space-y-0.5 text-[11px] leading-relaxed">
          <strong className="text-blue-300 font-semibold block">คำอธิบายวิธีใช้คลังบทพากย์:</strong>
          <span>คลิกที่การ์ดบทพากย์ที่ต้องการ ระบบจะนำข้อความและตั้งค่าเสียงที่เหมาะสมให้ทันที หรือกดปุ่มลำโพง <strong className="text-white">🔊 ฟัง</strong> เพื่อทดลองฟังเสียงพากย์ตัวอย่างก่อนได้</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาตัวอย่าง เช่น กาแฟ, TikTok, คำเมือง, อีสาน, แหลงใต้, รีวิว, ข่าว, นิทาน..."
          className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/70 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800 -mx-1 px-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1 rounded-full ${
                  isActive ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Script List Container */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
        {filteredSamples.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 space-y-2">
            <Filter className="w-6 h-6 mx-auto text-slate-600" />
            <p className="text-xs">ไม่พบตัวอย่างที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              รีเซ็ตตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          filteredSamples.map((sample) => {
            const isLoaded = recentlyLoadedId === sample.id;
            const isPlaying = playingSampleId === sample.id;
            const ambientBadge = getAmbientBadge(sample.recommendedAmbient);

            return (
              <div
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                  isLoaded
                    ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/70 border-slate-800/90 hover:border-amber-500/50 hover:bg-slate-900/90'
                }`}
              >
                {/* Header: Title + Category Badge */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-slate-200 group-hover:text-amber-300 transition-colors">
                      {sample.title}
                    </span>
                    {sample.isMultiSpeaker && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        2 ตัวละคร
                      </span>
                    )}
                  </div>

                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 font-medium border border-slate-700/50">
                    {sample.category}
                  </span>
                </div>

                {/* Text snippet preview */}
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2.5 font-normal">
                  {sample.text}
                </p>

                {/* Tags if any */}
                {sample.tags && sample.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    {sample.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata Row & Quick Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-850/80 text-[10px]">
                  <div className="flex items-center gap-2 flex-wrap text-slate-400">
                    <span className="text-amber-300 font-medium">
                      {getVoiceBadge(sample.recommendedVoice)}
                    </span>
                    <span>•</span>
                    <span>
                      สปีด:{' '}
                      {sample.recommendedSpeed === 'slow'
                        ? '0.75x (ช้า)'
                        : sample.recommendedSpeed === 'normal'
                        ? '1.0x (ปกติ)'
                        : '1.35x (เร็ว)'}
                    </span>
                    {ambientBadge && (
                      <>
                        <span>•</span>
                        <span className="text-blue-300 flex items-center gap-0.5">
                          <Music className="w-3 h-3 inline" /> {ambientBadge}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Instant Speak Button */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickListen(e, sample)}
                      className={`p-1.5 rounded-lg border text-xs transition-all flex items-center gap-1 cursor-pointer ${
                        isPlaying
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                      }`}
                      title={isPlaying ? 'หยุดฟัง' : 'ทดลองฟังเสียงสังเคราะห์ในเครื่อง'}
                    >
                      {isPlaying ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span className="text-[10px] hidden sm:inline">หยุด</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span className="text-[10px] hidden sm:inline">ฟัง</span>
                        </>
                      )}
                    </button>

                    {/* Load to Studio Indicator / Button */}
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isLoaded
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40'
                      }`}
                    >
                      {isLoaded ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>โหลดแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>โหลดใส่ห้องพากย์</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
