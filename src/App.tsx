import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Volume2,
} from 'lucide-react';
import type {
  GenderType,
  RegionType,
  VocalEqProfile,
  VoiceName,
} from './types/voice';
import {
  REGIONAL_METAS,
  getCharactersByGender,
  getDefaultScriptForRegionAndGender,
  getSmartVoiceParameters,
  isDefaultWelcomeScript,
  resolveStudioCharacter,
  translateCentralToDialect,
} from './utils/dialectTranslator';
import {
  decodeBase64ToAudioBuffer,
  renderProcessedWav,
} from './utils/wavAudioProcessor';
import {
  playCharacterPreview,
  stopPreviewAudio,
} from './utils/audioPreviewPlayer';
import {
  createSyntheticSpeechBuffer,
  speakWithBrowserSpeech,
} from './utils/speechSynthEngine';

const REGION_ITEMS: { id: RegionType; label: string; sub: string }[] = [
  { id: 'central', label: 'ภาคกลาง', sub: 'มาตรฐาน' },
  { id: 'northern', label: 'ภาคเหนือ', sub: 'คำเมือง' },
  { id: 'isan', label: 'ภาคอีสาน', sub: 'เว้าอีสาน' },
  { id: 'southern', label: 'ภาคใต้', sub: 'แหลงใต้' },
];

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function App() {
  const [region, setRegion] = useState<RegionType>('central');
  const [gender, setGender] = useState<GenderType>('female');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);

  const [userPitch, setUserPitch] = useState<number>(1.0);
  const [userSpeed, setUserSpeed] = useState<number>(1.0);

  const [scriptText, setScriptText] = useState<string>(
    'สวัสดีค่ะ วันนี้อาหารร้านนี้อร่อยมาก รสชาติกลมกล่อม ราคาไม่แพง อยากชวนทุกคนมาลองชิมด้วยกันนะคะ'
  );
  const [copied, setCopied] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isReRenderingWav, setIsReRenderingWav] = useState<boolean>(false);
  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);
  const [isWebSpeechPlaying, setIsWebSpeechPlaying] = useState<boolean>(false);

  const [wavUrl, setWavUrl] = useState<string | null>(null);
  const [wavFileName, setWavFileName] = useState<string>('voiceover_central_Kore.wav');
  const [spokenScript, setSpokenScript] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const sourceAudioRef = useRef<{
    buffer: AudioBuffer;
    basePitch: number;
    baseCadence: number;
    gender: GenderType;
    eqProfile: VocalEqProfile;
    isFallback: boolean;
  } | null>(null);

  const availableCharacters = useMemo(
    () => getCharactersByGender(gender),
    [gender]
  );

  const activeCharacter = useMemo(
    () => resolveStudioCharacter(region, gender, selectedVoice),
    [region, gender, selectedVoice]
  );

  const activeSmartParams = useMemo(
    () => getSmartVoiceParameters(activeCharacter.id, region),
    [activeCharacter.id, region]
  );

  const liveDialectPreview = useMemo(() => {
    const trimmed = scriptText.trim();
    if (!trimmed) return '';
    if (!autoTranslate) return trimmed;
    return translateCentralToDialect(trimmed, region, gender).translatedText;
  }, [scriptText, region, gender, autoTranslate]);

  const showDialectPreview =
    autoTranslate &&
    region !== 'central' &&
    Boolean(scriptText.trim()) &&
    liveDialectPreview !== scriptText.trim();

  const stopAllPlayback = () => {
    stopPreviewAudio();
    setPreviewPlayingId(null);
    setIsWebSpeechPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSelectRegion = (nextRegion: RegionType) => {
    stopAllPlayback();
    setRegion(nextRegion);
    if (isDefaultWelcomeScript(scriptText)) {
      setScriptText(getDefaultScriptForRegionAndGender(nextRegion, gender));
    }
  };

  const handleSelectGender = (nextGender: GenderType) => {
    stopAllPlayback();
    setGender(nextGender);
    const nextChar = resolveStudioCharacter(region, nextGender);
    setSelectedVoice(nextChar.id);
    if (isDefaultWelcomeScript(scriptText)) {
      setScriptText(getDefaultScriptForRegionAndGender(region, nextGender));
    }
  };

  const handleSelectCharacter = (voiceId: VoiceName) => {
    if (selectedVoice === voiceId) return;
    stopAllPlayback();
    setSelectedVoice(voiceId);
  };

  const handleCardPreview = (e: React.MouseEvent, voiceId: VoiceName) => {
    e.stopPropagation();
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setIsWebSpeechPlaying(false);

    void playCharacterPreview({
      characterId: voiceId,
      region,
      userPitch,
      userSpeed,
      onStateChange: (playing, id) => {
        setPreviewPlayingId(playing ? id : null);
      },
    });
  };

  const handleReset = () => {
    stopAllPlayback();
    setUserPitch(1.0);
    setUserSpeed(1.0);
    setAutoTranslate(true);
  };

  // Re-bake .WAV client-side when user fine-tunes Pitch or Speed sliders
  useEffect(() => {
    if (!sourceAudioRef.current) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!sourceAudioRef.current || cancelled) return;
      setIsReRenderingWav(true);
      try {
        const src = sourceAudioRef.current;
        const rendered = await renderProcessedWav(src.buffer, {
          baseVoicePitch: src.basePitch,
          baseVoiceCadence: src.baseCadence,
          userPitch,
          userSpeed,
          gender: src.gender,
          eqProfile: src.eqProfile,
          isFallback: src.isFallback,
        });
        if (!cancelled) {
          setWavUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return rendered.wavUrl;
          });
          setDuration(rendered.durationSeconds);
          setIsPlaying(false);
          setCurrentTime(0);
        }
      } catch {
        // Silent safe skip
      } finally {
        if (!cancelled) setIsReRenderingWav(false);
      }
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [userPitch, userSpeed]);

  const handleCopyScript = () => {
    if (!scriptText.trim()) return;
    navigator.clipboard?.writeText(scriptText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // Speak full script directly via 100% client-side Web Speech API (0% quota)
  const handleToggleLiveWebSpeech = () => {
    if (isWebSpeechPlaying) {
      stopAllPlayback();
      return;
    }

    stopAllPlayback();
    const rawInput = scriptText.trim() || activeCharacter.sampleText;
    if (!scriptText.trim()) {
      setScriptText(rawInput);
    }

    setIsWebSpeechPlaying(true);
    const ok = speakWithBrowserSpeech(rawInput, activeCharacter.id, {
      region,
      userPitch,
      userRate: userSpeed,
      autoTranslate,
      onEnd: () => setIsWebSpeechPlaying(false),
      onError: () => setIsWebSpeechPlaying(false),
    });
    if (!ok) {
      setIsWebSpeechPlaying(false);
    }
  };

  // Direct Generate & Export .WAV (0% Gemini Quota + Error-Free Vercel Fallback)
  const handleGenerateWav = async () => {
    let cleanInput = scriptText.trim();
    if (!cleanInput) {
      cleanInput = getDefaultScriptForRegionAndGender(region, gender);
      setScriptText(cleanInput);
      textareaRef.current?.focus();
    }

    stopAllPlayback();
    setIsGenerating(true);

    const smart = getSmartVoiceParameters(activeCharacter.id, region);
    const localSpokenText = autoTranslate
      ? translateCentralToDialect(cleanInput, region, gender).translatedText
      : cleanInput;

    let finalSpokenText = localSpokenText;
    let rawDecodedBuffer: AudioBuffer | null = null;
    let basePitch = smart.wavPitchFactor;
    let baseCadence = smart.wavCadenceFactor;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500);

      try {
        const response = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            text: cleanInput,
            voiceName: activeCharacter.id,
            region,
            gender,
            autoTranslate,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.spokenText) {
            finalSpokenText = data.spokenText;
          }
          if (typeof data?.voicePitchFactor === 'number') {
            basePitch = data.voicePitchFactor;
          }
          if (typeof data?.voiceCadenceFactor === 'number') {
            baseCadence = data.voiceCadenceFactor;
          }
          if (data?.audioBase64) {
            rawDecodedBuffer = await decodeBase64ToAudioBuffer(
              data.audioBase64,
              data.mimeType || 'audio/mpeg'
            );
          }
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch {
      // Gracefully proceed to client-side fallback without throwing any error UI
    }

    try {
      let usedOfflineSynth = false;
      if (!rawDecodedBuffer) {
        usedOfflineSynth = true;
        const synth = await createSyntheticSpeechBuffer(
          finalSpokenText,
          activeCharacter.id,
          1.0,
          region
        );
        rawDecodedBuffer = synth.buffer;
      }

      sourceAudioRef.current = {
        buffer: rawDecodedBuffer,
        basePitch,
        baseCadence,
        gender,
        eqProfile: activeCharacter.eqProfile,
        isFallback: true,
      };

      const rendered = await renderProcessedWav(rawDecodedBuffer, {
        baseVoicePitch: basePitch,
        baseVoiceCadence: baseCadence,
        userPitch,
        userSpeed,
        gender,
        eqProfile: activeCharacter.eqProfile,
        isFallback: true,
      });

      const fileName = `voiceover_${activeCharacter.id.toLowerCase()}_${region}.wav`;
      setWavUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return rendered.wavUrl;
      });
      setWavFileName(fileName);
      setSpokenScript(finalSpokenText);
      setDuration(rendered.durationSeconds);
      setCurrentTime(0);

      if (usedOfflineSynth) {
        speakWithBrowserSpeech(finalSpokenText, activeCharacter.id, {
          region,
          userPitch,
          userRate: userSpeed,
          autoTranslate: false,
        });
      } else {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          }
        }, 50);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleWavPlayback = () => {
    const el = audioRef.current;
    if (!el || !wavUrl) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      stopPreviewAudio();
      setPreviewPlayingId(null);
      setIsWebSpeechPlaying(false);
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = parseFloat(e.target.value);
    setCurrentTime(nextTime);
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  };

  const effectiveDisplayPitch = (activeSmartParams.webSpeechPitch * userPitch).toFixed(2);
  const effectiveDisplayRate = (activeSmartParams.webSpeechRate * userSpeed).toFixed(2);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Minimal Studio Header */}
      <header className="h-14 border-b border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm sm:text-base tracking-tight text-slate-100 truncate">
              AI Voiceover Studio
            </span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/70 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตค่าเสียง</span>
          </button>
        </div>
      </header>

      {/* Streamlined 4-Block Studio Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-4">
        {/* 1. Accent / Style Selection */}
        <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-200">
              สำเนียงและสไตล์ภาษา
            </h2>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none whitespace-nowrap shrink-0">
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="accent-amber-500 rounded cursor-pointer"
              />
              <span>แปลงคำศัพท์ตามภาคอัตโนมัติ</span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {REGION_ITEMS.map((item) => {
              const active = region === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectRegion(item.id)}
                  className={`text-left px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-500/12 border-amber-500 text-slate-50'
                      : 'bg-[#0B0F17]/70 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:text-slate-100'
                  }`}
                >
                  <div className="font-semibold text-sm whitespace-nowrap">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {item.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Gender & 12 Voice Talent Cards (with Play Preview) */}
        <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <h2 className="text-sm font-semibold text-slate-200">
              เลือกเพศและนักพากย์
            </h2>

            {/* Gender Segmented Control */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#0B0F17] border border-slate-800/90 sm:w-72">
              <button
                type="button"
                onClick={() => handleSelectGender('female')}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  gender === 'female'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                เสียงผู้หญิง (6)
              </button>
              <button
                type="button"
                onClick={() => handleSelectGender('male')}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  gender === 'male'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                เสียงผู้ชาย (6)
              </button>
            </div>
          </div>

          {/* 6 Voice Talent Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {availableCharacters.map((char) => {
              const isSelected = activeCharacter.id === char.id;
              const smart = getSmartVoiceParameters(char.id, region);
              const cardPreviewId = `voice_${char.id}_${region}`;
              const isPreviewing = previewPlayingId === cardPreviewId;

              return (
                <div
                  key={char.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectCharacter(char.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectCharacter(char.id);
                    }
                  }}
                  className={`group flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-lg border transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-slate-50'
                      : 'bg-[#0B0F17]/70 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:text-slate-100'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-slate-100 truncate">
                        {char.name}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0">
                        P {smart.webSpeechPitch.toFixed(2)} · R {smart.webSpeechRate.toFixed(2)}x
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {char.roleLabel}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleCardPreview(e, char.id)}
                    aria-label={`ฟังตัวอย่างเสียง ${char.name}`}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      isPreviewing
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-amber-500/20 hover:text-amber-300'
                    }`}
                  >
                    {isPreviewing ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Compact Smart Pitch & Rate Fine-Tuning Bar */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">โทนเสียง (Pitch)</span>
                <span className="font-mono tabular-nums text-amber-400">
                  {effectiveDisplayPitch}
                </span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.2}
                step={0.01}
                value={userPitch}
                onChange={(e) => setUserPitch(parseFloat(e.target.value))}
                aria-label="ปรับโทนเสียง"
                className="w-full studio-slider"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">ความเร็ว (Rate)</span>
                <span className="font-mono tabular-nums text-amber-400">
                  {effectiveDisplayRate}x
                </span>
              </div>
              <input
                type="range"
                min={0.75}
                max={1.35}
                step={0.05}
                value={userSpeed}
                onChange={(e) => setUserSpeed(parseFloat(e.target.value))}
                aria-label="ปรับความเร็วเสียง"
                className="w-full studio-slider"
              />
            </div>
          </div>
        </section>

        {/* 3. Clean Voiceover Script Textarea */}
        <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-200">
              บทพากย์เสียง
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleLiveWebSpeech}
                className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                {isWebSpeechPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span>หยุดฟังสด</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>ฟังสดทันที</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyScript}
                aria-label="คัดลอกบทพากย์"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setScriptText('')}
                aria-label="ล้างบทพากย์"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={5}
            placeholder="พิมพ์บทพากย์ภาษาไทยที่นี่..."
            className="w-full min-h-[156px] bg-[#0B0F17] border border-slate-800 focus:border-amber-500 rounded-xl p-4 text-base text-slate-100 placeholder:text-slate-600 focus:outline-none leading-relaxed resize-y"
          />

          {showDialectPreview && (
            <div className="bg-[#0B0F17]/90 border border-slate-800/90 rounded-lg px-3.5 py-2 text-xs text-slate-300 leading-relaxed">
              <span className="text-amber-400 font-medium mr-1.5">
                {REGIONAL_METAS[region].nameThai}:
              </span>
              <span>{liveDialectPreview}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
            <span>
              {activeCharacter.name} · {REGIONAL_METAS[region].shortTitle}
            </span>
            <span>{scriptText.length} ตัวอักษร</span>
          </div>
        </section>

        {/* 4. Direct Generate / Export Button (.WAV) */}
        <section className="space-y-3.5">
          <button
            type="button"
            onClick={handleGenerateWav}
            disabled={isGenerating}
            className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.995] text-slate-950 font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                <span>กำลังสร้างไฟล์เสียง .WAV ({activeCharacter.name})...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5 shrink-0" />
                <span>
                  สร้างและส่งออกเสียงพากย์ (.WAV) · {activeCharacter.name}
                </span>
              </>
            )}
          </button>

          {wavUrl && (
            <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
              <audio
                ref={audioRef}
                src={wavUrl}
                onTimeUpdate={() => {
                  if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                }}
                onLoadedMetadata={() => {
                  if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
                    setDuration(audioRef.current.duration);
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={toggleWavPlayback}
                    aria-label={isPlaying ? 'หยุดเล่น' : 'เล่นไฟล์เสียง'}
                    className="w-10 h-10 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-200 truncate">
                        {activeCharacter.name} · {REGIONAL_METAS[region].nameThai}
                        {isReRenderingWav ? ' · กำลังปรับโทนเสียง...' : ''}
                      </span>
                      <span className="font-mono tabular-nums text-slate-400 shrink-0">
                        {formatDuration(currentTime)} / {formatDuration(duration)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={Math.max(0.1, duration)}
                      step={0.05}
                      value={Math.min(currentTime, duration || 0)}
                      onChange={handleSeek}
                      aria-label="แถบเวลาเล่นไฟล์เสียง"
                      className="w-full studio-slider"
                    />
                  </div>
                </div>

                <a
                  href={wavUrl}
                  download={wavFileName}
                  className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-white text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด .WAV</span>
                </a>
              </div>

              {spokenScript && spokenScript !== scriptText.trim() && (
                <div className="pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                  <span className="text-slate-300 font-medium mr-1.5">บทพากย์ตามสำเนียง:</span>
                  <span>{spokenScript}</span>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
