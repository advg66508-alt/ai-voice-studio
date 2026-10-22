import React from 'react';
import { DialogueLine, VoiceName } from '../types/voice';
import { Plus, Trash2, Users } from 'lucide-react';

interface MultiSpeakerStudioProps {
  dialogues: DialogueLine[];
  onDialoguesChange: (lines: DialogueLine[]) => void;
}

export const MultiSpeakerStudio: React.FC<MultiSpeakerStudioProps> = ({
  dialogues,
  onDialoguesChange,
}) => {
  const handleLineChange = (index: number, field: keyof DialogueLine, value: string) => {
    const next = [...dialogues];
    next[index] = { ...next[index], [field]: value };
    onDialoguesChange(next);
  };

  const handleAddLine = () => {
    const last = dialogues[dialogues.length - 1];
    const isAlex = last?.speaker === 'ตัวละคร 1 (ผู้ชาย)';
    onDialoguesChange([
      ...dialogues,
      {
        id: `dlg-${Date.now()}`,
        speaker: isAlex ? 'ตัวละคร 2 (ผู้หญิง)' : 'ตัวละคร 1 (ผู้ชาย)',
        voiceName: isAlex ? 'Kore' : 'Puck',
        text: '',
        style: 'น้ำเสียงเป็นธรรมชาติ',
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (dialogues.length <= 2) return;
    onDialoguesChange(dialogues.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base">
              โหมดพากย์ 2 ตัวละครพร้อมกัน (Multi-Speaker Dialogue)
            </h3>
            <p className="text-xs text-slate-400">
              พากย์บทสนทนาระหว่างตัวละครชายและหญิงในคลิปเดียวกัน
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddLine}
          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่มบทพูด</span>
        </button>
      </div>

      {/* คำอธิบายวิธีใช้งานโหมดหลายตัวละคร */}
      <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-200 text-xs flex items-start gap-2.5">
        <span className="text-base shrink-0">💡</span>
        <div className="space-y-0.5 text-[11px] leading-relaxed">
          <strong className="text-pink-300 font-semibold block">คำอธิบายวิธีใช้โหมดบทสนทนา 2 ตัวละคร:</strong>
          <span>คลิกที่แต่ละประโยคเพื่อเลือกว่าเป็นเสียงผู้ชายหรือผู้หญิง และพิมพ์คำพูดตามลำดับ ระบบจะพากย์สลับเสียงและมิกซ์รวมให้เป็นไฟล์เสียงเดียวโดยอัตโนมัติ</span>
        </div>
      </div>

      <div className="space-y-3">
        {dialogues.map((dlg, idx) => {
          const isFemale = dlg.voiceName === 'Kore';
          return (
            <div
              key={dlg.id || idx}
              className={`p-3.5 rounded-xl border transition-all ${
                isFemale
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-blue-950/20 border-blue-500/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{isFemale ? '👩' : '👨'}</span>
                  <input
                    type="text"
                    value={dlg.speaker}
                    onChange={(e) => handleLineChange(idx, 'speaker', e.target.value)}
                    className="bg-transparent font-bold text-xs text-slate-200 border-b border-transparent focus:border-slate-500 focus:outline-none px-1"
                    placeholder="ชื่อตัวละคร"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={dlg.voiceName}
                    onChange={(e) =>
                      handleLineChange(idx, 'voiceName', e.target.value as VoiceName)
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  >
                    <optgroup label="👩 เสียงผู้หญิง (3 คาแรคเตอร์)">
                      <option value="Kore">👩 โคเร่ (Kore) - อบอุ่น นุ่มนวล</option>
                      <option value="Mira">🎀 มิรา (Mira) - สดใส คาวาอี้ วัยรุ่น</option>
                      <option value="Elena">💼 เอเลน่า (Elena) - สุขุม มั่นใจ ผู้บริหาร</option>
                    </optgroup>
                    <optgroup label="👨 เสียงผู้ชาย (3 คาแรคเตอร์)">
                      <option value="Puck">👨 พัค (Puck) - สดใส ทะเล้น สนุก</option>
                      <option value="Fenrir">🐺 เฟนริล (Fenrir) - ทุ้มลึก เข้มขรึม หนักแน่น</option>
                      <option value="Charon">🎙️ คารอน (Charon) - สุขุม นิ่ง ชัดถ้อยชัดคำ</option>
                    </optgroup>
                    <optgroup label="🎙️ เสียงธรรมชาติ">
                      <option value="Zephyr">🎧 เซเฟอร์ (Zephyr) - ทันสมัย สบายๆ</option>
                    </optgroup>
                  </select>

                  {dialogues.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="ลบบทพูดนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={dlg.text}
                onChange={(e) => handleLineChange(idx, 'text', e.target.value)}
                placeholder={`พิมพ์บทพูดของ ${dlg.speaker}...`}
                rows={2}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed"
              />

              {/* Quick SFX Insertion Row */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500">แทรก SFX:</span>
                {[
                  { label: '👏 ปรบมือ', tag: '[SFX:ปรบมือ]' },
                  { label: '🔔 แจ้งเตือน', tag: '[SFX:แจ้งเตือน]' },
                  { label: '😂 หัวเราะ', tag: '[SFX:หัวเราะ]' },
                  { label: '🎉 ฉลอง', tag: '[SFX:ฉลอง]' },
                  { label: '💨 วู้ช', tag: '[SFX:วู้ช]' },
                ].map((sfx) => (
                  <button
                    key={sfx.tag}
                    type="button"
                    onClick={() => {
                      const cur = dlg.text ? `${dlg.text} ${sfx.tag}` : sfx.tag;
                      handleLineChange(idx, 'text', cur);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 transition-colors cursor-pointer"
                    title={`ใส่ ${sfx.tag}`}
                  >
                    {sfx.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
