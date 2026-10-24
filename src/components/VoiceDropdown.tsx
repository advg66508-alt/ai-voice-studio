import React, { useState, useRef, useEffect } from 'react';
import { VoiceName, VoiceOption } from '../types/voice';
import { VOICES } from '../data/presets';
import { ChevronDown, Check, User, Sparkles, Filter, Volume2 } from 'lucide-react';
import { speakWithBrowserSpeech } from '../utils/speechSynthEngine';
import { playPreviewAudio } from '../utils/audioPreviewPlayer';

interface VoiceDropdownProps {
  selectedVoice: VoiceName;
  onVoiceChange: (voice: VoiceName) => void;
}

export const VoiceDropdown: React.FC<VoiceDropdownProps> = ({
  selectedVoice,
  onVoiceChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male'>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentVoiceObj = VOICES.find((v) => v.id === selectedVoice) || VOICES[0];

  const handleTestVoiceAudio = (e: React.MouseEvent, voice: VoiceOption) => {
    e.stopPropagation();
    setPlayingVoiceId(voice.id);

    let snippet = '';
    if (voice.id === 'Lanna_Female') {
      snippet = 'สวัสดีเจ้า ยินดีต้อนฮับสู่เจียงใหม่เน้อเจ้า บัวตองอู้กำเมืองลำขนาดเน้อเจ้า';
    } else if (voice.id === 'Lanna_Male') {
      snippet = 'สุมาเต๊อะกั๊บ ยินดีจ้าดนักเน้อครับ หนานเมืองยินดีต้อนฮับ อู้กำเมืองม่วนๆ กั๊บ';
    } else if (voice.id === 'Isan_Female') {
      snippet = 'สวัสดีจ้าพี่น้อง มาพ้อกับน้องคำแพงมื้อนี้ แซ่บหลาย ตาฮักคักอีหลีเด้อจ้า';
    } else if (voice.id === 'Isan_Male') {
      snippet = 'สะบายดีเด้อครับพี่น้อง มื้อนี้ทิดทศพามาม่วนซื่น เว้าอีสานคักหลายเด้อครับ';
    } else if (voice.id === 'Southern_Female') {
      snippet = 'สวัสดีค่ะพี่น้อง วันนี้น้องนุ้ยมาแหลงให้ฟัง หรอยจังหู้นิ หรอยอย่างแรงนิค่ะ';
    } else if (voice.id === 'Southern_Male') {
      snippet = 'สวัสดีคับพี่น้องชาวใต้ บ่าวหลวงมาแหลงใต้หรอยๆ คมเข้มจริงใจคับพี่น้อง';
    } else {
      snippet =
        voice.gender === 'female'
          ? 'สวัสดีค่ะ ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI คุณภาพระดับมืออาชีพค่ะ'
          : 'สวัสดีครับ สตูดิโอพากย์เสียง AI พร้อมสร้างเสียงพากย์คุณภาพยอดเยี่ยมครับ';
    }

    playPreviewAudio(
      'voice_' + voice.id,
      (isPlaying) => {
        if (!isPlaying) setPlayingVoiceId(null);
      },
      snippet,
      voice.id
    );
  };

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const femaleVoices = VOICES.filter((v) => v.gender === 'female');
  const maleVoices = VOICES.filter((v) => v.gender === 'male');
  const neutralVoices = VOICES.filter((v) => v.gender === 'neutral');

  const filteredVoices =
    filterGender === 'all'
      ? VOICES
      : filterGender === 'female'
      ? femaleVoices
      : maleVoices;

  return (
    <div
      className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative transition-all ${
        isOpen ? 'z-50 ring-1 ring-amber-500/40' : 'z-30'
      }`}
    >
      {/* Label and Quick Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div>
          <label className="block text-sm font-bold text-slate-100 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <User className="w-4 h-4" />
            </span>
            <span>เลือกเสียงพากย์ (Dropdown เมนู)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
              {currentVoiceObj.gender === 'female' ? '👩 เสียงผู้หญิง' : currentVoiceObj.gender === 'male' ? '👨 เสียงผู้ชาย' : '🎙️ เสียงเป็นกลาง'}
            </span>
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            เลือกเสียงผู้ชายหรือเสียงผู้หญิง (ภาษาไทย) ตามอารมณ์และประเภทงาน
          </p>
        </div>

        {/* Quick Gender Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            type="button"
            onClick={() => setFilterGender('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filterGender === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ทั้งหมด ({VOICES.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterGender('female');
              if (currentVoiceObj.gender !== 'female') {
                onVoiceChange('Kore');
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              filterGender === 'female' || (filterGender === 'all' && currentVoiceObj.gender === 'female')
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>👩 เสียงผู้หญิง ({femaleVoices.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterGender('male');
              if (currentVoiceObj.gender !== 'male') {
                onVoiceChange('Puck');
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              filterGender === 'male' || (filterGender === 'all' && currentVoiceObj.gender === 'male')
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>👨 เสียงผู้ชาย ({maleVoices.length})</span>
          </button>
        </div>
      </div>

      {/* คำอธิบายวิธีใช้งานจุดที่ 2 */}
      <div className="mb-3.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs flex items-start gap-2.5">
        <span className="text-base shrink-0">💡</span>
        <div className="space-y-0.5 text-[11px] leading-relaxed">
          <strong className="text-purple-300 font-semibold block">คำอธิบายวิธีเลือกเสียงพากย์:</strong>
          <span>คลิกที่เมนูด้านล่างเพื่อเปิดรายชื่อตัวละครเสียงทั้งหมด คุณสามารถเลือกเสียงผู้หญิง (นุ่ม หวาน สดใส) หรือเสียงผู้ชาย (อบอุ่น สุขุม ทรงพลัง) โดยแต่ละคนจะมีเอกลักษณ์และสำเนียงที่แตกต่างกัน</span>
        </div>
      </div>

      {/* Custom Accessible Dropdown Component */}
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <div className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-500/50 rounded-xl px-4 py-3 text-left flex items-center justify-between gap-3 transition-all shadow-inner">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${currentVoiceObj.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}
            >
              {currentVoiceObj.avatarEmoji || (currentVoiceObj.gender === 'female' ? '👩' : currentVoiceObj.gender === 'male' ? '👨' : '🎙️')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-100 text-sm">
                  {currentVoiceObj.gender === 'female' ? 'เสียงผู้หญิง' : currentVoiceObj.gender === 'male' ? 'เสียงผู้ชาย' : 'เสียงเป็นกลาง'} : {currentVoiceObj.name}
                </span>
                {currentVoiceObj.dialectBadge ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                    {currentVoiceObj.dialectBadge}
                  </span>
                ) : (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      currentVoiceObj.gender === 'female'
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                        : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    ภาษาไทย
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {currentVoiceObj.tone} — {currentVoiceObj.bestFor}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => handleTestVoiceAudio(e, currentVoiceObj)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                playingVoiceId === currentVoiceObj.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-amber-500/20 text-amber-300 border-slate-700'
              }`}
              title={`ทดลองฟังเสียง ${currentVoiceObj.name}`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {playingVoiceId === currentVoiceObj.id ? 'กำลังเล่น...' : 'ทดลองเสียง'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
              aria-label="เปิดรายการเสียงพากย์"
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Dropdown Menu Panel */}
        {isOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border-2 border-amber-500/60 rounded-xl shadow-2xl overflow-hidden backdrop-blur-2xl ring-4 ring-black/80 animate-in fade-in duration-150">
            <div className="p-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">ตัวเลือกเสียงพากย์ภาษาไทยทั้ง 4 ภาค:</span>
              <span className="text-amber-400 font-mono">
                หญิง {femaleVoices.length} คน • ชาย {maleVoices.length} คน
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1.5">
              {/* Group: เสียงผู้หญิง */}
              {(filterGender === 'all' || filterGender === 'female') && (
                <div className="py-1">
                  <div className="px-3 py-1 text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🌸 เสียงผู้หญิง ({femaleVoices.length} คาแรคเตอร์ - เหนือ/อีสาน/ใต้/กลาง)</span>
                  </div>
                  {femaleVoices.map((v) => {
                    const isSelected = selectedVoice === v.id;
                    const isPlayingThis = playingVoiceId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          onVoiceChange(v.id);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/20 text-white border border-rose-500/40 font-medium'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${v.avatarColor} flex items-center justify-center text-sm shadow shrink-0`}
                          >
                            {v.avatarEmoji || '👩'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-100 flex items-center gap-2 flex-wrap">
                              <span>{v.thaiName || v.name}</span>
                              {v.dialectBadge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">
                                  {v.dialectBadge}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 line-clamp-1">{v.tone}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleTestVoiceAudio(e, v)}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer border ${
                              isPlayingThis
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-800 hover:bg-amber-500/20 text-amber-300 border-slate-700'
                            }`}
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>{isPlayingThis ? 'หยุด' : 'ฟัง'}</span>
                          </button>
                          {isSelected && <Check className="w-4 h-4 text-rose-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Group: เสียงผู้ชาย */}
              {(filterGender === 'all' || filterGender === 'male') && (
                <div className="py-1">
                  <div className="px-3 py-1 text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👨 เสียงผู้ชาย ({maleVoices.length} คาแรคเตอร์ - เหนือ/อีสาน/ใต้/กลาง)</span>
                  </div>
                  {maleVoices.map((v) => {
                    const isSelected = selectedVoice === v.id;
                    const isPlayingThis = playingVoiceId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          onVoiceChange(v.id);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-500/20 text-white border border-blue-500/40 font-medium'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${v.avatarColor} flex items-center justify-center text-sm shadow shrink-0`}
                          >
                            {v.avatarEmoji || '👨'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-100 flex items-center gap-2 flex-wrap">
                              <span>{v.thaiName || v.name}</span>
                              {v.dialectBadge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">
                                  {v.dialectBadge}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 line-clamp-1">{v.tone}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleTestVoiceAudio(e, v)}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer border ${
                              isPlayingThis
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-800 hover:bg-amber-500/20 text-amber-300 border-slate-700'
                            }`}
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>{isPlayingThis ? 'หยุด' : 'ฟัง'}</span>
                          </button>
                          {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Group: เสียงเป็นกลาง */}
              {filterGender === 'all' && (
                <div className="py-1">
                  <div className="px-3 py-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎙️ เสียงเป็นกลาง / ธรรมชาติ (ภาษาไทย)</span>
                  </div>
                  {neutralVoices.map((v) => {
                    const isSelected = selectedVoice === v.id;
                    const isPlayingThis = playingVoiceId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          onVoiceChange(v.id);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/20 text-white border border-emerald-500/40 font-medium'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${v.avatarColor} flex items-center justify-center text-xs font-bold text-white shrink-0`}
                          >
                            🎙️
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                              {v.name}
                            </div>
                            <div className="text-xs text-slate-400 line-clamp-1">{v.tone}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleTestVoiceAudio(e, v)}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer border ${
                              isPlayingThis
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-800 hover:bg-amber-500/20 text-amber-300 border-slate-700'
                            }`}
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>{isPlayingThis ? 'หยุด' : 'ฟัง'}</span>
                          </button>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fallback Standard HTML <select> for Accessibility / Screen Readers */}
      <div className="sr-only">
        <label htmlFor="voice-native-select">เลือกเสียงพากย์</label>
        <select
          id="voice-native-select"
          value={selectedVoice}
          onChange={(e) => onVoiceChange(e.target.value as VoiceName)}
        >
          <optgroup label="เสียงผู้หญิง (ภาษาไทย)">
            {femaleVoices.map((v) => (
              <option key={v.id} value={v.id}>
                เสียงผู้หญิง - {v.name} ({v.tone})
              </option>
            ))}
          </optgroup>
          <optgroup label="เสียงผู้ชาย (ภาษาไทย)">
            {maleVoices.map((v) => (
              <option key={v.id} value={v.id}>
                เสียงผู้ชาย - {v.name} ({v.tone})
              </option>
            ))}
          </optgroup>
          <optgroup label="เสียงเป็นกลาง">
            {neutralVoices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.tone})
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );
};
