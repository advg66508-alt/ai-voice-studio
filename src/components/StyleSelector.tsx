import React, { useState, useRef, useEffect } from 'react';
import { StylePreset, VoiceName } from '../types/voice';
import { STYLE_PRESETS } from '../data/presets';
import { Palette, ChevronDown, Check, Sparkles, SlidersHorizontal, Heart, ShieldAlert } from 'lucide-react';

interface StyleSelectorProps {
  selectedStyleId: string;
  onStyleChange: (styleId: string) => void;
  customStyleText: string;
  onCustomStyleChange: (text: string) => void;
  currentVoice?: VoiceName;
  onSelectVoice?: (voice: VoiceName) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyleId,
  onStyleChange,
  customStyleText,
  onCustomStyleChange,
  currentVoice,
  onSelectVoice,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'female' | 'general'>('female');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentStyleObj =
    STYLE_PRESETS.find((s) => s.id === selectedStyleId) || STYLE_PRESETS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const femaleStyles = STYLE_PRESETS.filter((s) => s.category === 'female');
  const generalStyles = STYLE_PRESETS.filter((s) => s.category !== 'female');

  const visiblePresets =
    activeTab === 'female'
      ? femaleStyles
      : activeTab === 'general'
      ? generalStyles
      : STYLE_PRESETS;

  const handleSelectStyle = (preset: StylePreset) => {
    onStyleChange(preset.id);
    setIsOpen(false);
    // If user picks a female style and current voice is male, recommend or auto-switch to Kore
    if (preset.category === 'female' && currentVoice && currentVoice !== 'Kore' && onSelectVoice) {
      onSelectVoice('Kore');
    }
  };

  return (
    <div
      className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative transition-all ${
        isOpen ? 'z-40 ring-1 ring-amber-500/30' : 'z-20'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-base">
                สไตล์และอารมณ์การพากย์ (Style & Tone)
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  currentStyleObj.category === 'female'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {currentStyleObj.icon} {currentStyleObj.title}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              รวมสไตล์พากย์ผู้หญิง (สาวหวาน, สาวมั่น, คาวาอี้, คุณแม่, แม่ค้าไลฟ์สด) และสไตล์งานทั่วไป
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{showCustomInput ? 'ซ่อนพิมพ์เอง' : 'พิมพ์สไตล์เอง'}</span>
        </button>
      </div>

      {/* คำอธิบายวิธีใช้งานสไตล์เสียง */}
      <div className="mb-3.5 p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-200 text-xs flex items-start gap-2.5">
        <span className="text-base shrink-0">💡</span>
        <div className="space-y-0.5 text-[11px] leading-relaxed">
          <strong className="text-pink-300 font-semibold block">คำอธิบายวิธีเลือกสไตล์และอารมณ์เสียง:</strong>
          <span>คลิกเลือกอารมณ์เพื่อปรับแต่งอินเนอร์ของ AI เช่น สดใส มีพลัง, อบอุ่น เป็นมิตร, สารคดี สุขุม หรือ แม่ค้าไลฟ์สด เพื่อให้น้ำเสียงเข้ากับเนื้อหาวิดีโอของคุณมากที่สุด</span>
        </div>
      </div>

      {/* Category Tabs: สไตล์ผู้หญิง / สไตล์ทั่วไป / ทั้งหมด */}
      <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-3.5">
        <button
          type="button"
          onClick={() => setActiveTab('female')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'female'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-950/40'
              : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900'
          }`}
        >
          <span>🌸 สไตล์ผู้หญิง ({femaleStyles.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'general'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
              : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
          }`}
        >
          <span>📢 สไตล์งานทั่วไป ({generalStyles.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span>ทั้งหมด ({STYLE_PRESETS.length})</span>
        </button>
      </div>

      {/* DROPDOWN SELECTOR FOR STYLE */}
      <div className="relative mb-3.5" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-slate-950 hover:bg-slate-900 border-2 rounded-xl px-4 py-3 text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-md focus:outline-none focus:ring-2 ${
            currentStyleObj.category === 'female'
              ? 'border-rose-500/50 hover:border-rose-400 focus:ring-rose-500'
              : 'border-slate-700 hover:border-amber-500/60 focus:ring-amber-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-2xl p-1.5 rounded-lg ${
                currentStyleObj.category === 'female' ? 'bg-rose-950/50' : 'bg-slate-800'
              }`}
            >
              {currentStyleObj.icon}
            </span>
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>{currentStyleObj.title}</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.2 rounded border ${
                    currentStyleObj.category === 'female'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {currentStyleObj.category === 'female' ? '👩 สไตล์ผู้หญิง' : '🎙️ สไตล์ทั่วไป'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                {currentStyleObj.description}
              </p>
            </div>
          </div>

          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            } ${currentStyleObj.category === 'female' ? 'text-rose-400' : 'text-amber-400'}`}
          />
        </button>

        {/* Dropdown Options Popup with Grouping */}
        {isOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border-2 border-rose-500/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-2xl ring-4 ring-black/80 animate-in fade-in duration-150">
            <div className="p-2.5 bg-slate-950 border-b border-slate-800 text-xs font-bold text-slate-300 flex justify-between items-center">
              <span>เลือกอารมณ์และสไตล์การพากย์:</span>
              <span className="text-rose-400 font-mono">{STYLE_PRESETS.length} สไตล์เสียง</span>
            </div>

            <div className="max-h-80 overflow-y-auto p-1.5 divide-y divide-slate-800/80">
              {/* Group: สไตล์ผู้หญิง */}
              <div className="py-1">
                <div className="px-3 py-1.5 text-[11px] font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 bg-rose-950/30 rounded-lg mb-1">
                  <span>🌸 สไตล์ผู้หญิง (Female Styles)</span>
                </div>
                {femaleStyles.map((preset) => {
                  const isSelected = selectedStyleId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectStyle(preset)}
                      className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500/25 text-white border border-rose-400 font-bold'
                          : 'hover:bg-slate-800/90 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{preset.icon}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                            {preset.title}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Group: สไตล์งานทั่วไป */}
              <div className="py-1">
                <div className="px-3 py-1.5 text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 bg-amber-950/30 rounded-lg mb-1 mt-1">
                  <span>📢 สไตล์งานทั่วไป (General Styles)</span>
                </div>
                {generalStyles.map((preset) => {
                  const isSelected = selectedStyleId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectStyle(preset)}
                      className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/25 text-white border border-amber-400 font-bold'
                          : 'hover:bg-slate-800/90 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{preset.icon}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                            {preset.title}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QUICK SELECT CARDS */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>คลิกเลือกสไตล์ด่วน ({activeTab === 'female' ? 'สไตล์ผู้หญิง' : activeTab === 'general' ? 'สไตล์ทั่วไป' : 'ทั้งหมด'}):</span>
          <span className="text-slate-500 font-mono text-[11px]">{visiblePresets.length} รายการ</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {visiblePresets.map((preset) => {
            const isSelected = selectedStyleId === preset.id;
            const isFemale = preset.category === 'female';
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectStyle(preset)}
                className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer relative shadow-sm flex flex-col justify-between ${
                  isSelected
                    ? isFemale
                      ? 'bg-rose-500/20 border-rose-400 text-white font-bold ring-2 ring-rose-400/50 shadow-md scale-[1.01]'
                      : 'bg-amber-500/20 border-amber-400 text-white font-bold ring-2 ring-amber-400/50 shadow-md scale-[1.01]'
                    : isFemale
                    ? 'bg-slate-800/90 border-rose-900/40 text-slate-200 hover:bg-slate-750 hover:border-rose-500/40'
                    : 'bg-slate-800/90 border-slate-700/80 text-slate-200 hover:bg-slate-750 hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">{preset.icon}</span>
                    {isSelected && (
                      <div
                        className={`w-2 h-2 rounded-full shadow-sm animate-pulse ${
                          isFemale ? 'bg-rose-400 shadow-rose-400' : 'bg-amber-400 shadow-amber-400'
                        }`}
                      />
                    )}
                  </div>
                  <div className="font-bold text-xs text-slate-100 truncate">
                    {preset.title}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-1.5 leading-snug">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Custom Style Input */}
      {showCustomInput && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-800 space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            พิมพ์อธิบายสไตล์หรืออารมณ์ที่ต้องการเอง:
          </label>
          <input
            type="text"
            value={customStyleText}
            onChange={(e) => onCustomStyleChange(e.target.value)}
            placeholder="เช่น สาวหวานขี้อายพูดเบาๆ, สาวแซ่บปาร์ตี้, คุณครูใจดีสอนเด็กๆ"
            className="w-full bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-400"
          />
        </div>
      )}
    </div>
  );
};
