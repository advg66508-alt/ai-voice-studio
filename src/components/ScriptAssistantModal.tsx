import React, { useState } from 'react';
import { Sparkles, X, Wand2, Clock, Check, FileText } from 'lucide-react';

interface ScriptAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScript: (scriptText: string, suggestedTitle: string) => void;
}

export const ScriptAssistantModal: React.FC<ScriptAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyScript,
}) => {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('commercial');
  const [tone, setTone] = useState('น่าตื่นเต้นและเป็นมิตร');
  const [targetDuration, setTargetDuration] = useState('30s');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    title: string;
    script: string;
    cleanText: string;
    estimatedDuration: string;
    tips: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('กรุณาระบุหัวข้อหรือสินค้าที่ต้องการให้เขียนบทพากย์');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/script/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          type,
          tone,
          targetDuration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'สร้างบทพากย์ไม่สำเร็จ');
      }

      setGeneratedResult(data);
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseThis = () => {
    if (generatedResult) {
      onApplyScript(generatedResult.cleanText || generatedResult.script, generatedResult.title);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-lg">AI เขียนบทพากย์เสียงอัตโนมัติ</h2>
              <p className="text-xs text-slate-400">
                เขียนสคริปต์โฆษณา ตัวอย่างหนัง รีวิว หรือเรื่องเล่า ให้เข้ากับจังหวะการพากย์
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              หัวข้อ / สินค้า / เรื่องราวที่ต้องการพากย์
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="เช่น โปรโมชั่นบุฟเฟต์ชาบูลด 50%, แนะนำคอนโดติดรถไฟฟ้า, ตัวอย่างหนังสยองขวัญ"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Type & Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ประเภทงาน
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="commercial">สปอตโฆษณา / ขายของ</option>
                <option value="beauty-review">รีวิวบิวตี้ / เครื่องสำอาง / สกินแคร์ (สไตล์ผู้หญิง)</option>
                <option value="female-live">แม่ค้าไลฟ์สด / ป้ายยา TikTok (สไตล์ผู้หญิง)</option>
                <option value="movie">ตัวอย่างภาพยนตร์ (Trailer)</option>
                <option value="documentary">สารคดี / บทบรรยาย</option>
                <option value="review">รีวิวสั้น (TikTok / Reels)</option>
                <option value="story">นิทาน / เรื่องเล่า</option>
                <option value="news">รายงานข่าว / บทความ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                อารมณ์ / โทนเสียง
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="สาวหวาน อ่อนโยน ละมุน">สาวหวาน อ่อนโยน ละมุน (ผู้หญิง)</option>
                <option value="สาวมั่น ทันสมัย บิวตี้แฟชั่น">สาวมั่น ทันสมัย บิวตี้แฟชั่น (ผู้หญิง)</option>
                <option value="สาวสดใส คาวาอี้ อนิเมะ">สาวสดใส คาวาอี้ อนิเมะ (ผู้หญิง)</option>
                <option value="คุณแม่อบอุ่น ห่วงใย นุ่มลึก">คุณแม่อบอุ่น ห่วงใย นุ่มลึก (ผู้หญิง)</option>
                <option value="แม่ค้าไลฟ์สด ตื่นเต้น ไฟลุก">แม่ค้าไลฟ์สด ตื่นเต้น ไฟลุก (ผู้หญิง)</option>
                <option value="น่าตื่นเต้น สดใส มีพลัง">น่าตื่นเต้น สดใส มีพลัง</option>
                <option value="สุขุม นุ่มลึก น่าเชื่อถือ">สุขุม นุ่มลึก น่าเชื่อถือ</option>
                <option value="ดุดัน ระทึกขวัญ ดึงอารมณ์">ดุดัน ระทึกขวัญ ดึงอารมณ์</option>
                <option value="ผ่อนคลาย อ่อนโยน สงบ">ผ่อนคลาย อ่อนโยน สงบ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ความยาวเป้าหมาย
              </label>
              <select
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="15 วินาที (สั้นกระชับ)">15 วินาที (สั้นกระชับ)</option>
                <option value="30 วินาที (มาตรฐาน)">30 วินาที (มาตรฐาน)</option>
                <option value="60 วินาที (เรื่องราวยาว)">60 วินาที (เรื่องราวยาว)</option>
              </select>
            </div>
          </div>

          {/* Quick presets for topic */}
          <div>
            <span className="text-[11px] text-slate-500 block mb-1">หรือเลือกหัวข้อยอดนิยม:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'โฆษณาโปรตีนพืชสำหรับคนรักสุขภาพ',
                'เปิดตัวแอปรถส่งอาหารเจ้าใหม่ลด 70%',
                'ตัวอย่างหนังสืบสวนไขคดีปริศนา',
                'แนะนำเกาะลึกลับในสารคดีทะเลไทย',
              ].map((example, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTopic(example)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  + {example}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Action button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>กำลังร่างบทพากย์ด้วย Gemini...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>สร้างบทพากย์ AI ทันที</span>
              </>
            )}
          </button>

          {/* Result View */}
          {generatedResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 text-sm">
                  {generatedResult.title}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {generatedResult.estimatedDuration}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-sans">
                {generatedResult.cleanText || generatedResult.script}
              </div>

              {generatedResult.tips && (
                <p className="text-[11px] text-slate-400 italic">
                  💡 คำแนะนำการพากย์: {generatedResult.tips}
                </p>
              )}

              <button
                type="button"
                onClick={handleUseThis}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>นำบทนี้ไปใส่ในห้องพากย์เสียง</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
