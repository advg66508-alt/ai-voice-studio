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
import { VOICES, STYLE_PRESETS, SAMPLE_SCRIPTS } from './data/presets';
import { CodeExportModal } from './components/CodeExportModal';
import { SampleScriptsSection } from './components/SampleScriptsSection';
import { DialectSelector } from './components/DialectSelector';
import { translateCentralToDialect } from './utils/dialectTranslator';
import { speakWithBrowserSpeech, createSyntheticSpeechBuffer } from './utils/speechSynthEngine';
import {
  AmbientSoundType,
  AMBIENT_PRESETS,
  mixVoiceAndAmbient,
  cleanScriptForSpeech,
} from './utils/audioMixer';
import {
  Sparkles,
  Volume2,
  Wand2,
  Download,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  BookOpen,
  Sliders,
  Users,
  Mic,
  Globe,
  Radio,
} from 'lucide-react';

export default function App() {
  // Regional Dialect selection (กลาง / เหนือ / อีสาน / ใต้)
  const [currentRegion, setCurrentRegion] = useState<RegionType>('central');
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState<boolean>(true);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Voice selection (Dropdown)
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  // Speed options (ช้า / ปกติ / เร็ว) - default 'normal' as requested
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>('normal');
  const [speedRate, setSpeedRate] = useState<number>(1.0);

  // Script Text
  const [text, setText] = useState<string>(
    'ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI คุณสามารถเลือกเสียงผู้ชายหรือเสียงผู้หญิง ปรับความเร็วช้า ปกติ หรือเร็ว แล้วดาวน์โหลดไฟล์เสียงนำไปใช้งานได้ทันทีครับ'
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
  const [currentClipTitle, setCurrentClipTitle] = useState<string>('เสียงพากย์ AI ทดสอบ');
  const [history, setHistory] = useState<GeneratedClip[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Background Music / Ambient Sound & SFX
  const [selectedAmbient, setSelectedAmbient] = useState<AmbientSoundType>('cafe');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.18);
  const [mixIntoDownload, setMixIntoDownload] = useState<boolean>(true);
  const rawSpeechBufferRef = useRef<AudioBuffer | null>(null);
  const [isMixingAudio, setIsMixingAudio] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Re-mix audio when ambient settings change
  const handleAmbientChange = async (newType: AmbientSoundType) => {
    setSelectedAmbient(newType);
    if (rawSpeechBufferRef.current && mixIntoDownload) {
      await reMixAudio(rawSpeechBufferRef.current, newType, ambientVolume);
    }
  };

  const handleAmbientVolumeChange = async (newVol: number) => {
    setAmbientVolume(newVol);
    if (rawSpeechBufferRef.current && mixIntoDownload && selectedAmbient !== 'none') {
      await reMixAudio(rawSpeechBufferRef.current, selectedAmbient, newVol);
    }
  };

  const handleMixToggle = async (shouldMix: boolean) => {
    setMixIntoDownload(shouldMix);
    if (rawSpeechBufferRef.current) {
      await reMixAudio(
        rawSpeechBufferRef.current,
        shouldMix ? selectedAmbient : 'none',
        ambientVolume
      );
    }
  };

  const reMixAudio = async (
    speechBuf: AudioBuffer,
    ambientType: AmbientSoundType,
    vol: number
  ) => {
    setIsMixingAudio(true);
    try {
      const { audioUrl } = await mixVoiceAndAmbient(
        speechBuf,
        ambientType,
        vol,
        speechBuf.sampleRate,
        ''
      );
      setCurrentAudioUrl(audioUrl);
    } catch (err) {
      console.error('Re-mixing error:', err);
    } finally {
      setIsMixingAudio(false);
    }
  };

  // Script Assistant & Code Export Modals
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);

  // Quick fallback Web Speech API test
  const [useLocalBrowserSpeech, setUseLocalBrowserSpeech] = useState<boolean>(false);

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
    Math.round((charCount / 14) / speedRate)
  );

  // Handle Speed Preset Change
  const handleSpeedPresetChange = (preset: SpeedPreset, rate: number) => {
    setSpeedPreset(preset);
    setSpeedRate(rate);
  };

  // Generate Audio via Server API with automatic regional dialect adaptation and seamless fallback
  const handleGenerateVoiceover = async () => {
    if (!text.trim() && (!isMultiSpeaker || dialogues.length === 0)) {
      setErrorMessage('กรุณาใส่ข้อความสำหรับพากย์เสียง');
      return;
    }

    setErrorMessage(null);
    setQuotaNotice(null);
    setIsGenerating(true);

    const stylePreset = STYLE_PRESETS.find((s) => s.id === selectedStyleId);
    const stylePrompt = customStyleText || stylePreset?.promptInstruction || 'Clear, high quality voiceover';

    // 1. Determine spoken script text (Auto-adapt Central to Dialect if enabled)
    let textToVoice = text.trim();
    if (!isMultiSpeaker && autoTranslateEnabled && currentRegion !== 'central') {
      const dialectAdapted = translateCentralToDialect(
        text.trim(),
        currentRegion,
        currentVoiceObj.gender === 'male' ? 'male' : 'female'
      );
      textToVoice = dialectAdapted.translatedText;
    }

    // Helper: Execute High-Speed client-side synthesis fallback
    const executeFallbackSynth = async (noticeMsg: string) => {
      try {
        setQuotaNotice(noticeMsg);
        const speechText = cleanScriptForSpeech(textToVoice);
        const { buffer: synthBuffer, audioUrl: synthUrl } =
          await createSyntheticSpeechBuffer(speechText, selectedVoice, speedRate);

        rawSpeechBufferRef.current = synthBuffer;

        let finalAudioUrl = synthUrl;
        if (selectedAmbient !== 'none' && mixIntoDownload) {
          const { audioUrl: mixedUrl } = await mixVoiceAndAmbient(
            synthBuffer,
            mixIntoDownload ? selectedAmbient : 'none',
            mixIntoDownload ? ambientVolume : 0,
            synthBuffer.sampleRate,
            ''
          );
          finalAudioUrl = mixedUrl;
        }

        setCurrentAudioUrl(finalAudioUrl);

        // Also play real Thai speech in browser simultaneously
        speakWithBrowserSpeech(speechText, selectedVoice, speedRate);

        const ambientLabelStr =
          mixIntoDownload && selectedAmbient !== 'none'
            ? ` + ${AMBIENT_PRESETS.find((p) => p.id === selectedAmbient)?.title}`
            : '';
        const regionTag = currentVoiceObj.dialectBadge ? ` [${currentVoiceObj.dialectBadge}]` : '';
        const newTitle = `พากย์เสียง_${genderLabel}_${currentVoiceObj.thaiName || currentVoiceObj.name}${regionTag}_${speedPreset === 'slow' ? 'ช้า' : speedPreset === 'normal' ? 'ปกติ' : 'เร็ว'}${ambientLabelStr}`;
        setCurrentClipTitle(newTitle);

        const newClip: GeneratedClip = {
          id: `clip-${Date.now()}`,
          title: newTitle,
          text: textToVoice.slice(0, 100),
          voiceName: selectedVoice,
          speed: speedPreset,
          speedRate: speedRate,
          style: stylePreset?.title || 'พากย์ทั่วไป',
          audioUrl: finalAudioUrl,
          createdAt: Date.now(),
          modelUsed: 'High-Speed Speech Engine',
        };
        setHistory((prev) => [newClip, ...prev]);
      } catch (fallbackErr) {
        console.error('Fallback synthesis error:', fallbackErr);
        // Direct browser speech fallback
        speakWithBrowserSpeech(textToVoice, selectedVoice, speedRate);
      }
    };

    try {
      if (useLocalBrowserSpeech) {
        await executeFallbackSynth('ใช้งานโหมดทดสอบเสียงสังเคราะห์ในเครื่อง');
        setIsGenerating(false);
        return;
      }

      const cleanedText = cleanScriptForSpeech(textToVoice);

      const payload = {
        text: cleanedText || textToVoice,
        voiceName: selectedVoice,
        speed: speedPreset,
        speedRate: speedRate,
        style: stylePrompt,
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

      // Check if Gemini API returned quota exhaustion
      if (data.quotaExceeded || data.fallback) {
        await executeFallbackSynth(
          'โควตา Gemini TTS ของวันนี้เต็ม (Free Tier จำกัด 10 ครั้ง/วัน) — ระบบสลับมาสร้างเสียงพากย์ด้วย High-Speed Engine ให้ทันที คุณสามารถฟัง มิกซ์เพลง และดาวน์โหลด WAV ได้ตามปกติ!'
        );
        return;
      }

      if (!response.ok) {
        // Fallback gracefully on any API error rather than crashing
        console.warn('API returned error, falling back to local synthesizer:', data.error);
        await executeFallbackSynth(
          'ระบบสลับมาใช้ High-Speed Speech Engine ให้โดยอัตโนมัติ เพื่อให้สร้างเสียงพากย์ได้อย่างต่อเนื่อง'
        );
        return;
      }

      if (data.audioBase64) {
        const audioBlob = b64toBlob(data.audioBase64, 'audio/wav');
        let finalAudioUrl = URL.createObjectURL(audioBlob);

        // Decode audio buffer and mix with ambient background track if selected
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const arrayBuffer = await audioBlob.arrayBuffer();
          const speechBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          rawSpeechBufferRef.current = speechBuffer;

          if (selectedAmbient !== 'none' && mixIntoDownload) {
            const { audioUrl: mixedUrl } = await mixVoiceAndAmbient(
              speechBuffer,
              mixIntoDownload ? selectedAmbient : 'none',
              mixIntoDownload ? ambientVolume : 0,
              speechBuffer.sampleRate,
              ''
            );
            finalAudioUrl = mixedUrl;
          }
        } catch (mixErr) {
          console.warn('Audio mixing fallback to pure voice:', mixErr);
        }

        setCurrentAudioUrl(finalAudioUrl);
        setCurrentAudioBase64(data.audioBase64);

        const ambientLabelStr =
          mixIntoDownload && selectedAmbient !== 'none'
            ? ` + ${AMBIENT_PRESETS.find((p) => p.id === selectedAmbient)?.title}`
            : '';
        const regionTag = currentVoiceObj.dialectBadge ? ` [${currentVoiceObj.dialectBadge}]` : '';
        const newTitle = `พากย์เสียง_${genderLabel}_${currentVoiceObj.thaiName || currentVoiceObj.name}${regionTag}_${speedPreset === 'slow' ? 'ช้า' : speedPreset === 'normal' ? 'ปกติ' : 'เร็ว'}${ambientLabelStr}`;
        setCurrentClipTitle(newTitle);

        // Add to history
        const newClip: GeneratedClip = {
          id: `clip-${Date.now()}`,
          title: newTitle,
          text: textToVoice.slice(0, 100),
          voiceName: selectedVoice,
          speed: speedPreset,
          speedRate: speedRate,
          style: stylePreset?.title || 'พากย์ทั่วไป',
          audioUrl: finalAudioUrl,
          audioBase64: data.audioBase64,
          createdAt: Date.now(),
          modelUsed: data.modelUsed,
        };
        setHistory((prev) => [newClip, ...prev]);
      }
    } catch (err: any) {
      console.warn('TTS Generation Exception, using fallback engine:', err);
      await executeFallbackSynth(
        'สลับไปใช้ระบบสังเคราะห์เสียง High-Speed Engine ให้เรียบร้อย สามารถฟัง มิกซ์เพลง และดาวน์โหลดได้ตามปกติ'
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

    // Sync Region if voice has region
    const vObj = VOICES.find((v) => v.id === sample.recommendedVoice);
    if (vObj?.region) {
      setCurrentRegion(vObj.region);
    }

    // Apply Recommended Ambient Sound if present
    if (sample.recommendedAmbient && sample.recommendedAmbient !== 'none') {
      setSelectedAmbient(sample.recommendedAmbient);
      setMixIntoDownload(true);
    }

    // Apply Multi-Speaker Dialogues if present
    if (sample.isMultiSpeaker && sample.sampleDialogues && sample.sampleDialogues.length > 0) {
      setIsMultiSpeaker(true);
      setDialogues(sample.sampleDialogues);
    } else {
      setIsMultiSpeaker(false);
    }

    // Smooth scroll to editor
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
        {/* Futuristic Studio Hero Banner (Imagen Generated) */}
        <StudioHeroBanner
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />

        {/* 📖 คู่มือแนะนำวิธีใช้งาน 4 ขั้นตอนง่ายๆ (Quick Start Guide) */}
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
              💡 มีคำอธิบายวิธีใช้กำกับไว้ทุกจุดด้านล่าง
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">1</span>
                <span>เลือกภาษาถิ่น & เสียง</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                เลือกภาค (กลาง, เหนือ, อีสาน, ใต้) และเลือกเสียงผู้ชายหรือผู้หญิงตามต้องการ
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">2</span>
                <span>พิมพ์หรือวางข้อความ</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                พิมพ์ภาษากลางปกติได้เลย ระบบแปลงคำเป็นภาษาถิ่นให้อัตโนมัติทันที
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
                กดปุ่ม &quot;สร้างเสียงพากย์ AI&quot; ฟังตัวอย่าง และกดดาวน์โหลดไฟล์ .WAV ฟรี
              </p>
            </div>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Script Editor & Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Regional Dialect & Accent Studio (เหนือ • อีสาน • ใต้ • กลาง ทั้งชายและหญิง) */}
            <DialectSelector
              currentRegion={currentRegion}
              onSelectRegion={setCurrentRegion}
              selectedVoice={selectedVoice}
              onSelectVoice={setSelectedVoice}
              currentScriptText={text}
              onApplyTranslatedScript={(translatedText) => setText(translatedText)}
              autoTranslateEnabled={autoTranslateEnabled}
              onToggleAutoTranslate={setAutoTranslateEnabled}
            />

            {/* 1.2 Voice Dropdown (Dropdown เมนูให้เลือกเสียงผู้ชาย/เสียงผู้หญิง) */}
            <VoiceDropdown
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
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
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      พิมพ์หรือวางข้อความภาษาไทยที่ต้องการให้อ่านออกเสียง
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
                  <strong className="text-amber-300 font-semibold block">คำอธิบายวิธีพิมพ์บทพากย์:</strong>
                  <span>พิมพ์หรือวางข้อความภาษาไทยทั่วไปได้เลย ไม่จำเป็นต้องแปลงเป็นคำเมืองหรือคำอีสานด้วยตัวเอง หากเปิด <strong>&quot;แปลงเสียงเป็นภาษาถิ่นเมื่อกดพากย์&quot;</strong> ในขั้นตอนที่ 1 ไว้ ระบบจะแปลงคำศัพท์ให้โดยอัตโนมัติ</span>
                </div>
              </div>

              {/* Quick Sample Text Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-400">⚡ ใส่ข้อความด่วน:</span>
                <button
                  type="button"
                  onClick={() => setText('เริ่มต้นวันใหม่ด้วยกาแฟสดหอมกรุ่น คัดสรรเมล็ดพันธุ์ชั้นดี รสชาติกลมกล่อม ละมุนในทุกสัมผัส')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
                >
                  ☕ กาแฟสด
                </button>
                <button
                  type="button"
                  onClick={() => setText('โปรโมชั่นพิเศษวันนี้ ลดทันทีสูงสุด 70% ช้อปด่วน สินค้ามีจำนวนจำกัด พลาดรอบนี้รออีกทีปีหน้าเลยนะ')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
                >
                  🛍️ โปรโมชั่น
                </button>
                <button
                  type="button"
                  onClick={() => setText('ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI สร้างเสียงพากย์คุณภาพระดับมืออาชีพง่ายๆ ในไม่กี่วินาที')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
                >
                  👋 ต้อนรับ
                </button>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="พิมพ์ข้อความที่ต้องการพากย์ที่นี่ เช่น: เริ่มต้นวันใหม่ด้วยกาแฟสดหอมกรุ่น คัดสรรเมล็ดพันธุ์ชั้นดี..."
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
                  ระบบเสียง AI ภาษาไทยความละเอียดสูง
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

            {/* 3. Speed Selector (ช้า / ปกติ / เร็ว) */}
            <SpeedSelector
              speed={speedPreset}
              onSpeedChange={handleSpeedPresetChange}
              speedRate={speedRate}
              onSpeedRateChange={setSpeedRate}
            />

            {/* 3.2 Style Selector (สไตล์ผู้หญิง & สไตล์ทั่วไป พร้อม Dropdown เมนู) */}
            <StyleSelector
              selectedStyleId={selectedStyleId}
              onStyleChange={setSelectedStyleId}
              customStyleText={customStyleText}
              onCustomStyleChange={setCustomStyleText}
              currentVoice={selectedVoice}
              onSelectVoice={setSelectedVoice}
            />

            {/* 4. Background Music & Ambient Selector (คาเฟ่, ธรรมชาติ, คลื่นทะเล, Lo-Fi, Cinematic) */}
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
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="text-amber-400">💡</span>
                  <span><strong>คำแนะนำ:</strong> เมื่อตั้งค่าครบถ้วนแล้ว กดปุ่มสร้างเสียงพากย์ด้านล่าง</span>
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">⚡ ใช้เวลา 1-3 วินาที</span>
              </div>

              {/* Quota fallback notice banner */}
              {quotaNotice && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 shadow-sm">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                  <div className="space-y-0.5 flex-1">
                    <div className="font-semibold text-amber-300 flex items-center justify-between">
                      <span>⚡ กำลังใช้งาน High-Speed Speech Synthesizer</span>
                      <button
                        type="button"
                        onClick={() => setQuotaNotice(null)}
                        className="text-slate-400 hover:text-slate-200 text-[10px]"
                      >
                        ✕ ปิด
                      </button>
                    </div>
                    <div className="text-amber-200/90 leading-relaxed text-[11px]">{quotaNotice}</div>
                  </div>
                </div>
              )}

              {/* Error message if any */}
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
                    <span>กำลังสร้างเสียงพากย์ AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-current" />
                    <span>
                      สร้างเสียงพากย์ AI ({genderLabel} • {speedPreset === 'slow' ? 'ช้า' : speedPreset === 'normal' ? 'ปกติ' : 'เร็ว'})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Audio Output Player & Tools (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Audio Player with Waveform & Download Button */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>เครื่องเล่นและดาวน์โหลดเสียงพากย์</span>
                </h3>
                {currentAudioUrl && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    เสร็จสมบูรณ์
                  </span>
                )}
              </div>

              <AudioPlayer
                audioUrl={currentAudioUrl}
                audioBase64={currentAudioBase64}
                title={currentClipTitle}
                voiceName={currentVoiceObj.name}
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

            {/* 2. Sample Scripts Ready in 1-Click with Search, Category Tabs & Quick Speech Preview */}
            <SampleScriptsSection onApplySample={handleApplySample} />

            {/* 3. Quick Feature Highlights */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>จุดเด่นของระบบสตูดิโอเสียง AI:</span>
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-slate-400 leading-relaxed text-[11px]">
                <li>รองรับ <strong className="text-amber-300">สำเนียงภาษาถิ่น 4 ภาค</strong>: เหนือ (คำเมือง), อีสาน, ใต้, กลาง พร้อมระบบแปลงคำอัตโนมัติ</li>
                <li>เลือกได้ทั้ง <strong className="text-slate-200">เสียงผู้หญิง</strong> และ <strong className="text-slate-200">เสียงผู้ชาย</strong> ครบทุกสำเนียง</li>
                <li>ได้ไฟล์เสียง <strong className="text-slate-200">.WAV คุณภาพสตูดิโอ 24kHz</strong> นำไปตัดต่อใน CapCut หรือ Premiere ได้ทันที</li>
                <li>ปรับความเร็วได้ 3 ระดับ: <strong>ช้า (0.75x)</strong>, <strong>ปกติ (1.0x)</strong>, <strong>เร็ว (1.35x)</strong></li>
                <li>ตัดเสียงเอฟเฟกต์รบกวนออก ให้เสียงพูดคมชัด สดใส เป็นธรรมชาติที่สุด</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section: History of Generated Clips with Instant Download */}
        <HistoryDrawer
          history={history}
          onSelectClip={(clip) => {
            setCurrentAudioUrl(clip.audioUrl);
            setCurrentAudioBase64(clip.audioBase64 || null);
            setCurrentClipTitle(clip.title);
            setSelectedVoice(clip.voiceName);
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

      {/* Code Export Modal (โค้ด HTML, CSS, JavaScript สำหรับนำไปใช้งานต่อ) */}
      <CodeExportModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>AI Voiceover Studio • ระบบสร้างเสียงพากย์ภาษาไทยด้วย AI • พากย์เสียงผู้ชาย เสียงผู้หญิง ปรับความเร็ว ดาวน์โหลด .wav</p>
      </footer>
    </div>
  );
}
