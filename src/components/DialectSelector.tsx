import React, { useState, useEffect } from 'react';
import { RegionType, VoiceName, VoiceOption } from '../types/voice';
import {
  REGIONAL_METAS,
  translateCentralToDialect,
  DIALECT_DEMO_PHRASES,
  RegionalMeta,
  getDefaultScriptForRegionAndGender,
} from '../utils/dialectTranslator';
import { VOICES } from '../data/presets';
import {
  Globe,
  Sparkles,
  Volume2,
  Check,
  ArrowRight,
  Info,
  RefreshCw,
  Copy,
  Play,
  RotateCcw,
} from 'lucide-react';
import { speakWithBrowserSpeech } from '../utils/speechSynthEngine';

interface DialectSelectorProps {
  currentRegion: RegionType;
  onSelectRegion: (region: RegionType) => void;
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  currentScriptText: string;
  onApplyTranslatedScript: (translatedText: string) => void;
  autoTranslateEnabled: boolean;
  onToggleAutoTranslate: (enabled: boolean) => void;
}

export const DialectSelector: React.FC<DialectSelectorProps> = ({
  currentRegion,
  onSelectRegion,
  selectedVoice,
  onSelectVoice,
  currentScriptText,
  onApplyTranslatedScript,
  autoTranslateEnabled,
  onToggleAutoTranslate,
}) => {
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isTranslatingCloud, setIsTranslatingCloud] = useState<boolean>(false);
  const [cloudTranslatedText, setCloudTranslatedText] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [justAdaptedRegion, setJustAdaptedRegion] = useState<string | null>(null);

  const currentVoiceObj = VOICES.find((v) => v.id === selectedVoice) || VOICES[0];
  const regionMeta: RegionalMeta = REGIONAL_METAS[currentRegion];

  // Local real-time dialect translation of current text
  const localTranslation = translateCentralToDialect(
    currentScriptText,
    currentRegion,
    currentVoiceObj.gender === 'male' ? 'male' : 'female'
  );

  const activeTranslation = cloudTranslatedText || localTranslation.translatedText;
  const isDifferentFromOriginal =
    currentRegion !== 'central' &&
    currentScriptText.trim().length > 0 &&
    activeTranslation.trim() !== currentScriptText.trim();

  // Reset cloud translation when script or region changes
  useEffect(() => {
    setCloudTranslatedText(null);
  }, [currentScriptText, currentRegion]);

  // When changing region: update region, select matching voice, and IMMEDIATELY convert script text!
  const handleRegionChange = (newRegion: RegionType) => {
    onSelectRegion(newRegion);

    // Find matching voice in that region with same gender preference
    const regionVoices = VOICES.filter((v) => (v.region || 'central') === newRegion);
    let chosenVoice = currentVoiceObj;
    if (regionVoices.length > 0) {
      const sameGender = regionVoices.find((v) => v.gender === currentVoiceObj.gender);
      chosenVoice = sameGender || regionVoices[0];
      onSelectVoice(chosenVoice.id);
    }

    const targetGender = chosenVoice.gender === 'male' ? 'male' : 'female';

    // Auto translate current script text to the new region immediately!
    if (currentScriptText.trim()) {
      const adapted = translateCentralToDialect(currentScriptText, newRegion, targetGender);
      onApplyTranslatedScript(adapted.translatedText);
      setJustAdaptedRegion(REGIONAL_METAS[newRegion].nameThai);
      setTimeout(() => setJustAdaptedRegion(null), 3500);
    } else {
      const defaultScript = getDefaultScriptForRegionAndGender(newRegion, targetGender);
      onApplyTranslatedScript(defaultScript);
    }
  };

  // Cloud AI enhanced dialect translation
  const handleCloudTranslate = async () => {
    if (!currentScriptText.trim() || currentRegion === 'central') return;
    setIsTranslatingCloud(true);
    try {
      const res = await fetch('/api/dialect/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentScriptText,
          targetRegion: currentRegion,
          gender: currentVoiceObj.gender === 'male' ? 'male' : 'female',
        }),
      });
      const data = await res.json();
      if (data.success && data.translatedText) {
        setCloudTranslatedText(data.translatedText);
        onApplyTranslatedScript(data.translatedText);
      }
    } catch (e) {
      console.warn('Cloud translation fallback to local:', e);
    } finally {
      setIsTranslatingCloud(false);
    }
  };

  // Test / preview speech with specific voice
  const handleTestVoice = (voice: VoiceOption, customSnippet?: string) => {
    setPlayingVoiceId(voice.id);

    // Determine authentic greeting / sample text for that specific voice
    let sampleText = customSnippet;
    if (!sampleText) {
      if (voice.id === 'Lanna_Female') {
        sampleText = 'สวัสดีเจ้า ยินดีต้อนฮับสู่เจียงใหม่เน้อเจ้า บัวตองอู้กำเมืองม่วนๆ ลำขนาดเน้อเจ้า';
      } else if (voice.id === 'Lanna_Male') {
        sampleText = 'สุมาเต๊อะกั๊บ ยินดีจ้าดนักเน้อครับ หนานเมืองยินดีต้อนฮับ อู้กำเมืองม่วนๆ กั๊บ';
      } else if (voice.id === 'Isan_Female') {
        sampleText = 'สวัสดีจ้าพี่น้อง มาพ้อกับน้องคำแพงมื้อนี้ แซ่บหลาย ตาฮักคักอีหลีเด้อจ้า';
      } else if (voice.id === 'Isan_Male') {
        sampleText = 'สะบายดีเด้อครับพี่น้อง มื้อนี้ทิดทศพามาม่วนซื่น เว้าอีสานคักหลายเด้อครับ';
      } else if (voice.id === 'Southern_Female') {
        sampleText = 'สวัสดีค่ะพี่น้อง วันนี้น้องนุ้ยมาแหลงให้ฟัง หรอยจังหู้นิ หรอยอย่างแรงนิค่ะ';
      } else if (voice.id === 'Southern_Male') {
        sampleText = 'สวัสดีคับพี่น้องชาวใต้ บ่าวหลวงมาแหลงใต้หรอยๆ คมเข้มจริงใจคับพี่น้อง';
      } else {
        sampleText =
          voice.gender === 'female'
            ? 'สวัสดีค่ะ ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI คุณภาพระดับมืออาชีพค่ะ'
            : 'สวัสดีครับ สตูดิโอพากย์เสียง AI พร้อมสร้างเสียงพากย์คุณภาพเยี่ยมแล้วครับ';
      }
    }

    speakWithBrowserSpeech(sampleText, voice.id, 1.0, () => {
      setPlayingVoiceId(null);
    });
  };

  // Preview speak dialect of the active translated text
  const handlePreviewSpeech = (textToSpeak: string) => {
    setIsPlayingPreview(true);
    speakWithBrowserSpeech(textToSpeak, selectedVoice, 1.0, () => {
      setIsPlayingPreview(false);
    });
  };

  const handleCopyTranslated = () => {
    navigator.clipboard.writeText(activeTranslation);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Filter voices by current region and gender
  const regionVoices = VOICES.filter((v) => {
    const vRegion = v.region || 'central';
    const matchesRegion = vRegion === currentRegion;
    const matchesGender = genderFilter === 'all' || v.gender === genderFilter;
    return matchesRegion && matchesGender;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* 1. Header with Region Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Globe className="w-5 h-5" />
            </span>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              ขั้นตอนที่ 1 • เลือกภาษาถิ่นและสำเนียง (Regional Accents)
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                4 ภาค (ชาย/หญิง)
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            เลือกว่าต้องการเสียงสำเนียงภาคไหน ระบบจะแปลงคำภาษากลางที่คุณพิมพ์ให้เป็นสำเนียงภาคนั้นโดยอัตโนมัติ
          </p>
        </div>

        {/* Gender Filter for Voices */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setGenderFilter('all')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              genderFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => setGenderFilter('female')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              genderFilter === 'female'
                ? 'bg-pink-500 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👩 เสียงผู้หญิง
          </button>
          <button
            type="button"
            onClick={() => setGenderFilter('male')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              genderFilter === 'male'
                ? 'bg-blue-500 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👨 เสียงผู้ชาย
          </button>
        </div>
      </div>

      {/* Toast Notification when region is changed */}
      {justAdaptedRegion && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>
              ✓ ปรับเปลี่ยนบทพากย์เป็น <strong>{justAdaptedRegion}</strong> โดยอัตโนมัติเรียบร้อยแล้ว!
            </span>
          </div>
          <span className="text-[10px] text-emerald-300">พร้อมพากย์ทันที</span>
        </div>
      )}

      {/* คำอธิบายวิธีใช้งานจุดที่ 1 */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-2.5 shadow-sm">
        <span className="text-base shrink-0">💡</span>
        <div className="space-y-1 text-[11px] leading-relaxed">
          <strong className="text-amber-300 font-semibold block">คำอธิบายวิธีใช้การเลือกภาษาถิ่น:</strong>
          <p>
            1. คลิกเลือกภาคที่ต้องการ: <strong>ภาคเหนือ</strong> (อู้คำเมือง), <strong>ภาคอีสาน</strong> (เว้าอีสาน), <strong>ภาคใต้</strong> (แหลงใต้) หรือ <strong>ภาษากลาง</strong> (มาตรฐาน)<br/>
            2. เลือกลักษณะเสียง: <strong>เสียงผู้หญิง</strong> หรือ <strong>เสียงผู้ชาย</strong> ประจำภาคนั้น พร้อมกดปุ่ม <strong>&quot;🔊 ทดสอบเสียง&quot;</strong> เพื่อฟังเสียงตัวอย่างได้ทันที<br/>
            3. พิมพ์ข้อความภาษากลางได้ตามปกติ ระบบจะตรวจจับและแปลงเป็นศัพท์ภาษาถิ่นให้อัตโนมัติ (เช่น &quot;อร่อยมาก&quot; เป็น &quot;ลำขนาด&quot; หรือ &quot;แซ่บหลาย&quot; หรือ &quot;หรอยจังหู้&quot;)
          </p>
        </div>
      </div>

      {/* 2. Four Region Select Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {(Object.keys(REGIONAL_METAS) as RegionType[]).map((rKey) => {
          const r = REGIONAL_METAS[rKey];
          const isSelected = currentRegion === rKey;
          return (
            <button
              key={rKey}
              type="button"
              onClick={() => handleRegionChange(rKey)}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-gradient-to-br ' + r.cardGradient + ' shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/40'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{r.icon}</span>
                {isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-100 flex items-center justify-between">
                  <span>{r.title}</span>
                  {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {r.dialectTagline}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Regional Voices Selection (Male & Female) with Instant Voice Test Button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <span>นักพากย์ประจำ{regionMeta.title}</span>
            <span className="text-[11px] text-amber-400/90 font-normal">
              (เลือกตัวละครและกดปุ่มทดสอบเสียง)
            </span>
          </label>
          <span className="text-[11px] text-slate-400">
            {regionVoices.length} คาแรคเตอร์พร้อมใช้งาน
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {regionVoices.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isThisPlaying = playingVoiceId === voice.id;
            return (
              <div
                key={voice.id}
                onClick={() => onSelectVoice(voice.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left relative cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/50'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-sm flex-shrink-0 bg-gradient-to-tr ${voice.avatarColor} text-white`}
                >
                  {voice.avatarEmoji || (voice.gender === 'female' ? '👩' : '👨')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-slate-100 truncate">
                      {voice.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        voice.gender === 'female'
                          ? 'bg-pink-500/20 text-pink-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {voice.gender === 'female' ? 'หญิง' : 'ชาย'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-400/90 line-clamp-1 mt-0.5 font-medium">
                    {voice.tone}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {voice.personaDescription}
                  </p>

                  {/* Test Voice Audio Button */}
                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVoice(voice.id);
                        handleTestVoice(voice);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-medium ${
                        isThisPlaying
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md animate-pulse'
                          : 'bg-slate-800/80 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-slate-700/60'
                      }`}
                      title={`คลิกฟังเสียงตัวอย่างของ ${voice.name}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isThisPlaying ? 'กำลังเปล่งเสียง...' : '🔊 ทดสอบเสียงนี้'}</span>
                    </button>

                    {isSelected && (
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>กำลังเลือกใช้</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Auto Dialect Translation Preview & Comparison */}
      {currentRegion !== 'central' && (
        <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </span>
              <span className="text-xs font-semibold text-amber-300">
                ระบบแปลงภาษากลางเป็น{regionMeta.nameThai}อัตโนมัติ
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                {localTranslation.replacedWordsCount > 0
                  ? `ตรวจพบและแปลง ${localTranslation.replacedWordsCount} คำถิ่น`
                  : 'พร้อมแปลงอัตโนมัติ'}
              </span>
            </div>

            {/* Toggle switch & Deep AI translate button */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-400 cursor-pointer flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={autoTranslateEnabled}
                  onChange={(e) => onToggleAutoTranslate(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
                />
                <span>แปลงเสียงเป็นภาษาถิ่นเมื่อกดพากย์</span>
              </label>

              <button
                type="button"
                onClick={handleCloudTranslate}
                disabled={isTranslatingCloud || !currentScriptText.trim()}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                title="ใช้ AI ถอดความภาษาถิ่นแบบสละสลวยทั้งประโยค"
              >
                <RefreshCw className={`w-3 h-3 ${isTranslatingCloud ? 'animate-spin' : ''}`} />
                <span>AI ถอดความลึก</span>
              </button>
            </div>
          </div>

          {/* Comparison Preview Box */}
          <div className="space-y-2">
            <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium text-amber-300">
                  <span>เสียงที่จะถูกพากย์ออกเป็น ({regionMeta.nameThai}):</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePreviewSpeech(activeTranslation)}
                    disabled={isPlayingPreview || !activeTranslation.trim()}
                    className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] flex items-center gap-1.5 transition-all disabled:opacity-50 font-bold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isPlayingPreview ? 'กำลังพูด...' : '🔊 ฟังตัวอย่างเสียง'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyTranslated}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                    title="คัดลอกบทภาษาถิ่น"
                  >
                    {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {currentScriptText.trim() ? (
                <p className="text-sm text-amber-200 font-medium leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-amber-500/20">
                  {activeTranslation}
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  พิมพ์ข้อความภาษากลางในกล่องสคริปต์ด้านบน ระบบจะแปลงเป็น{regionMeta.nameThai}ให้ดูทันทีที่นี่
                </p>
              )}

              {/* Action: Apply translated text back to editor */}
              {isDifferentFromOriginal && (
                <div className="pt-1.5 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onApplyTranslatedScript(activeTranslation)}
                    className="text-xs px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold hover:from-amber-400 hover:to-orange-400 flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    <span>✨ แทนที่คำภาษาถิ่นนี้ลงในกล่องสคริปต์ทันที</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Regional Demo Phrases */}
          <div className="pt-1 space-y-2">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>คลิกทดสอบประโยคตัวอย่างสำเนียง{regionMeta.nameThai} (คลิกเพื่อฟังเสียงหรือโหลดใส่สคริปต์):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DIALECT_DEMO_PHRASES.map((demo) => {
                const targetText =
                  currentRegion === 'northern'
                    ? demo.northern
                    : currentRegion === 'isan'
                    ? demo.isan
                    : currentRegion === 'southern'
                    ? demo.southern
                    : demo.central;

                return (
                  <div
                    key={demo.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 flex items-start justify-between gap-2 transition-all"
                  >
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => onApplyTranslatedScript(targetText)}
                      title={`คลิกเพื่อใส่ข้อความนี้: "${targetText}"`}
                    >
                      <span className="text-[11px] font-bold text-amber-400 block">{demo.category}</span>
                      <p className="text-xs text-slate-200 line-clamp-2 mt-0.5 font-medium leading-relaxed">
                        {targetText}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePreviewSpeech(targetText)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                      title="กดฟังเสียงพูดประโยคนี้ทันที"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>ฟังเสียง</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
