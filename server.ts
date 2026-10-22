import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

// Server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Speed pacing descriptions
const speedPacingMap: Record<string, string> = {
  slow: 'Speak at a slow, calm, and deliberate pace with clear enunciation and thoughtful pauses.',
  normal: 'Speak at a natural, standard, balanced conversational pace.',
  fast: 'Speak at a fast, energetic, brisk, and lively pace without stuttering.',
};

// Voice persona mapping for Gemini API prebuilt voices (Central, Northern, Isan, Southern)
const voiceMapping: Record<string, { apiVoice: string; personaPrompt: string }> = {
  // 🏔️ Northern Voices (คำเมือง ล้านนา)
  Lanna_Female: {
    apiVoice: 'Kore',
    personaPrompt:
      'Native Northern Thai woman speaking authentically in sweet Lanna dialect (Kam Mueang / ภาษาเหนือ). Use melodic Northern Thai intonation, soft cadence, and authentic northern dialect vocabulary ending with "เจ้า" and "เน้อเจ้า". Never use Bangkok central Thai tone.',
  },
  Lanna_Male: {
    apiVoice: 'Charon',
    personaPrompt:
      'Native Northern Thai man speaking authentically in polite Lanna dialect (Kam Mueang / ภาษาเหนือ). Use calm, warm Northern Thai cadence and authentic northern dialect vocabulary ending with "กั๊บ" and "เน้อครับ". Never use Bangkok central Thai tone.',
  },

  // 🌾 Isan Voices (เว้าอีสาน)
  Isan_Female: {
    apiVoice: 'Kore',
    personaPrompt:
      'Native Isan woman speaking authentically in lively Northeastern Thai dialect (Isan / ภาษาอีสาน). Use melodic, joyful Isan rhythm and vocabulary ending with "เด้อจ้า" and "จ้า". Never use Bangkok central Thai tone.',
  },
  Isan_Male: {
    apiVoice: 'Puck',
    personaPrompt:
      'Native Isan man speaking authentically in festive, witty Northeastern Thai dialect (Isan / ภาษาอีสาน). Use enthusiastic, upbeat Isan cadence and vocabulary ending with "เด้อครับ" and "เด้อ". Never use Bangkok central Thai tone.',
  },

  // 🌊 Southern Voices (แหลงใต้)
  Southern_Female: {
    apiVoice: 'Zephyr',
    personaPrompt:
      'Native Southern Thai woman speaking authentically in punchy, lively Pak Tai dialect (ภาษาใต้). Use rapid, rhythmic southern cadence and authentic southern vocabulary ending with "นิ" and "จังหู้". Never use Bangkok central Thai tone.',
  },
  Southern_Male: {
    apiVoice: 'Fenrir',
    personaPrompt:
      'Native Southern Thai man speaking authentically in assertive, deep Pak Tai dialect (ภาษาใต้). Use punchy, crisp southern intonation and authentic southern vocabulary ending with "คับพี่น้อง" and "นิ". Never use Bangkok central Thai tone.',
  },

  // 🏛️ Central Thai Voices
  Kore: {
    apiVoice: 'Kore',
    personaPrompt: 'Warm, gentle, melodic, comforting, pleasant Central Thai female voice',
  },
  Mira: {
    apiVoice: 'Kore',
    personaPrompt: 'Youthful, bright, cheerful, energetic, cute, bubbly young Thai female voice',
  },
  Elena: {
    apiVoice: 'Zephyr',
    personaPrompt: 'Sophisticated, confident, articulate, authoritative, professional Thai corporate businesswoman voice',
  },
  Puck: {
    apiVoice: 'Puck',
    personaPrompt: 'Energetic, lively, youthful, cheerful, playful Thai male voice',
  },
  Fenrir: {
    apiVoice: 'Fenrir',
    personaPrompt: 'Deep, dramatic, powerful, resonant, intense Thai male voice',
  },
  Charon: {
    apiVoice: 'Charon',
    personaPrompt: 'Calm, authoritative, clear, articulate, professional Thai male news anchor voice',
  },
  Zephyr: {
    apiVoice: 'Zephyr',
    personaPrompt: 'Modern, balanced, natural, relaxed conversational Thai voice',
  },
};

// 1. Text-to-Speech Endpoint
app.post('/api/tts/generate', async (req, res) => {
  try {
    const {
      text,
      voiceName = 'Kore',
      speed = 'normal',
      style = 'Clear and engaging narration',
      isMultiSpeaker = false,
      speakers = [],
    } = req.body;

    if (!text && (!speakers || speakers.length === 0)) {
      res.status(400).json({ error: 'ข้อความสำหรับพากย์ต้องไม่ว่างเปล่า (Text is required)' });
      return;
    }

    const pacingInstruction = speedPacingMap[speed] || speedPacingMap.normal;
    const voiceMeta = voiceMapping[voiceName] || voiceMapping.Kore;
    const combinedStyle = `${voiceMeta.personaPrompt}. ${style}. ${pacingInstruction}`;

    // Check if multi-speaker dialogue mode is requested
    if (isMultiSpeaker && Array.isArray(speakers) && speakers.length >= 2) {
      const spk1 = speakers[0];
      const spk2 = speakers[1];
      const spk1Meta = voiceMapping[spk1.voiceName] || voiceMapping.Puck;
      const spk2Meta = voiceMapping[spk2.voiceName] || voiceMapping.Kore;

      const parts = speakers.map((spk) => {
        const meta = voiceMapping[spk.voiceName] || voiceMapping.Kore;
        const cleanSpkText = (spk.text || '')
          .replace(/\[SFX:[^\]]+\]/gi, ' ')
          .replace(/<laugh>/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        return {
          text: `${spk.speaker}: ${cleanSpkText}`,
          speechMetadata: {
            speaker: spk.speaker,
            style: `${meta.personaPrompt}. ${spk.style || style}. ${pacingInstruction}`,
          },
        };
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: spk1.speaker,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: spk1Meta.apiVoice },
                  },
                },
                {
                  speaker: spk2.speaker,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: spk2Meta.apiVoice },
                  },
                },
              ],
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('ไม่ได้รับข้อมูลเสียงจากแบบจำลอง Gemini');
      }

      res.json({
        success: true,
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        modelUsed: 'gemini-3.8-flash-tts',
      });
      return;
    }

    // Single-Speaker mode: try primary gemini-3.8-flash-tts then lite
    const cleanSingleText = (text || '')
      .replace(/\[SFX:[^\]]+\]/gi, ' ')
      .replace(/<laugh>/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    let response;
    let modelUsed = 'gemini-3.8-flash-tts';

    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanSingleText || 'สวัสดีครับ',
                speechMetadata: {
                  style: combinedStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceMeta.apiVoice },
            },
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn('Primary TTS model attempt note:', primaryErr?.message);
      // Try lite TTS model if primary failed
      modelUsed = 'gemini-3.8-flash-lite-tts';
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanSingleText || 'สวัสดีครับ',
                speechMetadata: {
                  style: combinedStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceMeta.apiVoice },
            },
          },
        },
      });
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('ไม่ได้รับข้อมูลเสียงจากแบบจำลอง Gemini');
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    const errStr = String(error?.message || error?.details || error || '');
    const isQuotaExceeded =
      errStr.includes('429') ||
      errStr.includes('quota') ||
      errStr.includes('Quota') ||
      errStr.includes('RESOURCE_EXHAUSTED') ||
      error?.status === 'RESOURCE_EXHAUSTED';

    if (isQuotaExceeded) {
      // Gracefully communicate quota limit and instruct client to use high-quality local speech synthesizer
      res.json({
        success: false,
        quotaExceeded: true,
        fallback: true,
        message:
          'โควตา Gemini TTS รายวันเต็ม (Free Tier จำกัด 10 ครั้ง/วัน) — ระบบสลับมาใช้ High-Speed Speech Synthesizer ในเครื่องให้โดยอัตโนมัติ คุณยังสามารถมิกซ์เพลง ดาวน์โหลด และพากย์ 4 ภาคได้สมบูรณ์แบบ!',
      });
      return;
    }

    res.status(500).json({
      error: error?.message || 'เกิดข้อผิดพลาดในการสร้างเสียงพากย์',
      details: error?.toString(),
    });
  }
});

// 2. Intelligent Regional Dialect Translation Endpoint (Central -> North / Isan / South)
app.post('/api/dialect/translate', async (req, res) => {
  try {
    const {
      text,
      targetRegion = 'northern', // 'northern' | 'isan' | 'southern' | 'central'
      gender = 'female', // 'male' | 'female'
    } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Text is required for translation' });
      return;
    }

    if (targetRegion === 'central') {
      res.json({
        success: true,
        translatedText: text,
        region: 'central',
      });
      return;
    }

    const regionNames: Record<string, string> = {
      northern: 'ภาษาเหนือ (คำเมือง ล้านนา)',
      isan: 'ภาษาอีสาน (เว้าอีสาน)',
      southern: 'ภาษาใต้ (แหลงใต้)',
    };

    const politeRules: Record<string, { male: string; female: string }> = {
      northern: {
        male: 'ลงท้ายด้วย กั๊บ, เน้อครับ, ครับผม และใช้คำเมืองแท้ เช่น ลำขนาด, บ่เป็นหยัง, กึดเติงหา',
        female: 'ลงท้ายด้วย เจ้า, เน้อเจ้า และใช้คำเมืองแท้ เช่น ลำแต้ๆ, บ่เป็นหยังเน้อเจ้า, งามขนาด',
      },
      isan: {
        male: 'ลงท้ายด้วย เด้อครับ, เด้อ, น้อ และใช้คำอีสานแท้ เช่น แซ่บหลาย, บ่เป็นหยัง, คึดฮอด',
        female: 'ลงท้ายด้วย เด้อจ้า, จ้า, แหน่เด้อ และใช้คำอีสานแท้ เช่น แซ่บหลาย, ตาฮัก, มื้อนี้',
      },
      southern: {
        male: 'ลงท้ายด้วย นิ, คับพี่น้อง, เหอ และใช้คำใต้แท้ เช่น หรอยจังหู้, หม้ายพรือ, แหลง, แล',
        female: 'ลงท้ายด้วย นิ, น้องเหอ, จังหู้ และใช้คำใต้แท้ เช่น หรอยจังหู้, งามจังหู้, ไม่พรือน้องเหอ',
      },
    };

    const rule = politeRules[targetRegion] || politeRules.northern;
    const genderRule = gender === 'female' ? rule.female : rule.male;

    const prompt = `คุณคือผู้เชี่ยวชาญภาษาถิ่นไทยทุกภาค (ล้านนา, อีสาน, ปักษ์ใต้)
กรุณาแปลงบทพูดภาษากลางต่อไปนี้ ให้เป็น "${regionNames[targetRegion]}" ที่เป็นธรรมชาติ สละสลวย ไพเราะ และถูกต้องตามหลักสำเนียงถิ่นของคนท้องถิ่นแท้ๆ

ผู้พูด: เพศ${gender === 'female' ? 'หญิง' : 'ชาย'}
กฎการใช้คำและคำลงท้าย: ${genderRule}

ข้อกำหนดสำคัญ:
1. รักษาแท็กเสียงเอฟเฟกต์ [SFX:...] ไว้ทุกจุดตามเดิม ห้ามลบหรือแก้ไขแท็ก [SFX:...]
2. เปลี่ยนคำศัพท์ภาษากลางให้เป็นคำถิ่นที่แท้จริงและเป็นธรรมชาติ เช่น
   - อร่อย -> เหนือ: ลำ / อีสาน: แซ่บ / ใต้: หรอย
   - มาก -> เหนือ: ขนาด, แต้ๆ / อีสาน: หลาย, คัก / ใต้: จังหู้, อย่างแรง
   - ไม่เป็นไร -> เหนือ: บ่เป็นหยัง / อีสาน: บ่เป็นหยังดอก / ใต้: หม้ายพรือ
   - ทำไม -> เหนือ: ยะหยัง / อีสาน: เป็นหยัง / ใต้: ไซร
   - ไปไหนมา -> เหนือ: ไปตางไดมา / อีสาน: ไปไสมา / ใต้: ไปไหนมานิ
3. ให้บทพูดออกมามีจังหวะและสำเนียงเสมือนคนท้องถิ่นพูดจริงๆ

ข้อความภาษากลางต้นฉบับ:
"""${text}"""

กรุณาตอบเป็น JSON รูปแบบนี้เท่านั้น:
{
  "translatedText": "บทพูดภาษาถิ่นที่แปลงแล้วพร้อมใช้",
  "explanation": "คำอธิบายสั้นๆ เกี่ยวกับคำศัพท์ถิ่นเด่นๆ ที่นำมาใช้",
  "targetRegion": "${targetRegion}"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      translatedText: parsed.translatedText || text,
      explanation: parsed.explanation || '',
      targetRegion,
    });
  } catch (err: any) {
    console.error('Dialect translation error:', err);
    // Local fallback is handled smoothly
    res.status(500).json({
      error: err?.message || 'Translation failed',
      fallbackRequired: true,
    });
  }
});

// 2. AI Voiceover Script Generator
app.post('/api/script/ai-generate', async (req, res) => {
  try {
    const {
      topic = 'แนะนำเครื่องดื่มกาแฟสดพรีเมียม',
      type = 'commercial', // commercial, documentary, movie, story, review, news
      tone = 'น่าตื่นเต้นและเป็นมิตร',
      targetDuration = '30s', // 15s, 30s, 60s
      language = 'th',
    } = req.body;

    const prompt = `คุณคือนักเขียนบทและนักพากย์มืออาชีพระดับท็อป
กรุณาเขียนบทพากย์เสียง (Voiceover Script) ภาษาไทย สำหรับ:
- หัวข้อ: ${topic}
- ประเภทงาน: ${type}
- โทนเสียง/อารมณ์: ${tone}
- ความยาวเป้าหมาย: ประมาณ ${targetDuration}

ข้อกำหนด:
1. เขียนบทที่เมื่ออ่านออกเสียงแล้วเป็นธรรมชาติ จังหวะกระชับ น่าดึงดูดใจ
2. ใส่คำแนะนำจังหวะหรืออารมณ์ในวงเล็บ เช่น (น้ำเสียงตื่นเต้น), (เว้นจังหวะ 1 วินาที), (เน้นเสียง)
3. ให้บทพูดหลักที่พร้อมนำไปคัดลอกพากย์ได้ทันที
4. ระบุการประเมินจำนวนคำและเวลาในการพูดโดยประมาณ

กรุณาตอบเป็น JSON รูปแบบนี้เท่านั้น:
{
  "title": "ชื่อบทพากย์",
  "script": "ข้อความบทพากย์ทั้งหมดที่พร้อมใช้อ่านออกเสียง",
  "cleanText": "เฉพาะข้อความบทพูดล้วนๆ โดยตัดคำกำกับในวงเล็บออกเพื่อนำไปแปลงเป็นเสียงพากย์ได้ทันที",
  "estimatedDuration": "30 วินาที",
  "tips": "คำแนะนำเพิ่มเติมสำหรับการพากย์ให้อารมณ์สมจริง"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { script: rawText, cleanText: rawText };
    }

    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Error generating script:', error);
    res.status(500).json({
      error: error?.message || 'เกิดข้อผิดพลาดในการสร้างบทพากย์',
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AI Voiceover Studio running on port ${port}`);
  });
}

startServer();
