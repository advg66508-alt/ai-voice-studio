import express from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { translateCentralToDialect } from './src/utils/dialectTranslator.js';
import type { GenderType, RegionType } from './src/types/voice.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isVercel = Boolean(process.env.VERCEL);

app.use(express.json({ limit: '25mb' }));

// Resilient Server-side Gemini client (never throws or fails when GEMINI_API_KEY is unset on Vercel)
let cachedAiClient: GoogleGenAI | null = null;
let cachedApiKeyValue = '';

function resolveGeminiApiKey(): string {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.API_KEY,
  ];
  for (const raw of candidates) {
    const trimmed = (raw || '').trim();
    if (trimmed && trimmed !== 'MY_GEMINI_API_KEY' && trimmed !== 'YOUR_API_KEY') {
      return trimmed;
    }
  }
  return '';
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    return null;
  }
  if (!cachedAiClient || cachedApiKeyValue !== apiKey) {
    cachedApiKeyValue = apiKey;
    cachedAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label = 'Timeout'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} (${timeoutMs}ms)`)), timeoutMs);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Splits Thai text into safe natural phrase chunks (<= 170 chars) without breaking Thai combining marks or leading vowels
 */
function splitThaiTextIntoChunks(rawText: string, maxChars = 170): string[] {
  const normalized = (rawText || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return ['สวัสดีค่ะ'];
  if (normalized.length <= maxChars) return [normalized];

  const rawTokens = normalized.split(/(?<=[.!?;,|])\s+|\s+/);
  const chunks: string[] = [];
  let current = '';

  const isCombiningThai = (ch: string) => /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(ch);
  const isLeadingThaiVowel = (ch: string) => /[\u0E40-\u0E44]/.test(ch);

  const pushLongToken = (token: string) => {
    let start = 0;
    while (start < token.length) {
      let end = Math.min(token.length, start + maxChars);
      if (end < token.length) {
        while (end > start + 20 && isCombiningThai(token[end])) {
          end--;
        }
        while (end > start + 20 && isLeadingThaiVowel(token[end - 1])) {
          end--;
        }
      }
      const slice = token.slice(start, end).trim();
      if (slice) chunks.push(slice);
      start = end;
    }
  };

  for (const token of rawTokens) {
    if (!token) continue;
    if (!current) {
      if (token.length <= maxChars) {
        current = token;
      } else {
        pushLongToken(token);
      }
    } else if (current.length + 1 + token.length <= maxChars) {
      current = `${current} ${token}`;
    } else {
      chunks.push(current);
      if (token.length <= maxChars) {
        current = token;
      } else {
        current = '';
        pushLongToken(token);
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : ['สวัสดีค่ะ'];
}

/**
 * Keyless Automatic Fallback Thai TTS Engine (Vercel-Safe with strict fetch timeouts)
 */
async function fetchFallbackThaiSpeechMp3(spokenText: string): Promise<Buffer> {
  const chunks = splitThaiTextIntoChunks(spokenText, 170);
  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    const encoded = encodeURIComponent(chunk);
    const urls = [
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=th&client=tw-ob&q=${encoded}`,
      `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=th&client=gtx&q=${encoded}`,
    ];

    let chunkBuf: Buffer | null = null;
    let lastErr: unknown = null;

    for (const url of urls) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Referer: 'https://translate.google.com/',
          },
        });
        if (res.ok) {
          const arr = await res.arrayBuffer();
          if (arr.byteLength > 128) {
            chunkBuf = Buffer.from(arr);
            clearTimeout(timeoutId);
            break;
          }
        }
      } catch (err) {
        lastErr = err;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!chunkBuf) {
      throw lastErr instanceof Error ? lastErr : new Error('Fallback TTS network unavailable');
    }
    buffers.push(chunkBuf);
  }

  return Buffer.concat(buffers);
}

/**
 * Ensures any PCM or WAV buffer returned by Gemini TTS has a valid 44-byte RIFF WAVE header
 */
function ensureWavBuffer(rawBuffer: Buffer, mimeType?: string, defaultSampleRate = 24000): Buffer {
  if (
    rawBuffer.length >= 44 &&
    rawBuffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    rawBuffer.subarray(8, 12).toString('ascii') === 'WAVE'
  ) {
    return rawBuffer;
  }

  let sampleRate = defaultSampleRate;
  if (mimeType) {
    const rateMatch = mimeType.match(/rate=(\d+)/i);
    if (rateMatch) {
      sampleRate = parseInt(rateMatch[1], 10) || defaultSampleRate;
    }
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = rawBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, rawBuffer]);
}

const speedPacingMap: Record<string, string> = {
  slow: 'Deliver with calm, unhurried, clear enunciation and natural pauses.',
  normal: 'Deliver at a natural, balanced, engaging conversational rhythm.',
  fast: 'Deliver with brisk, lively, energetic momentum without slurring.',
};

interface VoicePersonaMeta {
  apiVoice: string;
  gender: GenderType | 'neutral';
  region: RegionType;
  dialectLabel: string;
  personaPrompt: string;
  dialectRewriteRule?: string;
  fallbackPitch: number;
  fallbackCadence: number;
}

const voiceMapping: Record<string, VoicePersonaMeta> = {
  // ภาคเหนือ (คำเมือง ล้านนา)
  Lanna_Female: {
    apiVoice: 'Leda',
    gender: 'female',
    region: 'northern',
    dialectLabel: 'ภาคเหนือ · คำเมือง (หญิง)',
    fallbackPitch: 1.06,
    fallbackCadence: 0.91,
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Northern Thai woman from Chiang Mai speaking genuine Kam Mueang / Lanna dialect (สาวเหนืออู้กำเมืองแท้ๆ). Speak with sweet, soft, melodic Northern Thai tonal contours and gentle vowel endings with "เจ้า" / "เน้อเจ้า". Strictly avoid flat Central Bangkok Thai intonation.',
    dialectRewriteRule: `แปลงเป็นภาษาพูดอู้กำเมืองของสาวเหนือเชียงใหม่แท้ๆ เช่น สวัสดีค่ะ->สวัสดีเจ้า, อร่อยมาก->ลำขนาด, พูด->อู้, ดู->ผ่อ, ทำ->ยะ, ไม่->บ่, จริงๆ->แต้ๆ, กิน->กิ๋น, ให้->ฮื้อ, ด้วยกัน->โตยกั๋น ลงท้ายด้วย เจ้า / เน้อเจ้า แทน ค่ะ/นะคะ/ครับ ทุกจุด`,
  },
  Lanna_Male: {
    apiVoice: 'Charon',
    gender: 'male',
    region: 'northern',
    dialectLabel: 'ภาคเหนือ · คำเมือง (ชาย)',
    fallbackPitch: 0.79,
    fallbackCadence: 0.92,
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Northern Thai man from Chiang Mai speaking genuine Kam Mueang / Lanna dialect (บ่าวเหนืออู้กำเมืองแท้ๆ). Speak with warm, polite, melodic Northern Thai cadence ending with "กั๊บ" / "เน้อครับ".',
    dialectRewriteRule: `แปลงเป็นภาษาพูดอู้กำเมืองของป้อจายคนเหนือล้านนาแท้ๆ เช่น สวัสดีครับ->สุมาเต๊อะกั๊บ, ผม->อ้าย, อร่อยมาก->ลำขนาด, พูด->อู้, ดู->ผ่อ, ทำ->ยะ, ไม่->บ่, ให้->ฮื้อ ลงท้ายด้วย กั๊บ / เน้อกั๊บ แทน ครับ/ค่ะ ทุกจุด`,
  },

  // ภาคอีสาน (เว้าอีสาน)
  Isan_Female: {
    apiVoice: 'Aoede',
    gender: 'female',
    region: 'isan',
    dialectLabel: 'ภาคอีสาน · เว้าอีสาน (หญิง)',
    fallbackPitch: 1.05,
    fallbackCadence: 1.06,
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Northeastern Thai (Isan) woman speaking genuine Isan dialect (สาวอีสานเว้าอีสานแท้ๆ). Speak with lively, cheerful, musical Isan tonal inflection ending with "เด้อจ้า" / "จ้า".',
    dialectRewriteRule: `แปลงเป็นภาษาพูดเว้าอีสานของสาวอีสานแท้ๆ เช่น สวัสดีค่ะ->สะบายดีเด้อจ้าพี่น้อง, อร่อยมาก->แซ่บหลาย, จริงๆ->อีหลี, พูด->เว้า, ดู->เบิ่ง, ทำ->เฮ็ด, จะ->สิ, ไม่->บ่, ด้วยกัน->นำกัน, รีบ->ฟ้าว ลงท้ายด้วย เด้อจ้า / จ้า แทน ค่ะ/นะคะ/ครับ ทุกจุด`,
  },
  Isan_Male: {
    apiVoice: 'Puck',
    gender: 'male',
    region: 'isan',
    dialectLabel: 'ภาคอีสาน · เว้าอีสาน (ชาย)',
    fallbackPitch: 0.8,
    fallbackCadence: 1.06,
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Northeastern Thai (Isan) man speaking genuine Isan dialect (บ่าวอีสานเว้าอีสานแท้ๆ). Speak with upbeat, jovial, rhythmic Isan tonal lilt ending with "เด้อครับ" / "เด้อพี่น้อง".',
    dialectRewriteRule: `แปลงเป็นภาษาพูดเว้าอีสานของบ่าวอีสานแท้ๆ เช่น สวัสดีครับ->สะบายดีเด้อครับพี่น้อง, ผม->อ้าย, อร่อยมาก->แซ่บหลายคักอีหลี, พูด->เว้า, ดู->เบิ่ง, ทำ->เฮ็ด, จะ->สิ, ไม่->บ่, ด้วยกัน->นำกัน ลงท้ายด้วย เด้อครับ / เด้อครับพี่น้อง แทน ครับ/ค่ะ ทุกจุด`,
  },

  // ภาคใต้ (แหลงใต้)
  Southern_Female: {
    apiVoice: 'Aoede',
    gender: 'female',
    region: 'southern',
    dialectLabel: 'ภาคใต้ · แหลงใต้ (หญิง)',
    fallbackPitch: 1.04,
    fallbackCadence: 1.13,
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Southern Thai woman from Nakhon Si Thammarat / Songkhla speaking real Pak Tai dialect (สาวใต้แหลงใต้แท้ๆ). Speak with brisk, punchy, crisp Southern Thai tonal jumps and clipped initial syllables ending with "นิ", "พี่น้องเหอ", "ตะน้องเหอ".',
    dialectRewriteRule: `แปลงเป็นภาษาพูดแหลงใต้แท้ๆ ของสาวใต้ กระชับ ฉะฉาน เช่น สวัสดีค่ะ->หวัดดีค่ะพี่น้องเหอ, อร่อยมาก->หรอยจังหู้, จริงๆ->อย่างแรง, พูด->แหลง, ดู/ลองดู->แล/ลองแลตะ, ไม่รู้->ไม่โร้, ไม่เป็นไร->หม้ายพรือ, ตลาด->หลาด, กลับบ้าน->หลบเริน ลงท้ายด้วย นิ / นิค่ะ / ตะน้องเหอ แทน ค่ะ/นะคะ/ครับ ทุกจุด`,
  },
  Southern_Male: {
    apiVoice: 'Fenrir',
    gender: 'male',
    region: 'southern',
    dialectLabel: 'ภาคใต้ · แหลงใต้ (ชาย)',
    fallbackPitch: 0.76,
    fallbackCadence: 1.12,
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Southern Thai man speaking real Pak Tai dialect (พี่บ่าวหลวงแหลงใต้แท้ๆ). Speak with bold, punchy, rapid Southern Thai intonation ending with "นิ", "คับพี่น้อง", "ตะพี่น้อง".',
    dialectRewriteRule: `แปลงเป็นภาษาพูดแหลงใต้แท้ๆ ของพี่บ่าวปักษ์ใต้ กระชับ หนักแน่น เช่น สวัสดีครับ->หวัดดีคับพี่น้อง, อร่อยมาก->หรอยจังหู้, จริงๆ->อย่างแรง, พูด->แหลง, ดู->แล, ไม่รู้->ไม่โร้, ไม่เป็นไร->หม้ายพรือ ลงท้ายด้วย นิ / คับพี่น้อง / ตะพี่น้อง แทน ครับ/ค่ะ ทุกจุด`,
  },

  // ภาคกลาง (ภาษากลางมาตรฐาน)
  Kore: {
    apiVoice: 'Kore',
    gender: 'female',
    region: 'central',
    dialectLabel: 'ภาคกลาง · มาตรฐาน (หญิง)',
    fallbackPitch: 1.0,
    fallbackCadence: 1.0,
    personaPrompt: 'Warm, gentle, melodic, clear standard Central Thai female voice',
  },
  Mira: {
    apiVoice: 'Leda',
    gender: 'female',
    region: 'central',
    dialectLabel: 'ภาคกลาง · สดใส (หญิง)',
    fallbackPitch: 1.08,
    fallbackCadence: 1.05,
    personaPrompt: 'Youthful, bright, cheerful, energetic young Central Thai female voice',
  },
  Elena: {
    apiVoice: 'Zephyr',
    gender: 'female',
    region: 'central',
    dialectLabel: 'ภาคกลาง · มืออาชีพ (หญิง)',
    fallbackPitch: 0.96,
    fallbackCadence: 0.99,
    personaPrompt: 'Confident, articulate, professional Central Thai female voice',
  },
  Puck: {
    apiVoice: 'Puck',
    gender: 'male',
    region: 'central',
    dialectLabel: 'ภาคกลาง · สดใสมีพลัง (ชาย)',
    fallbackPitch: 0.81,
    fallbackCadence: 1.04,
    personaPrompt: 'Energetic, lively, engaging Central Thai male voice',
  },
  Charon: {
    apiVoice: 'Charon',
    gender: 'male',
    region: 'central',
    dialectLabel: 'ภาคกลาง · สุขุมน่าเชื่อถือ (ชาย)',
    fallbackPitch: 0.77,
    fallbackCadence: 0.98,
    personaPrompt: 'Calm, authoritative, clear professional Central Thai male voice',
  },
  Fenrir: {
    apiVoice: 'Fenrir',
    gender: 'male',
    region: 'central',
    dialectLabel: 'ภาคกลาง · ทุ้มลึกทรงพลัง (ชาย)',
    fallbackPitch: 0.73,
    fallbackCadence: 0.94,
    personaPrompt: 'Deep, dramatic, powerful resonant Central Thai male voice',
  },
  Zephyr: {
    apiVoice: 'Zephyr',
    gender: 'neutral',
    region: 'central',
    dialectLabel: 'ภาคกลาง · ธรรมชาติ',
    fallbackPitch: 0.92,
    fallbackCadence: 1.0,
    personaPrompt: 'Modern, balanced, natural conversational Central Thai voice',
  },
};

function resolveVoiceKey(
  voiceName?: string,
  region?: RegionType,
  gender?: GenderType
): string {
  if (voiceName && voiceMapping[voiceName]) {
    return voiceName;
  }
  const r = region || 'central';
  const g = gender || 'female';
  if (r === 'northern') return g === 'male' ? 'Lanna_Male' : 'Lanna_Female';
  if (r === 'isan') return g === 'male' ? 'Isan_Male' : 'Isan_Female';
  if (r === 'southern') return g === 'male' ? 'Southern_Male' : 'Southern_Female';
  return g === 'male' ? 'Puck' : 'Kore';
}

function buildCombinedVoiceStyle(
  voiceMeta: VoicePersonaMeta,
  rawUserStyle: string | undefined,
  pacingInstruction: string
): string {
  let cleanStyle = (rawUserStyle || '').trim();
  if (voiceMeta.gender === 'male' && cleanStyle) {
    cleanStyle = cleanStyle
      .replace(/\byoung Thai woman\b/gi, 'Thai man')
      .replace(/\bThai woman\b/gi, 'Thai man')
      .replace(/\bbusinesswoman\b/gi, 'businessman')
      .replace(/\bwoman\b/gi, 'man')
      .replace(/\bfemale\b/gi, 'male')
      .replace(/\bgirl\b/gi, 'guy');
  }

  if (voiceMeta.region !== 'central') {
    return cleanStyle
      ? `${voiceMeta.personaPrompt} EMOTIONAL TONE: ${cleanStyle}. PACING: ${pacingInstruction}`
      : `${voiceMeta.personaPrompt} PACING: ${pacingInstruction}`;
  }

  return cleanStyle
    ? `${cleanStyle}. ${voiceMeta.personaPrompt}. ${pacingInstruction}`
    : `${voiceMeta.personaPrompt}. ${pacingInstruction}`;
}

const dialectAdaptationCache = new Map<string, string>();

async function adaptScriptToVoiceDialect(
  rawText: string,
  voiceKey: string,
  autoTranslate = true
): Promise<{ spokenText: string; wasAdapted: boolean }> {
  const trimmed = rawText.trim();
  if (!trimmed) return { spokenText: trimmed, wasAdapted: false };

  const meta = voiceMapping[voiceKey] || voiceMapping.Kore;

  if (meta.region === 'central') {
    if (!autoTranslate || meta.gender === 'neutral') {
      return { spokenText: trimmed, wasAdapted: false };
    }
    const harmonized = translateCentralToDialect(trimmed, 'central', meta.gender).translatedText;
    return { spokenText: harmonized, wasAdapted: harmonized !== trimmed };
  }

  const localDictResult = translateCentralToDialect(trimmed, meta.region, meta.gender);

  if (!autoTranslate) {
    let particleAdjusted = trimmed;
    if (meta.gender === 'female') {
      if (meta.region === 'southern')
        particleAdjusted = particleAdjusted.replace(/นะครับ/g, 'ตะน้องเหอ').replace(/ครับ/g, 'นิค่ะ');
      if (meta.region === 'northern')
        particleAdjusted = particleAdjusted.replace(/นะครับ/g, 'เน้อเจ้า').replace(/ครับ/g, 'เจ้า');
      if (meta.region === 'isan')
        particleAdjusted = particleAdjusted.replace(/นะครับ/g, 'เด้อจ้า').replace(/ครับ/g, 'เด้อจ้า');
    } else if (meta.gender === 'male') {
      if (meta.region === 'southern')
        particleAdjusted = particleAdjusted.replace(/นะคะ|ค่ะ|คะ/g, 'คับพี่น้อง');
      if (meta.region === 'northern')
        particleAdjusted = particleAdjusted.replace(/นะคะ|ค่ะ|คะ/g, 'เน้อกั๊บ');
      if (meta.region === 'isan')
        particleAdjusted = particleAdjusted.replace(/นะคะ|ค่ะ|คะ/g, 'เด้อครับ');
    }
    return { spokenText: particleAdjusted, wasAdapted: particleAdjusted !== trimmed };
  }

  const cacheKey = `${voiceKey}::${trimmed}`;
  const cached = dialectAdaptationCache.get(cacheKey);
  if (cached) {
    return { spokenText: cached, wasAdapted: cached !== trimmed };
  }

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `คุณคือนักพากย์เจ้าของภาษาท้องถิ่นสำหรับ "${meta.dialectLabel}"
แปลงบทพูดด้านล่างให้เป็นบทพูดภาษาถิ่นแท้ 100% ที่ตรงกับเพศผู้พูด (${meta.gender === 'male' ? 'ชาย' : 'หญิง'})
กฎสำเนียง:
${meta.dialectRewriteRule}
ตอบกลับเฉพาะข้อความบทพูดล้วนๆ เท่านั้น ห้ามใส่เครื่องหมายคำพูดหรือคำอธิบายอื่น:
${trimmed}`;

      const llmRes = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            temperature: 0.35,
          },
        }),
        3800,
        'Dialect LLM timeout'
      );

      const adapted = (llmRes.text || '')
        .replace(/^["'“”]+|["'“”]+$/g, '')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (adapted && adapted.length >= Math.min(4, Math.floor(trimmed.length * 0.4))) {
        if (dialectAdaptationCache.size > 200) {
          const firstKey = dialectAdaptationCache.keys().next().value;
          if (firstKey) dialectAdaptationCache.delete(firstKey);
        }
        dialectAdaptationCache.set(cacheKey, adapted);
        return { spokenText: adapted, wasAdapted: adapted !== trimmed };
      }
    } catch {
      // Automatically fall back to deterministic regional dictionary
    }
  }

  return {
    spokenText: localDictResult.translatedText,
    wasAdapted: localDictResult.translatedText !== trimmed,
  };
}

/**
 * Synthesizes speech using Gemini 3.8 TTS when GEMINI_API_KEY is available,
 * and falls back seamlessly to the Keyless Neural Thai Engine without failing or hanging on Vercel.
 */
async function synthesizeSingleSpeakerAudio(
  spokenText: string,
  voiceMeta: VoicePersonaMeta,
  combinedStyle: string
): Promise<{
  audioBuffer?: Buffer;
  mimeType: 'audio/wav' | 'audio/mpeg';
  modelUsed: string;
  isFallback: boolean;
  clientSynthFallback?: boolean;
  voicePitchFactor: number;
  voiceCadenceFactor: number;
}> {
  const ai = getAiClient();

  if (ai) {
    const modelsToTry = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];

    for (const modelName of modelsToTry) {
      try {
        const partPayload: Record<string, unknown> = {
          text: spokenText || 'สวัสดีค่ะ',
        };
        if (combinedStyle) {
          partPayload.speechMetadata = { style: combinedStyle };
        }

        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [partPayload] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceMeta.apiVoice },
                },
              },
            },
          }),
          6800,
          `Gemini TTS ${modelName} timeout`
        );

        const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          const rawBuf = Buffer.from(inlineData.data, 'base64');
          const wavBuffer = ensureWavBuffer(rawBuf, inlineData.mimeType, 24000);
          return {
            audioBuffer: wavBuffer,
            mimeType: 'audio/wav',
            modelUsed: modelName,
            isFallback: false,
            voicePitchFactor: 1.0,
            voiceCadenceFactor: 1.0,
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Stop retrying additional Gemini models immediately if key is invalid or quota exhausted
        if (
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('API_KEY_INVALID') ||
          msg.includes('403') ||
          msg.includes('401') ||
          msg.includes('timeout')
        ) {
          break;
        }
      }
    }
  }

  // Automatic Fallback Engine (Keyless Neural Thai TTS + Calibrated Male/Female Pitch & Regional Cadence)
  try {
    const mp3Buffer = await fetchFallbackThaiSpeechMp3(spokenText || 'สวัสดีค่ะ');
    return {
      audioBuffer: mp3Buffer,
      mimeType: 'audio/mpeg',
      modelUsed: 'thai-neural-fallback',
      isFallback: true,
      voicePitchFactor: voiceMeta.fallbackPitch,
      voiceCadenceFactor: voiceMeta.fallbackCadence,
    };
  } catch {
    return {
      mimeType: 'audio/wav',
      modelUsed: 'client-synth-fallback',
      isFallback: true,
      clientSynthFallback: true,
      voicePitchFactor: voiceMeta.fallbackPitch,
      voiceCadenceFactor: voiceMeta.fallbackCadence,
    };
  }
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    engine: getAiClient() ? 'gemini-primary' : 'fallback-auto',
  });
});

// 1. Primary Text-to-Speech Endpoint
app.post('/api/tts/generate', async (req, res) => {
  try {
    const {
      text,
      voiceName,
      region,
      gender,
      speed = 'normal',
      style = '',
      autoTranslate = true,
    } = req.body || {};

    if (!text || !String(text).trim()) {
      res.status(400).json({ error: 'กรุณากรอกข้อความบทพากย์ก่อนสร้างเสียง' });
      return;
    }

    const resolvedKey = resolveVoiceKey(voiceName, region, gender);
    const voiceMeta = voiceMapping[resolvedKey] || voiceMapping.Kore;
    const pacingInstruction = speedPacingMap[speed] || speedPacingMap.normal;
    const combinedStyle = buildCombinedVoiceStyle(voiceMeta, style, pacingInstruction);

    const cleanInputText = String(text)
      .replace(/\[SFX:[^\]]+\]/gi, ' ')
      .replace(/<laugh>/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const { spokenText, wasAdapted } = await adaptScriptToVoiceDialect(
      cleanInputText,
      resolvedKey,
      autoTranslate !== false
    );

    const result = await synthesizeSingleSpeakerAudio(
      spokenText || 'สวัสดีค่ะ',
      voiceMeta,
      combinedStyle
    );

    res.json({
      success: true,
      audioBase64: result.audioBuffer ? result.audioBuffer.toString('base64') : undefined,
      clientSynthFallback: Boolean(result.clientSynthFallback),
      mimeType: result.mimeType,
      isFallback: result.isFallback,
      voicePitchFactor: result.voicePitchFactor,
      voiceCadenceFactor: result.voiceCadenceFactor,
      spokenText,
      wasDialectAdapted: wasAdapted,
      dialectLabel: voiceMeta.dialectLabel,
      region: voiceMeta.region,
      gender: voiceMeta.gender === 'male' ? 'male' : 'female',
      voiceName: resolvedKey,
      modelUsed: result.modelUsed,
    });
  } catch (error: unknown) {
    console.error('TTS route fallback catch:', error);
    const fallbackText = String(req.body?.text || 'สวัสดีค่ะ').trim();
    res.json({
      success: true,
      clientSynthFallback: true,
      isFallback: true,
      mimeType: 'audio/wav',
      voicePitchFactor: req.body?.gender === 'male' ? 0.78 : 1.0,
      voiceCadenceFactor: 1.0,
      spokenText: fallbackText,
      dialectLabel: 'โหมดสำรองอัตโนมัติ',
      modelUsed: 'client-synth-fallback',
    });
  }
});

// Cached Voice Sample Preview Endpoint (/tmp on Vercel Serverless)
const BUNDLED_PREVIEWS_DIR = path.resolve(__dirname, 'public', 'audio', 'previews');
const WRITABLE_PREVIEWS_DIR = isVercel
  ? path.join(os.tmpdir(), 'audio-previews')
  : BUNDLED_PREVIEWS_DIR;

try {
  if (!fs.existsSync(WRITABLE_PREVIEWS_DIR)) {
    fs.mkdirSync(WRITABLE_PREVIEWS_DIR, { recursive: true });
  }
} catch {
  // Ignore read-only fs warnings
}

const SAMPLE_DEFINITIONS: Record<string, { text: string; voiceKey: string }> = {
  voice_Lanna_Female: {
    text: 'สวัสดีเจ้า ยินดีต้อนฮับสู่เจียงใหม่เน้อเจ้า น้องบัวตองอู้กำเมืองม่วนๆ ลำขนาดเน้อเจ้า',
    voiceKey: 'Lanna_Female',
  },
  voice_Lanna_Male: {
    text: 'สุมาเต๊อะกั๊บ ยินดีจ้าดนักเน้อครับ อ้ายหนานเมืองอู้กำเมืองอบอุ่นแต้ๆ กั๊บ',
    voiceKey: 'Lanna_Male',
  },
  voice_Isan_Female: {
    text: 'สะบายดีจ้าพี่น้อง! มาพ้อกับน้องคำแพงมื้อนี้ ตำบักหุ่งแซ่บหลายคักอีหลีเด้อจ้า!',
    voiceKey: 'Isan_Female',
  },
  voice_Isan_Male: {
    text: 'สะบายดีเด้อครับพี่น้อง! มื้อนี้อ้ายทิดทศพามาม่วนซื่น เว้าอีสานคักอีหลีเด้อครับ!',
    voiceKey: 'Isan_Male',
  },
  voice_Southern_Female: {
    text: 'หวัดดีค่ะพี่น้องเหอ! วันนี้น้องนุ้ยมาแหลงใต้ให้ฟัง แกงส้มร้านนี้หรอยจังหู้นิ ลองชิมแลตะ!',
    voiceKey: 'Southern_Female',
  },
  voice_Southern_Male: {
    text: 'หวัดดีคับพี่น้องชาวใต้! พี่บ่าวหลวงมาแหลงใต้หรอยๆ คมเข้มจริงใจ หรอยอย่างแรงนิคับพี่น้อง!',
    voiceKey: 'Southern_Male',
  },
  voice_Kore: {
    text: 'สวัสดีค่ะ ขวัญข้าวพร้อมพากย์เสียงภาษากลางที่นุ่มนวลและชัดเจนให้คุณค่ะ',
    voiceKey: 'Kore',
  },
  voice_Mira: {
    text: 'ฮัลโหลทุกคน! มายด์มาแล้วค่ะ พร้อมรีวิวและป้ายยาแบบสดใสน่ารักเลยน้า!',
    voiceKey: 'Mira',
  },
  voice_Elena: {
    text: 'สวัสดีค่ะ ลลิตาพร้อมนำเสนอบทบรรยายและข้อมูลธุรกิจระดับมืออาชีพค่ะ',
    voiceKey: 'Elena',
  },
  voice_Puck: {
    text: 'สวัสดีครับทุกคน! วันนี้อยู่กับพีท พร้อมลุยทุกคอนเทนต์สนุกๆ ไปด้วยกันครับ!',
    voiceKey: 'Puck',
  },
  voice_Charon: {
    text: 'สวัสดีครับท่านผู้ฟัง ขอต้อนรับเข้าสู่รายงานข่าวและสารคดีประจำวันครับ',
    voiceKey: 'Charon',
  },
  voice_Fenrir: {
    text: 'ในห้วงเวลาแห่งการผจญภัยอันยิ่งใหญ่ เตรียมพบกับความระทึกขวัญไปกับภูผาครับ',
    voiceKey: 'Fenrir',
  },
  voice_Zephyr: {
    text: 'สวัสดีครับ โทนเสียงธรรมชาติ ฟังสบาย เหมาะกับทุกงานนำเสนอครับ',
    voiceKey: 'Zephyr',
  },
};

app.get('/api/tts/sample/:id', async (req, res) => {
  const sampleId = req.params.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const candidateWavPaths = isVercel
    ? [
        path.join(WRITABLE_PREVIEWS_DIR, `${sampleId}.wav`),
        path.join(BUNDLED_PREVIEWS_DIR, `${sampleId}.wav`),
      ]
    : [path.join(BUNDLED_PREVIEWS_DIR, `${sampleId}.wav`)];

  for (const filePath of candidateWavPaths) {
    if (fs.existsSync(filePath)) {
      try {
        const existing = fs.readFileSync(filePath);
        if (existing.length > 44 && existing.subarray(0, 4).toString('ascii') === 'RIFF') {
          res.setHeader('Content-Type', 'audio/wav');
          res.setHeader('X-Voice-Pitch', '1');
          res.setHeader('X-Voice-Cadence', '1');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.send(existing);
          return;
        }
      } catch {
        // Continue
      }
    }
  }

  const sampleInfo = SAMPLE_DEFINITIONS[sampleId];
  if (!sampleInfo) {
    res.status(404).json({ error: 'Sample not found' });
    return;
  }

  const voiceMeta = voiceMapping[sampleInfo.voiceKey] || voiceMapping.Kore;
  const cachedMp3Path = path.join(WRITABLE_PREVIEWS_DIR, `${sampleId}.mp3`);

  if (!getAiClient() && fs.existsSync(cachedMp3Path)) {
    try {
      const existingMp3 = fs.readFileSync(cachedMp3Path);
      if (existingMp3.length > 128) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('X-Voice-Pitch', String(voiceMeta.fallbackPitch));
        res.setHeader('X-Voice-Cadence', String(voiceMeta.fallbackCadence));
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(existingMp3);
        return;
      }
    } catch {
      // Regenerate below
    }
  }

  try {
    const result = await synthesizeSingleSpeakerAudio(
      sampleInfo.text,
      voiceMeta,
      voiceMeta.personaPrompt
    );

    if (!result.audioBuffer) {
      res.status(503).json({ error: 'Sample fallback to client synth' });
      return;
    }

    try {
      fs.mkdirSync(WRITABLE_PREVIEWS_DIR, { recursive: true });
      const ext = result.mimeType === 'audio/wav' ? 'wav' : 'mp3';
      fs.writeFileSync(path.join(WRITABLE_PREVIEWS_DIR, `${sampleId}.${ext}`), result.audioBuffer);
    } catch {
      // Ignore cache write errors on serverless
    }

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('X-Voice-Pitch', String(result.voicePitchFactor));
    res.setHeader('X-Voice-Cadence', String(result.voiceCadenceFactor));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(result.audioBuffer);
  } catch {
    res.status(503).json({ error: 'Sample temporarily unavailable' });
  }
});

// 2. Regional Dialect Translation Endpoint
app.post('/api/dialect/translate', async (req, res) => {
  try {
    const {
      text = '',
      targetRegion = 'central',
      gender = 'female',
    } = req.body || {};

    if (!String(text).trim()) {
      res.status(400).json({ error: 'กรุณาระบุข้อความที่ต้องการแปลงสำเนียง' });
      return;
    }

    const voiceKey = resolveVoiceKey(undefined, targetRegion, gender);
    const { spokenText } = await adaptScriptToVoiceDialect(String(text), voiceKey, true);

    res.json({
      success: true,
      translatedText: spokenText,
      targetRegion,
      gender,
    });
  } catch {
    const fallback = translateCentralToDialect(
      String(req.body?.text || ''),
      req.body?.targetRegion || 'central',
      req.body?.gender || 'female'
    );
    res.json({
      success: true,
      translatedText: fallback.translatedText,
      targetRegion: req.body?.targetRegion || 'central',
    });
  }
});

// Standalone Express + Vite middleware runner (skipped automatically when imported as Vercel Serverless Function)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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

if (!isVercel) {
  startServer();
}

export default app;
