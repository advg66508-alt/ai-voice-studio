import React, { useState } from 'react';
import { Code, Copy, Check, ExternalLink, X, Download, FileCode } from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'instructions'>('all');

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      const res = await fetch('/preview.html');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadFile = () => {
    const a = document.createElement('a');
    a.href = '/preview.html';
    a.download = 'ai-voiceover-studio-preview.html';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">โค้ด HTML, CSS และ JavaScript สำหรับนำไปใช้งานต่อ</h3>
              <p className="text-xs text-slate-400">ไฟล์แบบ Standalone รวมครบทุกฟังก์ชัน (เสียงชาย/หญิง 4 ภาค, ดนตรีพื้นหลัง, สปีด 3 ระดับ)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs & Quick Actions */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              โค้ดทั้งหมด (Single File)
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'instructions'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              วิธีนำไปติดตั้ง / รัน
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/preview.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิด Preview เต็มจอ</span>
            </a>

            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-cyan-500/30 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดไฟล์ .html</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกเรียบร้อย!' : 'คัดลอกโค้ดทั้งหมด'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs">
          {activeTab === 'all' ? (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-slate-300 font-sans text-xs flex items-start gap-2">
                <span className="text-amber-400 font-bold">💡</span>
                <span>
                  โค้ดนี้ถูกออกแบบให้เป็น <strong>Single-File Bundle (HTML + Tailwind CSS + Web Audio Synthesizer JS)</strong> สามารถบันทึกเป็นชื่อไฟล์ <code className="text-amber-300">index.html</code> แล้วดับเบิ้ลคลิกเปิดผ่านเบราว์เซอร์ Google Chrome, Edge หรือ Safari ได้ทันทีโดยไม่ต้องติดตั้ง node_modules เพิ่มเติม!
                </span>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 overflow-x-auto leading-relaxed select-all">
{`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Voiceover Studio - ห้องพากย์เสียง AI</title>
  <!-- Tailwind CSS CDN & Prompt Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-[#050811] text-slate-100 font-sans">
  <!-- กดปุ่ม 'คัดลอกโค้ดทั้งหมด' หรือ 'ดาวน์โหลดไฟล์ .html' ด้านบนเพื่อรับโค้ดสมบูรณ์กว่า 800 บรรทัดพร้อม Web Audio Synthesizer ในตัว -->
</body>
</html>`}
              </pre>
            </div>
          ) : (
            <div className="space-y-4 font-sans text-slate-300 text-xs leading-relaxed">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-amber-400 text-sm">วิธีที่ 1: ใช้งานแบบ Standalone (เปิดดูทันทีบนเครื่อง)</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li>กดปุ่ม <span className="text-cyan-300 font-semibold">ดาวน์โหลดไฟล์ .html</span> ด้านบน</li>
                  <li>ดับเบิ้ลคลิกเปิดไฟล์ <code className="text-amber-300">preview.html</code> ในเบราว์เซอร์ได้ทันที</li>
                  <li>ระบบมี Web Audio API สังเคราะห์เสียง SFX (ปรบมือ, แคชเชียร์, หัวเราะ) และ Ambient ในตัวพร้อมใช้งาน</li>
                </ol>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-cyan-400 text-sm">วิธีที่ 2: นำไปรันร่วมกับ Node.js / Express Backend (Gemini TTS API)</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li>วางไฟล์นี้ในโฟลเดอร์ <code className="text-amber-300">public/</code> หรือ <code className="text-amber-300">dist/</code> ของ Express server</li>
                  <li>ส่ง Request ไปยัง <code className="text-cyan-300">POST /api/tts/generate</code> พร้อมคีย์ Gemini API</li>
                  <li>ไฟล์จะแปลงเสียงพูดระดับสตูดิโอและมิกซ์ SFX ดาวน์โหลดออกมาเป็นไฟล์ .WAV ทันที</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
