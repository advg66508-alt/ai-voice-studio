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
  Sliders,
  Trash2,
  Volume2,
} from 'lucide-react';
import type {
  GenderType,
  GeneratedClip,
  RegionType,
  SpeedPreset,
  VoiceName,
} from './types/voice';
import {
  DIALECT_DEMO_PHRASES,
  REGIONAL_METAS,
  getDefaultScriptForRegionAndGender,
  getCharactersByRegionAndGender,
  isDefaultWelcomeScript,
  resolveStudioCharacter,
  translateCentralToDialect,
} from './utils/dialectTranslator';
import {
  decodeBase64ToAudioBuffer,
  renderProcessedWav,
} from './utils/wavAudioProcessor';
import { playPreviewAudio, stopPreviewAudio } from './utils/audioPreviewPlayer';
import {
  createSyntheticSpeechBuffer,
  speakWithBrowserSpeech,
} from './utils/speechSynthEngine';

const REGION_ORDER: RegionType[] = ['central', 'northern', 'isan', 'southern'];

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function App() {
  // 1. Core Dialect & Character State
  const [region, setRegion] = useState<RegionType>('central');
  const [gender, setGender] = useState<GenderType>('female');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);

  // 2. Pitch & Speed Controls (1.00 = calibrated natural baseline for selected gender/character)
  const [userPitch, setUserPitch] = useState<number>(1.0);
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>('normal');
  const [userSpeed, setUserSpeed] = useState<number>(1.0);

  // 3. Script Input State
  const [scriptText, setScriptText] = useState<string>(
    'สวัสดีค่ะ วันนี้อาหารร้านนี้อร่อยมาก รสชาติกลมกล่อม ราคาไม่แพง อยากชวนทุกคนมาลองชิมด้วยกันนะคะ'
  );
  const [copied, setCopied] = useState<boolean>(false);

  // 4. Audio Generation & .WAV Playback State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isReRenderingWav, setIsReRenderingWav] = useState<boolean>(false);
  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [wavUrl, setWavUrl] = useState<string | null>(null);
  const [wavFileName, setWavFileName] = useState<string>('voiceover_central_female.wav');
  const [spokenScript, setSpokenScript] = useState<string | null>(null);
  const [activeDialectLabel, setActiveDialectLabel] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedClip[]>([]);

  // Player transport state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Raw decoded buffer ref so Pitch/Speed tweaks re-bake .WAV client-side instantaneously
  const sourceAudioRef = useRef<{
    buffer: AudioBuffer;
    basePitch: number;
    baseCadence: number;
    gender: GenderType;
    isFallback: boolean;
  } | null>(null);

  const availableCharacters = useMemo(
    () => getCharactersByRegionAndGender(region, gender),
    [region, gender]
  );

  const activeCharacter = useMemo(
    () => resolveStudioCharacter(region, gender, selectedVoice),
    [region, gender, selectedVoice]
  );

  // Live local dialect preview before/while typing
  const liveDialectPreview = useMemo(() => {
    if (!scriptText.trim()) return '';
    if (!autoTranslate && region === 'central') return scriptText.trim();
    return translateCentralToDialect(scriptText.trim(), region, gender).translatedText;
  }, [scriptText, region, gender, autoTranslate]);

  const showDialectPreviewBar =
    autoTranslate &&
    Boolean(scriptText.trim()) &&
    liveDialectPreview !== scriptText.trim();

  const charCount = scriptText.length;
  const estimatedSeconds = Math.max(
    1,
    Math.round(charCount / 14 / Math.max(0.6, userSpeed))
  );

  // Switch Region
  const handleSelectRegion = (nextRegion: RegionType) => {
    stopPreviewAudio();
    setPreviewPlayingId(null);
    setRegion(nextRegion);
    const nextChar = resolveStudioCharacter(nextRegion, gender);
    setSelectedVoice(nextChar.id);

    if (isDefaultWelcomeScript(scriptText)) {
      setScriptText(getDefaultScriptForRegionAndGender(nextRegion, gender));
    }
  };

  // Switch Gender
  const handleSelectGender = (nextGender: GenderType) => {
    stopPreviewAudio();
    setPreviewPlayingId(null);
    setGender(nextGender);
    const nextChar = resolveStudioCharacter(region, nextGender);
    setSelectedVoice(nextChar.id);

    if (isDefaultWelcomeScript(scriptText)) {
      setScriptText(getDefaultScriptForRegionAndGender(region, nextGender));
    }
  };

  // Speed Preset Handler
  const handleSpeedPreset = (preset: SpeedPreset) => {
    setSpeedPreset(preset);
    if (preset === 'slow') setUserSpeed(0.82);
    else if (preset === 'fast') setUserSpeed(1.22);
    else setUserSpeed(1.0);
  };

  const handleSpeedSliderChange = (rate: number) => {
    setUserSpeed(rate);
    if (rate <= 0.88) setSpeedPreset('slow');
    else if (rate >= 1.12) setSpeedPreset('fast');
    else setSpeedPreset('normal');
  };

  // Reset all studio settings
  const handleResetDefaults = () => {
    stopPreviewAudio();
    setPreviewPlayingId(null);
    setUserPitch(1.0);
    setUserSpeed(1.0);
    setSpeedPreset('normal');
    setAutoTranslate(true);
    setErrorMessage(null);
  };

  // Re-render .WAV whenever user fine-tunes Pitch or Speed on an already-generated clip
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
      } catch (err) {
        console.warn('WAV re-render skipped:', err);
      } finally {
        if (!cancelled) setIsReRenderingWav(false);
      }
    }, 110);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [userPitch, userSpeed]);

  // Preview character voice sample
  const handlePreviewVoice = () => {
    const sampleId = `voice_${activeCharacter.id}`;
    playPreviewAudio(
      sampleId,
      (playing, id) => {
        setPreviewPlayingId(playing ? id : null);
      },
      activeCharacter.sampleText,
      activeCharacter.id
    );
  };

  // Copy script
  const handleCopyScript = () => {
    if (!scriptText.trim()) return;
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Primary Action: Generate Voiceover & Encode 16-bit PCM .WAV
  const handleGenerateWav = async () => {
    const cleanInput = scriptText.trim();
    if (!cleanInput) {
      setErrorMessage('กรุณาพิมพ์บทพากย์ก่อนกดสร้างเสียง');
      return;
    }

    stopPreviewAudio();
    setPreviewPlayingId(null);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanInput,
          voiceName: activeCharacter.id,
          region,
          gender,
          speed: speedPreset,
          autoTranslate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'ไม่สามารถสร้างเสียงพากย์ได้ในขณะนี้');
      }

      const finalSpokenText: string =
        data.spokenText ||
        (autoTranslate
          ? translateCentralToDialect(cleanInput, region, gender).translatedText
          : cleanInput);

      let rawDecodedBuffer: AudioBuffer;
      const basePitch =
        typeof data.voicePitchFactor === 'number' ? data.voicePitchFactor : 1.0;
      const baseCadence =
        typeof data.voiceCadenceFactor === 'number' ? data.voiceCadenceFactor : 1.0;
      const isFallback = Boolean(data.isFallback);

      if (data.audioBase64) {
        rawDecodedBuffer = await decodeBase64ToAudioBuffer(
          data.audioBase64,
          data.mimeType || 'audio/wav'
        );
      } else {
        // Offline client-side backup if server had zero outbound network
        const synth = await createSyntheticSpeechBuffer(
          finalSpokenText,
          activeCharacter.id,
          1.0
        );
        rawDecodedBuffer = synth.buffer;
        speakWithBrowserSpeech(finalSpokenText, activeCharacter.id, userSpeed);
      }

      sourceAudioRef.current = {
        buffer: rawDecodedBuffer,
        basePitch,
        baseCadence,
        gender,
        isFallback,
      };

      const rendered = await renderProcessedWav(rawDecodedBuffer, {
        baseVoicePitch: basePitch,
        baseVoiceCadence: baseCadence,
        userPitch,
        userSpeed,
        gender,
        isFallback,
      });

      const safeFileName = `voiceover_${region}_${gender}_${Date.now().toString().slice(-5)}.wav`;
      const dialectTag = `${REGIONAL_METAS[region].nameThai} · ${
        gender === 'male' ? 'ชาย' : 'หญิง'
      }`;

      setWavUrl(rendered.wavUrl);
      setWavFileName(safeFileName);
      setSpokenScript(finalSpokenText);
      setActiveDialectLabel(dialectTag);
      setDuration(rendered.durationSeconds);
      setCurrentTime(0);

      const clipItem: GeneratedClip = {
        id: `clip-${Date.now()}`,
        title: `${activeCharacter.name} · ${REGIONAL_METAS[region].shortTitle}`,
        text: cleanInput.slice(0, 120),
        spokenText: finalSpokenText,
        dialectLabel: dialectTag,
        region,
        gender,
        voiceName: activeCharacter.id,
        speed: speedPreset,
        speedRate: userSpeed,
        pitchRate: userPitch,
        style: activeCharacter.roleLabel,
        audioUrl: rendered.wavUrl,
        createdAt: Date.now(),
        duration: rendered.durationSeconds,
        modelUsed: data.modelUsed,
        isFallback,
      };

      setHistory((prev) => [clipItem, ...prev.slice(0, 7)]);

      // Auto-play newly generated .WAV clip
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }, 60);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'เกิดข้อผิดพลาดในการสร้างเสียงพากย์ กรุณาลองใหม่อีกครั้ง';
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Play / Pause on main .WAV player
  const togglePlayback = () => {
    const el = audioRef.current;
    if (!el || !wavUrl) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      stopPreviewAudio();
      setPreviewPlayingId(null);
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

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Minimal Top Bar */}
      <header className="h-14 border-b border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="font-semibold text-sm sm:text-base tracking-tight text-slate-100">
                AI Voiceover Studio
              </span>
              <span className="hidden sm:inline text-xs text-slate-500 ml-2.5">
                สตูดิโอพากย์เสียงภาษาไทย 4 ภาค · ส่งออกไฟล์ .WAV
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/70 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ค่าเริ่มต้น</span>
          </button>
        </div>
      </header>

      {/* Main Minimal Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        {/* SECTION 1: เลือกสำเนียงภาค (4 Regions) */}
        <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-200">
              1. เลือกสำเนียงภาค
            </h2>
            <span className="text-xs text-slate-400">
              {REGIONAL_METAS[region].nameThai} · {REGIONAL_METAS[region].dialectTagline}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {REGION_ORDER.map((regKey) => {
              const meta = REGIONAL_METAS[regKey];
              const isSelected = region === regKey;
              return (
                <button
                  key={regKey}
                  type="button"
                  onClick={() => handleSelectRegion(regKey)}
                  className={`text-left px-3.5 py-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/12 border-amber-500 text-slate-50'
                      : 'bg-[#0B0F17]/70 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-semibold text-sm whitespace-nowrap">
                      {regKey === 'central'
                        ? 'ภาคกลาง'
                        : regKey === 'northern'
                        ? 'ภาคเหนือ'
                        : regKey === 'isan'
                        ? 'ภาคอีสาน'
                        : 'ภาคใต้'}
                    </span>
                    <span className="text-sm leading-none">{meta.icon}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {regKey === 'central'
                      ? 'ภาษากลางมาตรฐาน'
                      : regKey === 'northern'
                      ? 'คำเมือง · อู้กำเมือง'
                      : regKey === 'isan'
                      ? 'เว้าอีสาน · ม่วนซื่น'
                      : 'แหลงใต้ · ปักษ์ใต้'}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: เลือกเพศ คาแรคเตอร์ และโทนเสียง (Gender, Character & Pitch/Speed) */}
        <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left: Gender & Character Selection (7 cols) */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-200">
                  2. เพศและคาแรคเตอร์ผู้พากย์
                </h2>
                <button
                  type="button"
                  onClick={handlePreviewVoice}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {previewPlayingId === `voice_${activeCharacter.id}` ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>หยุดฟังตัวอย่าง</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>ฟังตัวอย่างเสียง</span>
                    </>
                  )}
                </button>
              </div>

              {/* Gender Segmented Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#0B0F17] border border-slate-800/90">
                <button
                  type="button"
                  onClick={() => handleSelectGender('female')}
                  className={`py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    gender === 'female'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  เสียงผู้หญิง (Female)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectGender('male')}
                  className={`py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    gender === 'male'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  เสียงผู้ชาย (Male)
                </button>
              </div>

              {/* Character Picker for Selected Region + Gender */}
              <div
                className={`grid gap-2 ${
                  availableCharacters.length > 1 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'
                }`}
              >
                {availableCharacters.map((char) => {
                  const active = activeCharacter.id === char.id;
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        stopPreviewAudio();
                        setPreviewPlayingId(null);
                        setSelectedVoice(char.id);
                      }}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                        active
                          ? 'bg-slate-800/90 border-amber-500/70 text-slate-100'
                          : 'bg-[#0B0F17]/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-medium text-xs sm:text-sm text-slate-100 truncate">
                        {char.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {char.roleLabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Pitch & Speed Sliders (5 cols) */}
            <div className="md:col-span-5 md:border-l md:border-slate-800/80 md:pl-5 space-y-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>ปรับโทนเสียงและความเร็ว</span>
                </span>
                {(userPitch !== 1.0 || userSpeed !== 1.0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserPitch(1.0);
                      setUserSpeed(1.0);
                      setSpeedPreset('normal');
                    }}
                    className="text-[11px] text-slate-400 hover:text-amber-400 cursor-pointer"
                  >
                    รีเซ็ต 1.00x
                  </button>
                )}
              </div>

              {/* Pitch Control */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    โทนเสียง (Pitch · {gender === 'male' ? 'ฐานเสียงชายทุ้ม' : 'ฐานเสียงหญิงใส'})
                  </span>
                  <span className="font-mono tabular-nums text-amber-400 font-medium">
                    {userPitch.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.75}
                  max={1.25}
                  step={0.01}
                  value={userPitch}
                  onChange={(e) => setUserPitch(parseFloat(e.target.value))}
                  aria-label="ปรับระดับโทนเสียง Pitch"
                  className="w-full studio-slider"
                />
              </div>

              {/* Speed Control */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">ความเร็ว (Speed)</span>
                  <div className="flex items-center gap-1.5">
                    {(['slow', 'normal', 'fast'] as SpeedPreset[]).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSpeedPreset(preset)}
                        className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap cursor-pointer transition-colors ${
                          speedPreset === preset
                            ? 'bg-amber-500/20 text-amber-300 font-medium'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {preset === 'slow' ? 'ช้า' : preset === 'normal' ? 'ปกติ' : 'เร็ว'}
                      </button>
                    ))}
                    <span className="font-mono tabular-nums text-amber-400 font-medium ml-1">
                      {userSpeed.toFixed(2)}x
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.5}
                  step={0.05}
                  value={userSpeed}
                  onChange={(e) => handleSpeedSliderChange(parseFloat(e.target.value))}
                  aria-label="ปรับความเร็วการพูด Speed"
                  className="w-full studio-slider"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: ช่องกรอกบทพากย์ขนาดใหญ่ (Large Script Editor) */}
        <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-sm font-semibold text-slate-200">
                3. บทพากย์เสียง
              </h2>
              <div className="flex items-center gap-1.5">
                {DIALECT_DEMO_PHRASES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => setScriptText(sample.central)}
                    className="px-2.5 py-1 rounded-md bg-[#0B0F17] border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {sample.category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none mr-1">
                <input
                  type="checkbox"
                  checked={autoTranslate}
                  onChange={(e) => setAutoTranslate(e.target.checked)}
                  className="accent-amber-500 rounded cursor-pointer"
                />
                <span>แปลงคำศัพท์ตามภาคอัตโนมัติ</span>
              </label>

              <button
                type="button"
                onClick={handleCopyScript}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="คัดลอกบทพากย์"
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="ล้างข้อความ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={6}
            placeholder="พิมพ์หรือวางบทพากย์ที่นี่ (พิมพ์ภาษากลางปกติได้เลย ระบบจะแปลงคำศัพท์และสำเนียงตามภาคและเพศที่เลือกให้อัตโนมัติ)..."
            className="w-full min-h-[180px] bg-[#0B0F17] border border-slate-800 focus:border-amber-500 rounded-xl p-4 text-base text-slate-100 placeholder:text-slate-600 focus:outline-none leading-relaxed resize-y"
          />

          {/* Live Regional Dialect Adaptation Preview */}
          {showDialectPreviewBar && (
            <div className="bg-[#0B0F17]/90 border border-slate-800/90 rounded-lg px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="text-amber-400 font-medium mr-1.5">
                  ตัวอย่างบทพูด {REGIONAL_METAS[region].nameThai}:
                </span>
                <span>{liveDialectPreview}</span>
              </div>
              <button
                type="button"
                onClick={() => setScriptText(liveDialectPreview)}
                className="text-xs text-slate-300 hover:text-amber-300 px-2.5 py-1 rounded border border-slate-700 hover:border-amber-500/50 whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
              >
                ใช้ข้อความนี้ในช่องหลัก
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 tabular-nums">
            <span>{charCount} ตัวอักษร</span>
            <span>ความยาวโดยประมาณ ~{estimatedSeconds} วินาที</span>
          </div>
        </section>

        {/* SECTION 4: ปุ่มกดสร้างเสียง (.WAV) ที่เด่นชัด + เครื่องเล่นดาวน์โหลด */}
        <section className="space-y-4">
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm rounded-xl px-4 py-3">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerateWav}
            disabled={isGenerating}
            className="w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.995] text-slate-950 font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                <span className="whitespace-nowrap">
                  กำลังสร้างเสียงพากย์ .WAV ({activeCharacter.name})...
                </span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 shrink-0" />
                <span className="truncate">
                  สร้างเสียงพากย์ (.WAV) · {activeCharacter.name} (
                  {REGIONAL_METAS[region].nameThai} · {gender === 'male' ? 'ชาย' : 'หญิง'})
                </span>
              </>
            )}
          </button>

          {/* Minimal .WAV Player & Instant Download Card */}
          {wavUrl && (
            <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-4">
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
                    onClick={togglePlayback}
                    className="w-11 h-11 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    aria-label={isPlaying ? 'หยุดเล่นชั่วคราว' : 'เล่นเสียงพากย์'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-200 truncate">
                        {activeCharacter.name} · {activeDialectLabel}
                        {isReRenderingWav ? ' · กำลังอัปเดตโทนเสียง...' : ''}
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
                      aria-label="แถบเวลาเล่นเสียง"
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

              {spokenScript && (
                <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                  <span className="text-slate-300 font-medium mr-1.5">บทที่พากย์จริง:</span>
                  <span>{spokenScript}</span>
                </div>
              )}
            </div>
          )}

          {/* Compact Recent Takes (only shown if more than 1 clip generated in session) */}
          {history.length > 1 && (
            <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-300">ไฟล์เสียงล่าสุดในรอบนี้</span>
                <button
                  type="button"
                  onClick={() => setHistory((prev) => prev.slice(0, 1))}
                  className="hover:text-slate-200 cursor-pointer"
                >
                  ล้างประวัติ
                </button>
              </div>
              <div className="divide-y divide-slate-800/70">
                {history.slice(1).map((clip) => (
                  <div
                    key={clip.id}
                    className="py-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        sourceAudioRef.current = null;
                        setWavUrl(clip.audioUrl);
                        setSpokenScript(clip.spokenText || clip.text);
                        setActiveDialectLabel(clip.dialectLabel || null);
                        setWavFileName(`voiceover_${clip.region || 'th'}_${clip.gender || 'voice'}.wav`);
                      }}
                      className="text-left min-w-0 flex-1 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-slate-200">{clip.title}</span>
                      <span className="text-slate-500 ml-2 truncate">
                        {clip.spokenText || clip.text}
                      </span>
                    </button>
                    <a
                      href={clip.audioUrl}
                      download={`voiceover_${clip.region || 'th'}_${clip.gender || 'voice'}.wav`}
                      className="text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap shrink-0 flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.WAV</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
