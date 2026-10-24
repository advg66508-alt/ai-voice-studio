import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { StudioHeroBanner } from './components/StudioHeroBanner';
import { VoiceDropdown } from './components/VoiceDropdown';
import { SpeedSelector } from './components/SpeedSelector';
import { StyleSelector } from './components/StyleSelector';
import { BackgroundMusicSelector } from './components/BackgroundMusicSelector';
import { AudioPlayer } from './components/AudioPlayer';
import { ScriptAssistantModal } from './components/ScriptAssistantModal';
import { MultiSpeakerStudio } from './components/MultiSpeakerStudio';
import { HistoryDrawer } from './components/HistoryDrawer';
import { VoiceName, SpeedPreset, GeneratedClip, DialogueLine, SampleScript, RegionType } from './types/voice';
import { VOICES, STYLE_PRESETS } from './data/presets';
import { CodeExportModal } from './components/CodeExportModal';
import { SampleScriptsSection } from './components/SampleScriptsSection';
import { DialectSelector } from './components/DialectSelector';
import {
  getDefaultScriptForRegionAndGender,
  isDefaultWelcomeScript,
} from './utils/dialectTranslator';
import { speakWithBrowserSpeech, createSyntheticSpeechBuffer } from './utils/speechSynthEngine';
import { stopPreviewAudio } from './utils/audioPreviewPlayer';
import {
  AmbientSoundType,
  AMBIENT_PRESETS,
  mixVoiceAndAmbient,
  cleanScriptForSpeech,
  applyVoiceCharacterShift,
  stitchAudioBuffersWithGap,
  audioBufferToWav,
} from './utils/audioMixer';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Copy,
  BookOpen,
  Users,
  Mic,
} from 'lucide-react';

export default function App() {
  // Regional Dialect selection (กลาง / เหนือ / อีสาน / ใต้)
  const [currentRegion, setCurrentRegion] = useState<RegionType>('central');
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState<boolean>(true);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Voice selection (Dropdown & Dialect cards)
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  // Speed options (ช้า / ปกติ / เร็ว) - default 'normal'
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>('normal');
  const [speedRate, setSpeedRate] = useState<number>(1.0);

  // Script Text (Default matches Kore female voice)
  const [text, setText] = useState<string>(
    'ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI คุณสามารถเลือกเสียงผู้ชายหรือเสียงผู้หญิง ปรับความเร็วช้า ปกติ หรือเร็ว แล้วดาวน์โหลดไฟล์เสียงนำไปใช้งานได้ทันทีค่ะ'
  );
  const [selectedStyleId, setSelectedStyleId] = useState<string>('commercial');
  const [customStyleText, setCustomStyleText] = useState<string>('');

  // Multi-Speaker Mode
  const [isMultiSpeaker, setIsMultiSpeaker] = useState<boolean>(false);
  const [dialogues, setDialogues] = useState<DialogueLine[]>([
    {
      id: 'dlg-1',
      speaker: 'ผู้บรรยายชาย',
      voiceName: 'Puck',
      text: 'สวัสดีครับทุกคน วันนี้เรามีข่าวดีมาบอก!',
      style: 'น้ำเสียงสดใส ตื่นเต้น',
    },
    {
      id: 'dlg-2',
      speaker: 'ผู้บรรยายหญิง',
      voiceName: 'Kore',
      text: 'ใช่แล้วค่ะ สตูดิโอพากย์เสียง AI พร้อมให้ทุกคนสร้างเสียงพากย์คุณภาพระดับสตูดิโอแล้ววันนี้!',
      style: 'น้ำเสียงอบอุ่น เป็นมิตร',
    },
  ]);

  // Audio State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);
  const [currentClipTitle, setCurrentClipTitle] = useState<string>('เสียงพากย์ AI');
  const [currentSpokenText, setCurrentSpokenText] = useState<string | null>(null);
  const [currentDialectLabel, setCurrentDialectLabel] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<number>(0);
  const [history, setHistory] = useState<GeneratedClip[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Background Music / Ambient Sound & SFX
  const [selectedAmbient, setSelectedAmbient] = useState<AmbientSoundType>('cafe');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.18);
  const [mixIntoDownload, setMixIntoDownload] = useState<boolean>(true);
  const rawSpeechBufferRef = useRef<AudioBuffer | null>(null);
  const lastRawScriptWithSFXRef = useRef<string>('');
  const [isMixingAudio, setIsMixingAudio] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const playerSectionRef = useRef<HTMLDivElement | null>(null);

  // Unified Voice Selection Handler:
  // Keeps selectedVoice, currentRegion, style gender compatibility, and default welcome script 100% synchronized!
  const handleSelectVoiceUnified = (newVoice: VoiceName) => {
    setSelectedVoice(newVoice);
    const vObj = VOICES.find((v) => v.id === newVoice);
    if (!vObj) return;

    const targetRegion: RegionType = vObj.region || 'central';
    if (targetRegion !== currentRegion) {
      setCurrentRegion(targetRegion);
    }

    // Harmonize style preset if switching to a male voice while a female-only style was active
    if (vObj.gender === 'male') {
      const activeStyle = STYLE_PRESETS.find((s) => s.id === selectedStyleId);
      if (activeStyle?.category === 'female') {
        setSelectedStyleId('commercial');
      }
    }

    // Update default welcome script if user hasn't typed custom text yet
    if (isDefaultWelcomeScript(text)) {
      const updatedDefault = getDefaultScriptForRegionAndGender(targetRegion, vObj.gender);
      setText(updatedDefault);
    }
  };

  // Re-mix audio helper (bakes pitch-preserving speedRate + ambient BGM + SFX into the downloadable WAV!)
  const reMixAudio = async (
    speechBuf: AudioBuffer,
    ambientType: AmbientSoundType,
    vol: number,
    targetSpeedRate: number,
    scriptForSFX: string
  ) => {
    setIsMixingAudio(true);
    try {
      const { audioUrl } = await mixVoiceAndAmbient(
        speechBuf,
        ambientType,
        vol,
        speechBuf.sampleRate,
        scriptForSFX,
        targetSpeedRate
      );
      setCurrentAudioUrl(audioUrl);
    } catch (err) {
      console.error('Re-mixing error:', err);
    } finally {
      setIsMixingAudio(false);
    }
  };

  const handleAmbientChange = (newType: AmbientSoundType) => {
    setSelectedAmbient(newType);
  };

  const handleAmbientVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
  };

  const handleMixToggle = (shouldMix: boolean) => {
    setMixIntoDownload(shouldMix);
  };

  // Automatically re-render the downloadable/playable WAV whenever speedRate or ambient settings change!
  useEffect(() => {
    if (!rawSpeechBufferRef.current) return;
    const timer = setTimeout(() => {
      if (rawSpeechBufferRef.current) {
        reMixAudio(
          rawSpeechBufferRef.current,
          mixIntoDownload ? selectedAmbient : 'none',
          mixIntoDownload ? ambientVolume : 0,
          speedRate,
          lastRawScriptWithSFXRef.current
        );
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [speedRate, selectedAmbient, ambientVolume, mixIntoDownload]);

  // Script Assistant & Code Export Modals
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);

  // Voice details helper
  const currentVoiceObj = VOICES.find((v) => v.id === selectedVoice) || VOICES[0];
  const genderLabel =
    currentVoiceObj.gender === 'female'
      ? 'เสียงผู้หญิง'
      : currentVoiceObj.gender === 'male'
      ? 'เสียงผู้ชาย'
      : 'เสียงเป็นกลาง';

  // Estimate speaking time in seconds based on text length & speed
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const estimatedSeconds = Math.max(
    2,
    Math.round(charCount / 14 / speedRate)
  );

  // Handle Speed Preset Change
  const handleSpeedPresetChange = (preset: SpeedPreset, rate: number) => {
    setSpeedPreset(preset);
    setSpeedRate(rate);
  };

  // Generate Audio via Server API with automatic regional dialect adaptation and exact WAV rendering
  const handleGenerateVoiceover = async () => {
    if (!text.trim() && (!isMultiSpeaker || dialogues.length === 0)) {
      setErrorMessage('กรุณาใส่ข้อความสำหรับพากย์เสียง');
      return;
    }

    stopPreviewAudio();
    setErrorMessage(null);
    setQuotaNotice(null);
    setIsGenerating(true);

    const stylePreset = STYLE_PRESETS.find((s) => s.id === selectedStyleId);
    const stylePrompt =
      customStyleText.trim() ||
      stylePreset?.promptInstruction ||
      'Clear, natural, high-quality Thai voiceover';

    const rawInputScript = text.trim();

    try {
      const cleanedText = cleanScriptForSpeech(rawInputScript);

      const payload = {
        text: cleanedText || rawInputScript,
        voiceName: selectedVoice,
        speed: speedPreset,
        speedRate: speedRate,
        style: stylePrompt,
        autoTranslate: autoTranslateEnabled,
        isMultiSpeaker,
        speakers: isMultiSpeaker
          ? dialogues.map((d) => ({
              speaker: d.speaker,
              voiceName: d.voiceName,
              text: cleanScriptForSpeech(d.text),
              style: d.style,
            }))
          : undefined,
      };

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.quotaExceeded || response.status === 429) {
        setErrorMessage(
          data.error ||
            data.message ||
            'ระบบจำกัดความถี่ชั่วคราว กรุณารอประมาณ 15-20 วินาทีแล้วกดสร้างเสียงพากย์ใหม่อีกครั้งครับ'
        );
        setIsGenerating(false);
        return;
      }

      if (!response.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการสร้างเสียงพากย์ กรุณาลองใหม่อีกครั้ง');
        setIsGenerating(false);
        return;
      }

      if (data.audioBase64 || (Array.isArray(data.multiSpeakerSegments) && data.multiSpeakerSegments.length > 0)) {
        const responseMime = data.mimeType || 'audio/wav';
        let finalAudioUrl = '';
        let finalWavBase64: string | null = data.audioBase64 || null;

        // Decode audio buffer, apply persona pitch/cadence if needed, apply WSOLA speedRate, and mix ambient BGM + SFX into WAV
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx: AudioContext = new AudioContextClass();
        try {
          let speechBuffer: AudioBuffer;

          if (Array.isArray(data.multiSpeakerSegments) && data.multiSpeakerSegments.length > 0) {
            const decodedSegments: AudioBuffer[] = [];
            for (const seg of data.multiSpeakerSegments) {
              const segBlob = b64toBlob(seg.audioBase64, seg.mimeType || 'audio/mpeg');
              const segArr = await segBlob.arrayBuffer();
              const rawSegBuf = await audioCtx.decodeAudioData(segArr);
              const voicedSegBuf = applyVoiceCharacterShift(
                rawSegBuf,
                typeof seg.voicePitchFactor === 'number' ? seg.voicePitchFactor : 1.0,
                typeof seg.voiceCadenceFactor === 'number' ? seg.voiceCadenceFactor : 1.0
              );
              decodedSegments.push(voicedSegBuf);
            }
            speechBuffer = stitchAudioBuffersWithGap(decodedSegments, 0.26);
          } else {
            const audioBlob = b64toBlob(data.audioBase64, responseMime);
            finalAudioUrl = URL.createObjectURL(audioBlob);
            const arrayBuffer = await audioBlob.arrayBuffer();
            const decodedRaw = await audioCtx.decodeAudioData(arrayBuffer);
            const pitchFactor =
              typeof data.voicePitchFactor === 'number' ? data.voicePitchFactor : 1.0;
            const cadenceFactor =
              typeof data.voiceCadenceFactor === 'number' ? data.voiceCadenceFactor : 1.0;
            speechBuffer = applyVoiceCharacterShift(decodedRaw, pitchFactor, cadenceFactor);
          }

          rawSpeechBufferRef.current = speechBuffer;
          lastRawScriptWithSFXRef.current = isMultiSpeaker
            ? dialogues.map((d) => d.text).join(' ')
            : rawInputScript;

          const effectiveAmbient = mixIntoDownload ? selectedAmbient : 'none';
          const effectiveVol = mixIntoDownload ? ambientVolume : 0;

          const { audioUrl: renderedUrl, wavBlob } = await mixVoiceAndAmbient(
            speechBuffer,
            effectiveAmbient,
            effectiveVol,
            speechBuffer.sampleRate,
            lastRawScriptWithSFXRef.current,
            speedRate
          );
          finalAudioUrl = renderedUrl;

          // If source was MP3 or multi-segment, also store clean WAV base64 for waveform/history consistency
          if (responseMime !== 'audio/wav' || !finalWavBase64) {
            const wavArr = new Uint8Array(await wavBlob.arrayBuffer());
            let bin = '';
            const chunk = 8192;
            for (let i = 0; i < wavArr.length; i += chunk) {
              bin += String.fromCharCode(...wavArr.subarray(i, i + chunk));
            }
            finalWavBase64 = btoa(bin);
          }
        } catch (mixErr) {
          console.warn('Audio mixing fallback to pure studio audio:', mixErr);
          if (!finalAudioUrl && rawSpeechBufferRef.current) {
            finalAudioUrl = URL.createObjectURL(audioBufferToWav(rawSpeechBufferRef.current));
          }
        } finally {
          audioCtx.close().catch(() => {});
        }

        const spokenResultText: string = data.spokenText || cleanedText;
        const dialectResultLabel: string =
          data.dialectLabel || currentVoiceObj.dialectBadge || 'ภาษากลาง';

        setCurrentAudioUrl(finalAudioUrl);
        setCurrentAudioBase64(finalWavBase64);
        setCurrentSpokenText(spokenResultText);
        setCurrentDialectLabel(dialectResultLabel);
        setGenerationId((prev) => prev + 1);

        const ambientLabelStr =
          mixIntoDownload && selectedAmbient !== 'none'
            ? ` + ${AMBIENT_PRESETS.find((p) => p.id === selectedAmbient)?.title}`
            : '';
        const regionTag = currentVoiceObj.dialectBadge ? ` [${currentVoiceObj.dialectBadge}]` : '';
        const speedThai =
          speedPreset === 'slow' ? 'ช้า' : speedPreset === 'normal' ? 'ปกติ' : 'เร็ว';
        const newTitle = `พากย์เสียง_${currentVoiceObj.thaiName || currentVoiceObj.name}${regionTag}_${speedThai}${ambientLabelStr}`;
        setCurrentClipTitle(newTitle);

        // Add to history
        const newClip: GeneratedClip = {
          id: `clip-${Date.now()}`,
          title: newTitle,
          text: spokenResultText.slice(0, 140),
          spokenText: spokenResultText,
          dialectLabel: dialectResultLabel,
          voiceName: selectedVoice,
          speed: speedPreset,
          speedRate: speedRate,
          style: stylePreset?.title || 'พากย์ทั่วไป',
          audioUrl: finalAudioUrl,
          audioBase64: finalWavBase64 || undefined,
          createdAt: Date.now(),
          modelUsed: data.modelUsed,
        };
        setHistory((prev) => [newClip, ...prev]);

        // Smooth scroll to player on mobile/smaller screens so user sees playback & download immediately
        if (window.innerWidth < 1024 && playerSectionRef.current) {
          playerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } catch (err: any) {
      console.error('TTS Generation Exception:', err);
      setErrorMessage(
        err?.message ||
          'ไม่สามารถเชื่อมต่อระบบสร้างเสียงพากย์ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert base64 to Blob helper
  const b64toBlob = (b64Data: string, contentType = 'audio/wav', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  // Apply Sample Script
  const handleApplySample = (sample: SampleScript) => {
    setText(sample.text);
    setSelectedVoice(sample.recommendedVoice);
    setSelectedStyleId(sample.recommendedStyle);
    handleSpeedPresetChange(
      sample.recommendedSpeed,
      sample.recommendedSpeed === 'slow' ? 0.75 : sample.recommendedSpeed === 'fast' ? 1.35 : 1.0
    );

    const vObj = VOICES.find((v) => v.id === sample.recommendedVoice);
    if (vObj?.region) {
      setCurrentRegion(vObj.region);
    }

    if (sample.recommendedAmbient) {
      setSelectedAmbient(sample.recommendedAmbient);
      setMixIntoDownload(sample.recommendedAmbient !== 'none');
    }

    if (sample.isMultiSpeaker && sample.sampleDialogues && sample.sampleDialogues.length > 0) {
      setIsMultiSpeaker(true);
      setDialogues(sample.sampleDialogues);
    } else {
      setIsMultiSpeaker(false);
    }

    if (textareaRef.current) {
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      textareaRef.current.focus();
    }
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        hasAudio={!!currentAudioUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Studio Hero Banner */}
        <StudioHeroBanner onOpenAssistant={() => setIsAssistantOpen(true)} />

        {/* Quick Start Guide */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="font-bold text-slate-100 text-sm sm:text-base">
                คู่มือวิธีใช้งานสตูดิโอพากย์เสียง AI (ใช้งานง่ายใน 4 ขั้นตอน)
              </h2>
            </div>
            <span className="text-[11px] text-amber-400/90 font-mono">
              💡 เสียงที่เล่นและไฟล์ .WAV ที่ดาวน์โหลดตรงตามสำเนียงและสไตล์ที่เลือก 100%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">1</span>
                <span>เลือกภาษาถิ่น & เสียง</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                เลือกภาค (กลาง, เหนือ, อีสาน, ใต้ เช่น สาวนุ้ย แหลงใต้) ทั้งชายและหญิง
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">2</span>
                <span>พิมพ์หรือวางข้อความ</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                พิมพ์ภาษากลางปกติได้เลย ระบบ AI แปลงเป็นสำเนียงและคำศัพท์ภาคนั้นให้อัตโนมัติ
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">3</span>
                <span>ปรับความเร็ว & อารมณ์</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                เลือกความเร็ว ช้า (0.75x), ปกติ (1.0x), เร็ว (1.35x) และเลือกโทนอารมณ์
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">4</span>
                <span>สร้างเสียง & ดาวน์โหลด</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                กดปุ่ม &quot;สร้างเสียงพากย์ AI&quot; ฟังเสียงจริง และกดดาวน์โหลดไฟล์ .WAV ทันที
              </p>
            </div>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Script Editor & Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Regional Dialect & Accent Studio */}
            <DialectSelector
              currentRegion={currentRegion}
              onSelectRegion={setCurrentRegion}
              selectedVoice={selectedVoice}
              onSelectVoice={handleSelectVoiceUnified}
              currentScriptText={text}
              onApplyTranslatedScript={(translatedText) => setText(translatedText)}
              autoTranslateEnabled={autoTranslateEnabled}
              onToggleAutoTranslate={setAutoTranslateEnabled}
            />

            {/* 1.2 Voice Dropdown */}
            <VoiceDropdown
              selectedVoice={selectedVoice}
              onVoiceChange={handleSelectVoiceUnified}
            />

            {/* 2. Text Script Editor */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative z-10 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Mic className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      ขั้นตอนที่ 2 • ข้อความบทพากย์ (Voiceover Script)
                      {currentVoiceObj.dialectBadge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                          กำลังใช้เสียง: {currentVoiceObj.thaiName} ({currentVoiceObj.dialectBadge})
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      พิมพ์ภาษากลางหรือภาษาถิ่นก็ได้ เมื่อเลือกเสียงภาคเหนือ/อีสาน/ใต้ ระบบจะแปลงและพากย์สำเนียงภาคนั้นให้จริง 100%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    title="คัดลอกข้อความ"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedNotification ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setText('')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors text-xs cursor-pointer"
                    title="ล้างข้อความทั้งหมด"
                  >
                    ล้างข้อความ
                  </button>
                </div>
              </div>

              {/* คำอธิบายวิธีใช้งานกล่องข้อความ */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
                <span className="text-base shrink-0">💡</span>
                <div className="space-y-0.5 text-[11px] leading-relaxed">
                  <strong className="text-amber-300 font-semibold block">ระบบแปลงสำเนียงภาษาถิ่นอัจฉริยะ (AI Native Dialect):</strong>
                  <span>
                    หากคุณเลือกเสียง <strong>สาวนุ้ย (แหลงใต้)</strong>, <strong>น้องบัวตอง (คำเมือง)</strong> หรือ <strong>น้องคำแพง (เว้าอีสาน)</strong> แม้พิมพ์ข้อความภาษากลางธรรมดา ระบบจะถอดความคำศัพท์ คำสร้อย และวรรณยุกต์เป็นภาษาถิ่นแท้ๆ ก่อนพากย์ลงไฟล์ .WAV ให้โดยอัตโนมัติ!
                  </span>
                </div>
              </div>

              {/* Quick Sample Text Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-400">⚡ ใส่ข้อความด่วน:</span>
                <button
                  type="button"
                  onClick={() =>
                    setText(
                      'เริ่มต้นวันใหม่ด้วยกาแฟสดหอมกรุ่น คัดสรรเมล็ดพันธุ์ชั้นดี รสชาติกลมกล่อม อร่อยมาก อยากให้ทุกคนได้ลองชิมนะคะ'
                    )
                  }
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                >
                  ☕ กาแฟสด
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setText(
                      'โปรโมชั่นพิเศษวันนี้ ลดทันทีสูงสุด 70% ช้อปด่วน สินค้ามีจำนวนจำกัด พลาดรอบนี้รออีกทีปีหน้าเลยนะ'
                    )
                  }
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                >
                  🛍️ โปรโมชั่น
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setText(
                      'สวัสดีค่ะ วันนี้มีแกงส้มกุ้งสดรสเด็ด อร่อยมากจริงๆ ราคาไม่แพง รีบสั่งไปชิมกันเลยนะคะ'
                    )
                  }
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                >
                  🍲 รีวิวอาหารเด็ด
                </button>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="พิมพ์ข้อความที่ต้องการพากย์ที่นี่ เช่น: วันนี้อาหารอร่อยมาก อยากชวนทุกคนมาลองชิมกันนะคะ..."
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed resize-y font-normal"
                />

                {/* Character count & speaking time indicator */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
                  <div className="flex items-center gap-3">
                    <span>
                      จำนวนอักษร: <strong className="text-slate-300 font-mono">{charCount}</strong> ตัว
                    </span>
                    <span>
                      คำ: <strong className="text-slate-300 font-mono">{wordCount}</strong> คำ
                    </span>
                  </div>
                  <span className="text-amber-400/90 font-mono">
                    ⏱️ เวลาพูดโดยประมาณ: ~{estimatedSeconds} วินาที
                  </span>
                </div>
              </div>

              {/* Multi-Speaker Toggle */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsMultiSpeaker(!isMultiSpeaker)}
                  className={`text-xs flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    isMultiSpeaker
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 font-bold'
                      : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {isMultiSpeaker
                      ? '✓ โหมด 2 ตัวละครชายหญิง (เปิดใช้งาน)'
                      : 'เปิดโหมดพากย์ 2 ตัวละครสนทนากัน'}
                  </span>
                </button>

                <div className="text-[11px] text-slate-500">
                  รองรับพากย์ข้ามสำเนียง 4 ภาค
                </div>
              </div>

              {/* Multi-Speaker dialogue area if enabled */}
              {isMultiSpeaker && (
                <div className="pt-2">
                  <MultiSpeakerStudio
                    dialogues={dialogues}
                    onDialoguesChange={setDialogues}
                  />
                </div>
              )}
            </div>

            {/* 3. Speed Selector */}
            <SpeedSelector
              speed={speedPreset}
              onSpeedChange={handleSpeedPresetChange}
              speedRate={speedRate}
              onSpeedRateChange={setSpeedRate}
            />

            {/* 3.2 Style Selector */}
            <StyleSelector
              selectedStyleId={selectedStyleId}
              onStyleChange={setSelectedStyleId}
              customStyleText={customStyleText}
              onCustomStyleChange={setCustomStyleText}
              currentVoice={selectedVoice}
              onSelectVoice={handleSelectVoiceUnified}
            />

            {/* 4. Background Music & Ambient Selector */}
            <BackgroundMusicSelector
              selectedAmbient={selectedAmbient}
              onAmbientChange={handleAmbientChange}
              ambientVolume={ambientVolume}
              onVolumeChange={handleAmbientVolumeChange}
              mixIntoDownload={mixIntoDownload}
              onMixIntoDownloadChange={handleMixToggle}
            />

            {/* Main Action Box with Generate Button */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="text-amber-400">🎙️</span>
                  <span>
                    พร้อมสร้างเสียง: <strong className="text-amber-300">{currentVoiceObj.name}</strong>
                    {currentVoiceObj.dialectBadge ? ` (${currentVoiceObj.dialectBadge})` : ''}
                  </span>
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">
                  ⚡ ความเร็ว {speedRate.toFixed(2)}x • คุณภาพ 24kHz WAV
                </span>
              </div>

              {quotaNotice && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 shadow-sm">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                  <div className="space-y-0.5 flex-1">
                    <div className="font-semibold text-amber-300 flex items-center justify-between">
                      <span>แจ้งเตือนสถานะ</span>
                      <button
                        type="button"
                        onClick={() => setQuotaNotice(null)}
                        className="text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer"
                      >
                        ✕ ปิด
                      </button>
                    </div>
                    <div className="text-amber-200/90 leading-relaxed text-[11px]">{quotaNotice}</div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* MAIN GENERATE BUTTON */}
              <button
                type="button"
                onClick={handleGenerateVoiceover}
                disabled={isGenerating}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>
                      กำลังถอดสำเนียงและสร้างเสียงพากย์ ({currentVoiceObj.thaiName || currentVoiceObj.name})...
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-current" />
                    <span>
                      สร้างเสียงพากย์ AI ({currentVoiceObj.thaiName || currentVoiceObj.name} •{' '}
                      {speedPreset === 'slow' ? 'ช้า' : speedPreset === 'normal' ? 'ปกติ' : 'เร็ว'})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Audio Output Player & Tools (5 Cols) */}
          <div className="lg:col-span-5 space-y-5" ref={playerSectionRef}>
            {/* 1. Audio Player with Waveform & Download Button */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>เครื่องเล่นและดาวน์โหลดเสียงพากย์</span>
                </h3>
                {currentAudioUrl && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    พร้อมฟังและดาวน์โหลด
                  </span>
                )}
              </div>

              <AudioPlayer
                audioUrl={currentAudioUrl}
                audioBase64={currentAudioBase64}
                title={currentClipTitle}
                voiceName={currentVoiceObj.name}
                spokenText={currentSpokenText}
                dialectLabel={currentDialectLabel}
                isMixing={isMixingAudio}
                generationId={generationId}
                speedRate={speedRate}
                onSpeedRateChange={setSpeedRate}
                speedPreset={speedPreset}
                onSpeedPresetChange={handleSpeedPresetChange}
                genderLabel={genderLabel}
                ambientLabel={
                  mixIntoDownload && selectedAmbient !== 'none'
                    ? AMBIENT_PRESETS.find((p) => p.id === selectedAmbient)?.title
                    : undefined
                }
              />
            </div>

            {/* 2. Sample Scripts Ready in 1-Click */}
            <SampleScriptsSection onApplySample={handleApplySample} />

            {/* 3. Quick Feature Highlights */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>จุดเด่นของระบบสตูดิโอเสียง AI:</span>
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-slate-400 leading-relaxed text-[11px]">
                <li>
                  รองรับ <strong className="text-amber-300">สำเนียงภาษาถิ่นแท้ 4 ภาค</strong>: ปักษ์ใต้ (แหลงใต้), เหนือ (คำเมือง), อีสาน, กลาง พร้อม AI ถอดสำเนียงอัตโนมัติ
                </li>
                <li>
                  เลือกได้ทั้ง <strong className="text-slate-200">เสียงผู้หญิง</strong> และ <strong className="text-slate-200">เสียงผู้ชาย</strong> แยกเนื้อเสียงชัดเจนทุกคาแรคเตอร์
                </li>
                <li>
                  ไฟล์เสียง <strong className="text-slate-200">.WAV คุณภาพสตูดิโอ</strong> ตรงกับเสียงที่กดฟัง 100% ทั้งสำเนียง ความเร็ว และดนตรีประกอบ
                </li>
                <li>
                  ปรับความเร็วแบบคงโทนเสียงธรรมชาติ (Pitch-Preserving WSOLA): <strong>ช้า (0.75x)</strong>, <strong>ปกติ (1.0x)</strong>, <strong>เร็ว (1.35x)</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section: History of Generated Clips */}
        <HistoryDrawer
          history={history}
          onSelectClip={(clip) => {
            rawSpeechBufferRef.current = null;
            setCurrentAudioUrl(clip.audioUrl);
            setCurrentAudioBase64(clip.audioBase64 || null);
            setCurrentClipTitle(clip.title);
            setCurrentSpokenText(clip.spokenText || clip.text);
            setCurrentDialectLabel(clip.dialectLabel || null);
            setSelectedVoice(clip.voiceName);
            const vObj = VOICES.find((v) => v.id === clip.voiceName);
            if (vObj?.region) setCurrentRegion(vObj.region);
            handleSpeedPresetChange(clip.speed, clip.speedRate);
          }}
          onClearHistory={() => setHistory([])}
        />
      </main>

      {/* Script Assistant Modal */}
      <ScriptAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onApplyScript={(scriptText, suggestedTitle) => {
          setText(scriptText);
          setCurrentClipTitle(suggestedTitle);
        }}
      />

      {/* Code Export Modal */}
      <CodeExportModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>AI Voiceover Studio • ระบบสร้างเสียงพากย์ภาษาไทย 4 ภาคด้วย AI • พากย์เสียงผู้ชาย เสียงผู้หญิง ปรับความเร็ว ดาวน์โหลด .wav</p>
      </footer>
    </div>
  );
}
