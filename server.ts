import express from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { translateCentralToDialect } from './src/utils/dialectTranslator.js';
import type { RegionType } from './src/types/voice.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isVercel = Boolean(process.env.VERCEL);

app.use(express.json({ limit: '25mb' }));

// Lazy Server-side Gemini client (prevents Serverless cold-start crash if GEMINI_API_KEY is not yet configured)
let cachedAiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ Environment Variables');
  }
  if (!cachedAiClient) {
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

/**
 * Guarantees that any audio buffer (whether WAV from Gemini 3.8 TTS or raw L16 PCM from fallback models)
 * has a valid 44-byte RIFF WAVE header so <audio>, Web Audio decodeAudioData, and .wav downloads NEVER fail.
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

// Speed pacing descriptions for natural prosody
const speedPacingMap: Record<string, string> = {
  slow: 'Deliver with calm, unhurried, clear enunciation and natural breathing pauses.',
  normal: 'Deliver at a natural, balanced, engaging conversational rhythm.',
  fast: 'Deliver with brisk, lively, energetic, crisp momentum without slurring.',
};

interface VoicePersonaMeta {
  apiVoice: string;
  gender: 'female' | 'male' | 'neutral';
  region: RegionType;
  dialectLabel: string;
  personaPrompt: string;
  dialectRewriteRule?: string;
}

// Comprehensive Voice Persona & Regional Accent Mapping
const voiceMapping: Record<string, VoicePersonaMeta> = {
  // 🏔️ Northern Voices (คำเมือง ล้านนา)
  Lanna_Female: {
    apiVoice: 'Leda',
    gender: 'female',
    region: 'northern',
    dialectLabel: 'ภาษาเหนือ (อู้กำเมือง - สาวเหนือ)',
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Northern Thai woman from Chiang Mai speaking genuine Kam Mueang / Lanna dialect (สาวเหนืออู้กำเมืองแท้ๆ). Speak with sweet, soft, melodic Northern Thai tonal contours, gentle lingering vowel endings, and warm Lanna charm ending with "เจ้า" / "เน้อเจ้า". Strictly avoid flat Central Bangkok Thai intonation.',
    dialectRewriteRule: `แปลงเป็น "ภาษาพูดอู้กำเมืองของสาวเหนือเชียงใหม่แท้ๆ" ใช้คำเมืองและคำสะกดออกเสียงแบบคนเหนือจริง เช่น:
- สวัสดีค่ะ -> สวัสดีเจ้า , คุณ/ทุกคน -> สูเจ้า / สูเจ้าตึงหลาย / ปี้น้อง , ฉัน -> ข้าเจ้า / น้อง
- อร่อยมาก/อร่อยจริงๆ -> ลำขนาด / ลำแต้ๆ , สวย/น่ารัก -> งามขนาด / น่าฮักแต้ๆ , ดีมาก -> ดีขนาด
- พูด/คุย -> อู้ / อู้จา , ดู/มอง/ลองดู -> ผ่อ / ลองผ่อเน้อ , ทำ/ทำงาน -> ยะ / ยะก๋าน , รู้/ไม่รู้ -> ฮู้ / บ่ฮู้
- รัก/คิดถึง -> ฮัก / กึดเติงหา , ไม่/ไม่ใช่/ไม่มี/ไม่เป็นไร -> บ่ / บ่ใจ้ / บ่มี / บ่เป็นหยังเน้อเจ้า
- จริง/จริงไหม -> แต้ / แต้ก๋า , มาก/เยอะมาก -> ขนาด / จ้าดนัก , ที่ไหน/ไปไหน -> ตี้ไหน / ไปตางได
- ให้ -> ฮื้อ , กัน -> กั๋น , กิน -> กิ๋น , ชิม -> จิม , บ้าน/กลับบ้าน -> เฮือน / ปิ๊กเฮือน , ตลาด -> กาด , ตอนเช้า -> ยามเจ๊า , พรุ่งนี้ -> วันพูก
- คำลงท้ายผู้หญิง: ใช้ "เจ้า", "เน้อเจ้า", "เจ๊า" แทน ค่ะ/นะคะ/ครับ ทุกจุด ห้ามหลงเหลือคำว่า ค่ะ/นะคะ/ครับ เด็ดขาด`,
  },
  Lanna_Male: {
    apiVoice: 'Charon',
    gender: 'male',
    region: 'northern',
    dialectLabel: 'ภาษาเหนือ (อู้กำเมือง - บ่าวเหนือ)',
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Northern Thai man from Chiang Mai speaking genuine Kam Mueang / Lanna dialect (บ่าวเหนืออู้กำเมืองแท้ๆ). Speak with warm, polite, melodic Northern Thai cadence and authentic Lanna intonation ending with "กั๊บ" / "เน้อครับ". Strictly avoid Central Bangkok Thai intonation.',
    dialectRewriteRule: `แปลงเป็น "ภาษาพูดอู้กำเมืองของป้อจายคนเหนือล้านนาแท้ๆ" เช่น:
- สวัสดีครับ -> สุมาเต๊อะกั๊บ / สวัสดีเน้อครับ , ผม -> อ้าย / เปิ้น , คุณ/ทุกคน -> สูเจ้า / ปี้น้องตึงหลาย
- อร่อยมาก -> ลำขนาด / ลำแต้ๆ , พูด -> อู้ , ดู -> ผ่อ , ทำ/ทำงาน -> ยะ / ยะก๋าน , รู้ -> ฮู้ , รัก -> ฮัก , ไม่ -> บ่
- ให้ -> ฮื้อ , กัน -> กั๋น , กิน -> กิ๋น , กลับบ้าน -> ปิ๊กเฮือน , ตลาด -> กาด , เยอะมาก -> จ้าดนัก , ตอนเช้า -> ยามเจ๊า
- คำลงท้ายผู้ชาย: ใช้ "กั๊บ", "เน้อกั๊บ", "เน้อครับ" แทน ครับ/ค่ะ/นะคะ ทุกจุด`,
  },

  // 🌾 Isan Voices (เว้าอีสาน)
  Isan_Female: {
    apiVoice: 'Aoede',
    gender: 'female',
    region: 'isan',
    dialectLabel: 'ภาษาอีสาน (เว้าอีสาน - สาวอีสาน)',
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Northeastern Thai (Isan) woman from Khon Kaen speaking genuine Isan dialect (สาวอีสานเว้าอีสานแท้ๆ). Speak with lively, cheerful, musical Isan tonal inflection, warm friendly energy, and authentic Isan rhythm ending with "เด้อจ้า" / "จ้า". Strictly avoid Central Bangkok Thai intonation.',
    dialectRewriteRule: `แปลงเป็น "ภาษาพูดเว้าอีสานของสาวอีสานแท้ๆ" จังหวะม่วนซื่น เป็นกันเอง เช่น:
- สวัสดีค่ะ -> สะบายดีจ้าพี่น้อง / สวัสดีเด้อจ้า , คุณ/ทุกคน -> เจ้า / พี่น้องสู่สุคน , ฉัน/หนู -> ข้อย / น้อง
- อร่อยมาก/อร่อยจริงๆ -> แซ่บหลาย / แซ่บคักอีหลี , สนุก -> ม่วนซื่น / ม่วนหลาย , สวย/น่ารัก -> งามหลาย / ตาฮักคัก
- พูด -> เว้า , ดู/มอง/ลองดู -> เบิ่ง / ลองเบิ่งเด้อ , ทำ/ทำงาน -> เฮ็ด / เฮ็ดเวียก , รู้ -> ฮู้ , รัก/คิดถึง -> ฮัก / คึดฮอด
- จะ -> สิ (เช่น จะพาไปดู -> สิพาไปเบิ่ง) , ด้วยกัน -> นำกัน , รีบ -> ฟ้าว , เลย -> โลด
- ไม่/ไม่ใช่/ไม่มี/ไม่เป็นไร -> บ่ / บ่แม่น / บ่มี / บ่เป็นหยังดอกเด้อจ้า , จริงๆ -> อีหลี / คักอีหลี , มาก -> หลาย / คัก
- ที่ไหน/ไปไหน -> หม่องได๋ / ไปไส , อะไร -> อีหยัง , ทำไม -> เป็นหยัง , อย่างไร -> จังได๋ , วันนี้/พรุ่งนี้/ตอนเช้า -> มื้อนี้ / มื้ออื่น / ยามเซ้า
- คำลงท้ายผู้หญิง: ใช้ "เด้อจ้า", "จ้า", "แหน่เด้อจ้า" แทน ค่ะ/นะคะ/ครับ ทุกจุด ห้ามมี ค่ะ/นะคะ/ครับ แบบภาษากลาง`,
  },
  Isan_Male: {
    apiVoice: 'Puck',
    gender: 'male',
    region: 'isan',
    dialectLabel: 'ภาษาอีสาน (เว้าอีสาน - บ่าวอีสาน)',
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Northeastern Thai (Isan) man speaking genuine Isan dialect (บ่าวอีสานเว้าอีสานแท้ๆ). Speak with upbeat, jovial, rhythmic Isan tonal lilt and warm local charisma ending with "เด้อครับ" / "เด้อพี่น้อง". Strictly avoid Central Bangkok Thai intonation.',
    dialectRewriteRule: `แปลงเป็น "ภาษาพูดเว้าอีสานของบ่าวอีสานแท้ๆ" สนุกสนาน จริงใจ เช่น:
- สวัสดีครับ -> สะบายดีเด้อครับพี่น้อง , ผม -> อ้าย / ข้อย , คุณ/ทุกคน -> เจ้า / พี่น้องสู่สุคน
- อร่อยมาก -> แซ่บหลายคักอีหลี , สนุก -> ม่วนซื่น , พูด -> เว้า , ดู -> เบิ่ง , ทำ/ทำงาน -> เฮ็ด / เฮ็ดเวียก
- จะ -> สิ , ด้วยกัน -> นำกัน , รีบ -> ฟ้าว , เลย -> โลด , ไม่ -> บ่ , จริงๆ -> อีหลี , มาก -> หลาย / คัก , วันนี้ -> มื้อนี้
- คำลงท้ายผู้ชาย: ใช้ "เด้อครับ", "เด้อครับพี่น้อง", "เด้อ" แทน ครับ/ค่ะ/นะคะ ทุกจุด`,
  },

  // 🌊 Southern Voices (แหลงใต้)
  Southern_Female: {
    apiVoice: 'Aoede',
    gender: 'female',
    region: 'southern',
    dialectLabel: 'ภาษาใต้ (แหลงใต้ - สาวใต้)',
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Southern Thai woman from Nakhon Si Thammarat / Songkhla speaking real Pak Tai dialect (สาวใต้แหลงใต้แท้ๆ). Speak with brisk, punchy, staccato, high-energy Southern Thai tonal jumps, clipped initial syllables, crisp consonants, and spirited Pak Tai cadence ending with "นิ", "พี่น้องเหอ", "ตะน้องเหอ", "หรอยจังหู้". NEVER speak in flat Central Bangkok Thai accent.',
    dialectRewriteRule: `สำคัญที่สุด! ต้องแปลงเป็น "ภาษาพูดแหลงใต้แท้ๆ ของสาวใต้ (เมืองคอน/สงขลา)" ที่มีจังหวะกระชับ ตัดคำหน้าตามธรรมชาติคนใต้ และใช้คำศัพท์ปักษ์ใต้แท้ๆ เพื่อให้เสียงพากย์ออกมาเป็นสาวใต้ 100% ห้ามเป็นภาษากลางเด็ดขาด เช่น:
- สวัสดีค่ะ -> หวัดดีค่ะพี่น้องเหอ! / หวัดดีนิพี่น้อง , สบายดีไหม -> บายดีหม้าย
- ฉัน/ดิฉัน/หนู -> ฉาน / น้องนุ้ย , คุณ/พวกคุณ/ทุกคน -> พี่น้อง / ตัวเอง / พี่น้องทุกคนนิ
- อร่อยมาก / อร่อยสุดๆ -> หรอยจังหู้ / หรอยอย่างแรง / หรอยหนัดเหนียน , รสชาติกลมกล่อม -> รสชาติกลมกล่อมหรอยได้ใจ
- ดีมาก / สุดยอด / พิเศษ -> หรอยได้ใจ / เด็ดอย่างแรง / ดีจังหู้นิ
- สวยมาก / น่ารักมาก -> งามจังหู้ / น่ารักได้ใจนิ
- มาก / มากๆ / จริงๆ / สุดๆ -> จังหู้ / อย่างแรง / หนัด / ได้ใจ
- พูด / เล่า / บอก / พากย์เสียง -> แหลง / แหลงให้ฟัง / แหลงเสียง
- ดู / มอง / ลองดู / ลองชิม -> แล / ลองแลตะ / ลองชิมแลตะ
- สิ / เถอะ / เลยนะ / กันเลย -> ตะ / ต่ะ / เลยตะน้องเหอ / กันตะพี่น้อง
- ไม่รู้ / ไม่เข้าใจ -> ไม่โร้ / ไม่โร้เรื่องนิ , ไม่เป็นไร -> หม้ายพรือนิ , ไม่มี -> หม้าย
- ทำไม -> ไซร / ทำไซร , อะไร -> ไอ้ไหร , อย่างไร/ยังไง -> พันพรือ , ใช่ไหม -> หม้ายเล่า / จริงหม้าย
- ตลาด -> หลาด , กลับบ้าน -> หลบเริน , ตอนเช้า/เช้าวันใหม่ -> หัวเช้า / หัวเช้าวันใหม่ , เมื่อวาน -> ต่อโพลก , โกหก -> ขี้หก , คิดถึง -> หวังเหวิด , ทั้งหมด/เยอะแยะ -> ลุยเหม็ด
- คำลงท้ายผู้หญิงสาวใต้: ใช้ "นิ", "นิค่ะ", "พี่น้องเหอ", "น้องเหอ", "ตะ", "จังหู้นิ" แทน ค่ะ/นะคะ/ครับ ทุกจุด (ห้ามมีคำว่า ครับ หรือ นะคะ แบบภาษากลางหลงเหลือเด็ดขาด!)`,
  },
  Southern_Male: {
    apiVoice: 'Fenrir',
    gender: 'male',
    region: 'southern',
    dialectLabel: 'ภาษาใต้ (แหลงใต้ - บ่าวใต้)',
    personaPrompt:
      'PRIMARY ACCENT & PERSONA: Authentic native Southern Thai man speaking real Pak Tai dialect (พี่บ่าวหลวงแหลงใต้แท้ๆ). Speak with bold, punchy, crisp, rapid Southern Thai intonation, clipped syllables, and strong heartfelt Pak Tai rhythm ending with "นิ", "คับพี่น้อง", "ตะพี่น้อง". NEVER speak in Central Bangkok Thai accent.',
    dialectRewriteRule: `สำคัญที่สุด! ต้องแปลงเป็น "ภาษาพูดแหลงใต้แท้ๆ ของพี่บ่าวคนปักษ์ใต้" กระชับ หนักแน่น ตัดคำหน้าตามธรรมชาติคนใต้ เช่น:
- สวัสดีครับ -> หวัดดีคับพี่น้อง! / หวัดดีคับพี่น้องชาวใต้ , สบายดีไหม -> บายดีหม้าย
- ผม -> พี่บ่าว / ผม , คุณ/ทุกคน -> พี่น้อง / หมู่เราทุกคน
- อร่อยมาก -> หรอยจังหู้ / หรอยอย่างแรง / หรอยหนัด , ดีมาก/สุดยอด -> หรอยได้ใจ / เด็ดอย่างแรง
- มาก/จริงๆ -> จังหู้ / อย่างแรง / หนัด , พูด/พากย์เสียง -> แหลง / แหลงเสียง , ดู/ลองดู -> แล / ลองแลตะ , สิ/เถอะ -> ตะ / ตะพี่น้อง
- ไม่รู้ -> ไม่โร้ , ไม่เป็นไร -> หม้ายพรือ , ไม่มี -> หม้าย , ทำไม -> ไซร , อะไร -> ไอ้ไหร , ยังไง -> พันพรือ
- ตลาด -> หลาด , กลับบ้าน -> หลบเริน , ตอนเช้า -> หัวเช้า , โกหก -> ขี้หก , เยอะแยะ -> ลุยเหม็ด
- คำลงท้ายผู้ชายบ่าวใต้: ใช้ "นิ", "คับพี่น้อง", "ตะพี่น้อง", "จังหู้นิ" แทน ครับ/ค่ะ/นะคะ ทุกจุด`,
  },

  // 🏛️ Central Thai Voices
  Kore: {
    apiVoice: 'Kore',
    gender: 'female',
    region: 'central',
    dialectLabel: 'ภาษากลาง (เสียงผู้หญิงอบอุ่น)',
    personaPrompt: 'Warm, gentle, melodic, comforting, clear standard Central Thai female voice',
  },
  Mira: {
    apiVoice: 'Leda',
    gender: 'female',
    region: 'central',
    dialectLabel: 'ภาษากลาง (เสียงสาววัยรุ่นสดใส)',
    personaPrompt: 'Youthful, bright, cheerful, energetic, cute, bubbly young Central Thai female voice',
  },
  Elena: {
    apiVoice: 'Zephyr',
    gender: 'female',
    region: 'central',
    dialectLabel: 'ภาษากลาง (เสียงผู้หญิงมืออาชีพ)',
    personaPrompt: 'Sophisticated, confident, articulate, authoritative, professional Central Thai businesswoman voice',
  },
  Puck: {
    apiVoice: 'Puck',
    gender: 'male',
    region: 'central',
    dialectLabel: 'ภาษากลาง (เสียงผู้ชายสดใสมีพลัง)',
    personaPrompt: 'Energetic, lively, youthful, cheerful, engaging Central Thai male voice',
  },
  Fenrir: {
    apiVoice: 'Fenrir',
    gender: 'male',
    region: 'central',
    dialectLabel: 'ภาษากลาง (เสียงผู้ชายทุ้มทรงพลัง)',
    personaPrompt: 'Deep, dramatic, powerful, resonant, intense Central Thai male voice',
  },
  Charon: {
    apiVoice: 'Charon',
    gender: 'male',
    region: 'central',
    dialectLabel: 'ภาษากลาง (เสียงผู้ชายสุขุมน่าเชื่อถือ)',
    personaPrompt: 'Calm, authoritative, clear, articulate, professional Central Thai male news anchor voice',
  },
  Zephyr: {
    apiVoice: 'Zephyr',
    gender: 'neutral',
    region: 'central',
    dialectLabel: 'ภาษากลาง (เสียงธรรมชาติฟังสบาย)',
    personaPrompt: 'Modern, balanced, natural, relaxed conversational Central Thai voice',
  },
};

/**
 * Sanitizes style instructions so a male voice never receives female-only prompt words (e.g. "woman", "girl")
 * and combines persona + regional accent priority with emotional tone and speed pacing.
 */
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
      .replace(/\bmotherly\b/gi, 'warm paternal')
      .replace(/\banime girl\b/gi, 'animated energetic')
      .replace(/\bwoman\b/gi, 'man')
      .replace(/\bfemale\b/gi, 'male')
      .replace(/\bgirl\b/gi, 'guy');
  }

  // For regional voices, persona & authentic regional accent ALWAYS take top priority!
  if (voiceMeta.region !== 'central') {
    return cleanStyle
      ? `${voiceMeta.personaPrompt} EMOTIONAL TONE: ${cleanStyle}. PACING: ${pacingInstruction}`
      : `${voiceMeta.personaPrompt} PACING: ${pacingInstruction}`;
  }

  return cleanStyle
    ? `${cleanStyle}. ${voiceMeta.personaPrompt}. ${pacingInstruction}`
    : `${voiceMeta.personaPrompt}. ${pacingInstruction}`;
}

// Simple LRU cache for dialect adaptations so repeated generations of the same script are 0ms
const dialectAdaptationCache = new Map<string, string>();

/**
 * Adapts standard Central Thai script into 100% authentic regional spoken dialect (Pak Tai / Kam Mueang / Isan)
 * using Gemini 3.8 Flash with phonetic dialect guidelines + instant dictionary fallback.
 */
async function adaptScriptToVoiceDialect(
  rawText: string,
  voiceName: string,
  autoTranslate = true
): Promise<{ spokenText: string; wasAdapted: boolean }> {
  const trimmed = rawText.trim();
  if (!trimmed) return { spokenText: trimmed, wasAdapted: false };

  const meta = voiceMapping[voiceName] || voiceMapping.Kore;

  // Central Thai voices: harmonize polite gender particles if autoTranslate is on
  if (meta.region === 'central') {
    if (!autoTranslate || meta.gender === 'neutral') {
      return { spokenText: trimmed, wasAdapted: false };
    }
    const harmonized = translateCentralToDialect(trimmed, 'central', meta.gender).translatedText;
    return { spokenText: harmonized, wasAdapted: harmonized !== trimmed };
  }

  // Regional voices (northern, isan, southern)
  const localDictResult = translateCentralToDialect(trimmed, meta.region, meta.gender);

  if (!autoTranslate) {
    // Even if user turned off full vocabulary rewrite, never let a female regional voice end with male "ครับ"
    let particleAdjusted = trimmed;
    if (meta.gender === 'female') {
      if (meta.region === 'southern') particleAdjusted = particleAdjusted.replace(/นะครับ/g, 'ตะน้องเหอ').replace(/ครับ/g, 'นิค่ะ');
      if (meta.region === 'northern') particleAdjusted = particleAdjusted.replace(/นะครับ/g, 'เน้อเจ้า').replace(/ครับ/g, 'เจ้า');
      if (meta.region === 'isan') particleAdjusted = particleAdjusted.replace(/นะครับ/g, 'เด้อจ้า').replace(/ครับ/g, 'เด้อจ้า');
    }
    return { spokenText: particleAdjusted, wasAdapted: particleAdjusted !== trimmed };
  }

  const cacheKey = `${voiceName}::${trimmed}`;
  const cached = dialectAdaptationCache.get(cacheKey);
  if (cached) {
    return { spokenText: cached, wasAdapted: cached !== trimmed };
  }

  // Deep Native Dialect Adaptation via Gemini 3.8 Flash (low thinking latency ~0.5s)
  try {
    const prompt = `คุณคือนักพากย์เจ้าของภาษาท้องถิ่นระดับครู สำหรับคาแรคเตอร์ "${meta.dialectLabel}"
หน้าที่ของคุณคือแปลงบทพูดด้านล่างให้เป็น **บทพูดออกเสียงภาษาถิ่นแท้ 100%** ที่คนท้องถิ่นพูดจริงในชีวิตประจำวัน เพื่อส่งต่อให้ระบบสังเคราะห์เสียงอ่านออกเสียงเป็นสำเนียงภาคนั้นอย่างเป็นธรรมชาติที่สุด

กฎเฉพาะของคาแรคเตอร์นี้:
${meta.dialectRewriteRule}

ข้อบังคับเด็ดขาด:
1. ห้ามตอบคำอธิบายอื่น ให้ตอบกลับมาเฉพาะ "ข้อความบทพูดภาษาถิ่นที่พร้อมอ่านออกเสียงทันที" เท่านั้น (Plain text ล้วน ห้ามใส่เครื่องหมายคำพูดครอบ)
2. รักษาความหมายเดิมครบถ้วน แต่ปรับคำศัพท์ คำสร้อย คำเชื่อม และคำลงท้ายให้เป็นภาษาถิ่นแท้ทั้งประโยค (ห้ามปล่อยให้ประโยคยังเป็นภาษากลาง)
3. หากข้อความต้นฉบับเป็นภาษาถิ่นภาคนั้นอยู่แล้ว ให้เกลาจังหวะคำสร้อยและคำลงท้ายให้ตรงกับเพศผู้พูด (${meta.gender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'}) อย่างเป็นธรรมชาติ ห้ามแปลกลับเป็นภาษากลางเด็ดขาด
4. ห้ามใส่ชื่อผู้พูดข้างหน้า และห้ามใส่คำกำกับในวงเล็บ เช่น (ยิ้ม) หรือ [หัวเราะ]

ข้อความต้นฉบับ:
${trimmed}`;

    const llmRes = await Promise.race([
      getAiClient().models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          temperature: 0.4,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Dialect LLM timeout (4.5s)')), 4500)
      ),
    ]);

    let adapted = (llmRes.text || '')
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
  } catch (err: any) {
    console.warn('LLM dialect adaptation fallback to dictionary:', err?.message);
  }

  return {
    spokenText: localDictResult.translatedText,
    wasAdapted: localDictResult.translatedText !== trimmed,
  };
}

/**
 * Helper to synthesize single-speaker speech with resilient model fallback and guaranteed RIFF WAV output
 */
async function synthesizeSingleSpeakerAudio(
  spokenText: string,
  apiVoice: string,
  combinedStyle: string
): Promise<{ wavBuffer: Buffer; modelUsed: string }> {
  const modelsToTry = [
    { name: 'gemini-3.8-flash-tts', supportsStyleMetadata: true },
    { name: 'gemini-3.8-flash-lite-tts', supportsStyleMetadata: true },
    { name: 'gemini-3.1-flash-tts-preview', supportsStyleMetadata: false },
  ];

  let lastError: any = null;

  for (const candidate of modelsToTry) {
    try {
      const partPayload: Record<string, any> = {
        text: spokenText || 'สวัสดีค่ะ',
      };
      if (candidate.supportsStyleMetadata && combinedStyle) {
        partPayload.speechMetadata = {
          style: combinedStyle,
        };
      }

      const response = await getAiClient().models.generateContent({
        model: candidate.name,
        contents: [
          {
            role: 'user',
            parts: [partPayload],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: apiVoice },
            },
          },
        },
      });

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (inlineData?.data) {
        const rawBuf = Buffer.from(inlineData.data, 'base64');
        const wavBuffer = ensureWavBuffer(rawBuf, inlineData.mimeType, 24000);
        return { wavBuffer, modelUsed: candidate.name };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || '');
      console.warn(`TTS model ${candidate.name} (${apiVoice}) attempt note:`, errMsg.slice(0, 140));

      // If Quota/429 error on a specific model, move to next candidate; if voiceName 'Aoede'/'Leda' is unsupported on this model, retry same model with 'Kore' so Voice Design style is preserved!
      const isQuotaErr = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
      if (!isQuotaErr && (apiVoice === 'Aoede' || apiVoice === 'Leda')) {
        try {
          const retryPayload: Record<string, any> = {
            text: spokenText || 'สวัสดีค่ะ',
          };
          if (candidate.supportsStyleMetadata && combinedStyle) {
            retryPayload.speechMetadata = { style: combinedStyle };
          }
          const fallbackRes = await getAiClient().models.generateContent({
            model: candidate.name,
            contents: [{ role: 'user', parts: [retryPayload] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
              },
            },
          });
          const inlineData = fallbackRes.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (inlineData?.data) {
            const rawBuf = Buffer.from(inlineData.data, 'base64');
            return {
              wavBuffer: ensureWavBuffer(rawBuf, inlineData.mimeType, 24000),
              modelUsed: candidate.name,
            };
          }
        } catch (innerErr) {
          lastError = innerErr;
        }
      }
    }
  }

  throw lastError || new Error('ไม่ได้รับข้อมูลเสียงจากแบบจำลอง Gemini TTS');
}

// 1. Primary Text-to-Speech Endpoint
app.post('/api/tts/generate', async (req, res) => {
  try {
    const {
      text,
      voiceName = 'Kore',
      speed = 'normal',
      style = '',
      autoTranslate = true,
      isMultiSpeaker = false,
      speakers = [],
    } = req.body;

    if (!text && (!speakers || speakers.length === 0)) {
      res.status(400).json({ error: 'ข้อความสำหรับพากย์ต้องไม่ว่างเปล่า (Text is required)' });
      return;
    }

    const pacingInstruction = speedPacingMap[speed] || speedPacingMap.normal;
    const voiceMeta = voiceMapping[voiceName] || voiceMapping.Kore;
    const combinedStyle = buildCombinedVoiceStyle(voiceMeta, style, pacingInstruction);

    // Multi-Speaker Dialogue Mode (2 Speakers)
    if (isMultiSpeaker && Array.isArray(speakers) && speakers.length >= 2) {
      // Ensure exactly 2 distinct speaker identifiers for multiSpeakerVoiceConfig
      const normalizedLines = await Promise.all(
        speakers.map(async (spk: any, idx: number) => {
          const spkVoiceName = spk.voiceName || (idx % 2 === 0 ? 'Puck' : 'Kore');
          const meta = voiceMapping[spkVoiceName] || voiceMapping.Kore;
          const rawLine = (spk.text || '')
            .replace(/\[SFX:[^\]]+\]/gi, ' ')
            .replace(/<laugh>/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const { spokenText } = await adaptScriptToVoiceDialect(rawLine, spkVoiceName, autoTranslate);
          return {
            speakerSlot: idx % 2 === 0 ? 'SpeakerA' : 'SpeakerB',
            displaySpeaker: spk.speaker || `ผู้พูด ${idx + 1}`,
            meta,
            spokenText,
            lineStyle: buildCombinedVoiceStyle(meta, spk.style || style, pacingInstruction),
          };
        })
      );

      const slotAMeta = normalizedLines.find((l) => l.speakerSlot === 'SpeakerA')?.meta || voiceMapping.Puck;
      const slotBMeta = normalizedLines.find((l) => l.speakerSlot === 'SpeakerB')?.meta || voiceMapping.Kore;

      const parts = normalizedLines
        .filter((l) => l.spokenText.length > 0)
        .map((l) => ({
          text: `${l.speakerSlot}: ${l.spokenText}`,
          speechMetadata: {
            speaker: l.speakerSlot,
            style: l.lineStyle,
          },
        }));

      const safeMultiVoice = (v: string) =>
        ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede', 'Leda'].includes(v) ? v : 'Kore';

      const buildMultiConfig = (voiceA: string, voiceB: string) => ({
        responseModalities: ['AUDIO' as const],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'SpeakerA',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceA },
                },
              },
              {
                speaker: 'SpeakerB',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceB },
                },
              },
            ],
          },
        },
      });

      let response;
      let modelUsed = 'gemini-3.8-flash-tts';
      const primaryVoiceA = safeMultiVoice(slotAMeta.apiVoice);
      const primaryVoiceB = safeMultiVoice(slotBMeta.apiVoice);
      const coreVoiceA = primaryVoiceA === 'Aoede' || primaryVoiceA === 'Leda' ? 'Kore' : primaryVoiceA;
      const coreVoiceB = primaryVoiceB === 'Aoede' || primaryVoiceB === 'Leda' ? 'Zephyr' : primaryVoiceB;

      try {
        response = await getAiClient().models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [{ role: 'user', parts }],
          config: buildMultiConfig(primaryVoiceA, primaryVoiceB),
        });
      } catch (flashErr: any) {
        console.warn('Multi-speaker flash-tts fallback:', flashErr?.message);
        try {
          response = await getAiClient().models.generateContent({
            model: 'gemini-3.8-flash-tts',
            contents: [{ role: 'user', parts }],
            config: buildMultiConfig(coreVoiceA, coreVoiceB),
          });
        } catch {
          modelUsed = 'gemini-3.8-flash-lite-tts';
          response = await getAiClient().models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [{ role: 'user', parts }],
            config: buildMultiConfig(coreVoiceA, coreVoiceB),
          });
        }
      }

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!inlineData?.data) {
        throw new Error('ไม่ได้รับข้อมูลเสียงจากแบบจำลอง Gemini');
      }

      const wavBuffer = ensureWavBuffer(Buffer.from(inlineData.data, 'base64'), inlineData.mimeType, 24000);
      const dialogueTranscript = normalizedLines
        .map((l) => `${l.displaySpeaker}: ${l.spokenText}`)
        .join(' | ');

      res.json({
        success: true,
        audioBase64: wavBuffer.toString('base64'),
        mimeType: 'audio/wav',
        spokenText: dialogueTranscript,
        wasDialectAdapted: true,
        dialectLabel: 'บทสนทนา 2 ตัวละคร',
        modelUsed,
      });
      return;
    }

    // Single-Speaker Mode with Full Regional Dialect Adaptation & Voice Persona Styling
    const cleanInputText = (text || '')
      .replace(/\[SFX:[^\]]+\]/gi, ' ')
      .replace(/<laugh>/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const { spokenText, wasAdapted } = await adaptScriptToVoiceDialect(
      cleanInputText,
      voiceName,
      autoTranslate !== false
    );

    const { wavBuffer, modelUsed } = await synthesizeSingleSpeakerAudio(
      spokenText || 'สวัสดีค่ะ',
      voiceMeta.apiVoice,
      combinedStyle
    );

    res.json({
      success: true,
      audioBase64: wavBuffer.toString('base64'),
      mimeType: 'audio/wav',
      spokenText,
      wasDialectAdapted: wasAdapted,
      dialectLabel: voiceMeta.dialectLabel,
      region: voiceMeta.region,
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
      const isPerMinute = errStr.includes('PerMinute') || errStr.includes('limit: 3');
      const waitMatch = errStr.match(/retry in ([0-9.]+)s/i) || errStr.match(/retryDelay":"([0-9]+)s/i);
      const waitSec = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) : 20;

      res.status(429).json({
        success: false,
        quotaExceeded: true,
        isPerMinute,
        waitSec,
        error: isPerMinute
          ? `ระบบจำกัดความถี่ชั่วคราว กรุณารอสักครู่ (~${waitSec} วินาที) แล้วกดสร้างเสียงพากย์ใหม่อีกครั้งครับ`
          : 'โควตา Gemini TTS เต็มชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้งครับ',
      });
      return;
    }

    res.status(500).json({
      error: error?.message || 'เกิดข้อผิดพลาดในการสร้างเสียงพากย์',
      details: error?.toString(),
    });
  }
});

// Directories for high-quality cached preview samples
// On Vercel Serverless, /var/task is read-only, so runtime writes go to os.tmpdir() (/tmp)
const BUNDLED_PREVIEWS_DIR = path.resolve(__dirname, 'public', 'audio', 'previews');
const WRITABLE_PREVIEWS_DIR = isVercel
  ? path.join(os.tmpdir(), 'audio-previews')
  : BUNDLED_PREVIEWS_DIR;

try {
  if (!fs.existsSync(WRITABLE_PREVIEWS_DIR)) {
    fs.mkdirSync(WRITABLE_PREVIEWS_DIR, { recursive: true });
  } else if (!isVercel) {
    // Clean up any legacy raw PCM files that lacked RIFF headers in local dev
    for (const file of fs.readdirSync(WRITABLE_PREVIEWS_DIR)) {
      if (file.endsWith('.wav')) {
        const fullPath = path.join(WRITABLE_PREVIEWS_DIR, file);
        const buf = fs.readFileSync(fullPath);
        if (buf.length < 44 || buf.subarray(0, 4).toString('ascii') !== 'RIFF') {
          fs.unlinkSync(fullPath);
          console.log(`Removed legacy headerless sample: ${file}`);
        }
      }
    }
  }
} catch (cleanupErr) {
  console.warn('Preview cache directory setup note:', cleanupErr);
}

const SAMPLE_DEFINITIONS: Record<string, { text: string; voiceKey: string; stylePrompt: string }> = {
  // Regional Voices (6 Voices)
  voice_Lanna_Female: {
    text: 'สวัสดีเจ้า ยินดีต้อนฮับสู่เจียงใหม่เน้อเจ้า น้องบัวตองอู้กำเมืองม่วนๆ ลำแต้ๆ ลำขนาดเน้อเจ้า',
    voiceKey: 'Lanna_Female',
    stylePrompt: voiceMapping.Lanna_Female.personaPrompt,
  },
  voice_Lanna_Male: {
    text: 'สุมาเต๊อะกั๊บ ยินดีจ้าดนักเน้อครับ อ้ายหนานเมืองยินดีต้อนฮับ อู้กำเมืองม่วนๆ อบอุ่นแต้ๆ กั๊บ',
    voiceKey: 'Lanna_Male',
    stylePrompt: voiceMapping.Lanna_Male.personaPrompt,
  },
  voice_Isan_Female: {
    text: 'สะบายดีจ้าพี่น้อง! มาพ้อกับน้องคำแพงมื้อนี้ ตำบักหุ่งแซ่บหลาย ตาฮักคักอีหลีเด้อจ้า!',
    voiceKey: 'Isan_Female',
    stylePrompt: voiceMapping.Isan_Female.personaPrompt,
  },
  voice_Isan_Male: {
    text: 'สะบายดีเด้อครับพี่น้อง! มื้อนี้อ้ายทิดทศพามาม่วนซื่นโฮแซว เว้าอีสานคักอีหลีเด้อครับพี่น้อง!',
    voiceKey: 'Isan_Male',
    stylePrompt: voiceMapping.Isan_Male.personaPrompt,
  },
  voice_Southern_Female: {
    text: 'หวัดดีค่ะพี่น้องเหอ! วันนี้น้องนุ้ยมาแหลงใต้ให้ฟัง แกงส้มร้านนี้หรอยจังหู้นิ หรอยอย่างแรง ลองชิมแลตะน้องเหอ!',
    voiceKey: 'Southern_Female',
    stylePrompt: voiceMapping.Southern_Female.personaPrompt,
  },
  voice_Southern_Male: {
    text: 'หวัดดีคับพี่น้องชาวใต้! พี่บ่าวหลวงมาแหลงใต้หรอยๆ คมเข้มจริงใจ หรอยอย่างแรงนิคับพี่น้อง!',
    voiceKey: 'Southern_Male',
    stylePrompt: voiceMapping.Southern_Male.personaPrompt,
  },

  // Central Voices (7 Voices)
  voice_Kore: {
    text: 'สวัสดีค่ะ ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI ขวัญข้าวพร้อมพากย์เสียงนุ่มนวลอบอุ่นให้คุณค่ะ',
    voiceKey: 'Kore',
    stylePrompt: voiceMapping.Kore.personaPrompt,
  },
  voice_Mira: {
    text: 'ฮัลโหลทุกคน! มายด์มาแล้วค่ะ วันนี้มีเรื่องสนุกๆ สดใสน่ารัก และไอเดียใหม่ๆ มาฝากเพียบเลยน้า!',
    voiceKey: 'Mira',
    stylePrompt: voiceMapping.Mira.personaPrompt,
  },
  voice_Elena: {
    text: 'สวัสดีค่ะ ลลิตาพร้อมนำเสนอข้อมูลธุรกิจและบทบรรยายระดับมืออาชีพที่น่าเชื่อถือค่ะ',
    voiceKey: 'Elena',
    stylePrompt: voiceMapping.Elena.personaPrompt,
  },
  voice_Puck: {
    text: 'สวัสดีครับทุกคน! วันนี้อยู่กับพีท พร้อมลุยไปกับทุกคอนเทนต์สุดมันส์และน่าตื่นเต้นครับ!',
    voiceKey: 'Puck',
    stylePrompt: voiceMapping.Puck.personaPrompt,
  },
  voice_Fenrir: {
    text: 'ในโลกแห่งความลึกลับและการผจญภัยอันยิ่งใหญ่... เตรียมพบกับความระทึกขวัญไปกับผม ภูผา ครับ',
    voiceKey: 'Fenrir',
    stylePrompt: voiceMapping.Fenrir.personaPrompt,
  },
  voice_Charon: {
    text: 'สวัสดีครับท่านผู้ฟัง ขอต้อนรับเข้าสู่รายงานข่าวและบทบรรยายสารคดีประจำวันครับ',
    voiceKey: 'Charon',
    stylePrompt: voiceMapping.Charon.personaPrompt,
  },
  voice_Zephyr: {
    text: 'สวัสดีครับ สตูดิโอพากย์เสียง AI โทนเสียงสบายๆ ทันสมัย เป็นธรรมชาติ เหมาะกับทุกงานนำเสนอครับ',
    voiceKey: 'Zephyr',
    stylePrompt: voiceMapping.Zephyr.personaPrompt,
  },

  // Styles (14 Presets)
  'style_female-sweet': {
    text: 'สวัสดีค่ะ วันนี้น้องมีสิ่งดีๆ มาบอกต่อ หวานละมุน อบอุ่นหัวใจมากๆ เลยนะคะ',
    voiceKey: 'Kore',
    stylePrompt: 'Sweet, gentle, soft, polite, and charming young Thai woman voice with warm melodic intonation',
  },
  'style_female-chic': {
    text: 'ฮัลโหลสาวๆ วันนี้จะพามารีวิวไอเทมตัวเด็ด ปังไม่ไหว สวยสับระดับตัวแม่เลยค่ะ!',
    voiceKey: 'Mira',
    stylePrompt: 'Confident, stylish, chic modern trendy Thai woman voice, upbeat and engaging for beauty reviews',
  },
  'style_female-anime': {
    text: 'เย้! ดีใจจังเลยที่ได้เจอกันในวันนี้นะคะ ไปลุยความสนุกด้วยกันเลยนะ โกๆ!',
    voiceKey: 'Mira',
    stylePrompt: 'Playful, cute, bubbly, kawaii anime girl voice in Thai with cheerful high-spirited expression',
  },
  'style_female-professional': {
    text: 'ขอต้อนรับทุกท่านสู่การนำเสนอผลประกอบการและทิศทางการดำเนินธุรกิจประจำปีค่ะ',
    voiceKey: 'Elena',
    stylePrompt: 'Professional, articulate, confident corporate businesswoman voice in Thai, authoritative and trustworthy',
  },
  'style_female-mother': {
    text: 'หลับตาลงนะลูกนะ คืนนี้แม่มีนิทานแสนอบอุ่นมาเล่าให้ฟัง ฝันดีนะจ๊ะคนเก่ง',
    voiceKey: 'Kore',
    stylePrompt: 'Warm, loving, caring motherly voice in Thai, soothing, tender, comforting narration',
  },
  'style_female-live': {
    text: 'กรี๊ดด ทักทายทุกคนในไลฟ์จ้า! วันนี้จัดโปรไฟลุก ลดสูงสุดเจ็ดสิบเปอร์เซ็นต์ กดใส่ตะกร้าด่วนเลยจ้า!',
    voiceKey: 'Isan_Female',
    stylePrompt: 'High-energy, fast-paced, enthusiastic live seller woman voice in Thai, exciting promotional delivery',
  },
  'style_female-seductive': {
    text: 'เสน่ห์อันน่าหลงใหลที่ยากจะต้านทาน... สัมผัสความหรูหราที่คุณคู่ควร ได้แล้ววันนี้ค่ะ',
    voiceKey: 'Elena',
    stylePrompt: 'Alluring, elegant, smooth, sophisticated whispery female voice with deep charm',
  },
  'style_female-relax': {
    text: 'ค่อยๆ หายใจเข้าลึกๆ ผ่อนคลายร่างกาย ปล่อยวางความเหนื่อยล้าทั้งหมดลงนะคะ',
    voiceKey: 'Kore',
    stylePrompt: 'Soft-spoken, whispery, serene female spa wellness guide voice, calm and deeply relaxing ASMR tones',
  },
  style_commercial: {
    text: 'โปรโมชั่นสุดพิเศษเฉพาะสัปดาห์นี้เท่านั้น! ลดกระหน่ำคุ้มสุดๆ รีบสั่งซื้อเลยครับ!',
    voiceKey: 'Puck',
    stylePrompt: 'Energetic, persuasive, and enthusiastic commercial voiceover',
  },
  style_movie: {
    text: 'ในโลกที่ความหวังกำลังจะหมดสิ้น... มหาศึกครั้งสุดท้าย กำลังจะเริ่มต้นขึ้น ณ บัดนี้',
    voiceKey: 'Fenrir',
    stylePrompt: 'Deep, dramatic, suspenseful epic movie trailer narrator voice',
  },
  style_documentary: {
    text: 'ท่ามกลางผืนป่าอันกว้างใหญ่ ธรรมชาติได้สรรค์สร้างความมหัศจรรย์แห่งชีวิตไว้นับพันปี',
    voiceKey: 'Charon',
    stylePrompt: 'Calm, thoughtful, profound Nature documentary narrator voice',
  },
  style_story: {
    text: 'กาลครั้งหนึ่งนานมาแล้ว ในดินแดนแห่งสายรุ้ง มีเจ้ากระต่ายน้อยออกเดินทางตามหาดวงดาว!',
    voiceKey: 'Puck',
    stylePrompt: 'Playful, expressive, warm storybook fairytale narrator',
  },
  style_news: {
    text: 'สำนักข่าวรายงานความคืบหน้าสถานการณ์เศรษฐกิจและนวัตกรรมเทคโนโลยีล่าสุดประจำวันนี้ครับ',
    voiceKey: 'Charon',
    stylePrompt: 'Authoritative, clear, objective professional news anchor voice',
  },
  style_meditation: {
    text: 'กำหนดลมหายใจเข้าช้าๆ... รับความสงบสุข... และผ่อนลมหายใจออก อย่างเบาสบาย',
    voiceKey: 'Zephyr',
    stylePrompt: 'Gentle, soothing, whispered and serene meditation guide voice',
  },
};

// Deduplicate concurrent sample generation requests
const pendingSamples = new Map<string, Promise<Buffer>>();

// 1.5 Real Studio Preview Endpoint (Bundled static + /tmp serverless cache with valid RIFF WAV generation)
app.get('/api/tts/sample/:id', async (req, res) => {
  const sampleId = req.params.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const candidatePaths = isVercel
    ? [
        path.join(WRITABLE_PREVIEWS_DIR, `${sampleId}.wav`),
        path.join(BUNDLED_PREVIEWS_DIR, `${sampleId}.wav`),
      ]
    : [path.join(BUNDLED_PREVIEWS_DIR, `${sampleId}.wav`)];

  // 1. Serve from disk/tmp if valid RIFF WAV exists
  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const existing = fs.readFileSync(filePath);
        if (existing.length > 44 && existing.subarray(0, 4).toString('ascii') === 'RIFF') {
          res.setHeader('Content-Type', 'audio/wav');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.send(existing);
          return;
        }
      } catch {
        // Fall through to next candidate or regenerate
      }
    }
  }

  const sampleInfo = SAMPLE_DEFINITIONS[sampleId];
  if (!sampleInfo) {
    res.status(404).json({ error: 'Sample not found' });
    return;
  }

  try {
    let genPromise = pendingSamples.get(sampleId);
    if (!genPromise) {
      const voiceMeta = voiceMapping[sampleInfo.voiceKey] || voiceMapping.Kore;
      const writableTarget = path.join(WRITABLE_PREVIEWS_DIR, `${sampleId}.wav`);
      genPromise = synthesizeSingleSpeakerAudio(
        sampleInfo.text,
        voiceMeta.apiVoice,
        sampleInfo.stylePrompt
      ).then(({ wavBuffer }) => {
        try {
          fs.mkdirSync(WRITABLE_PREVIEWS_DIR, { recursive: true });
          fs.writeFileSync(writableTarget, wavBuffer);
        } catch (writeErr) {
          console.warn('Sample cache write skipped:', writeErr);
        }
        return wavBuffer;
      });
      pendingSamples.set(sampleId, genPromise);
    }

    const wavBuffer = await genPromise;
    pendingSamples.delete(sampleId);
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(wavBuffer);
  } catch (err: any) {
    pendingSamples.delete(sampleId);
    console.warn('On-demand sample generation error:', err?.message);
    res.status(503).json({ error: 'Audio sample generating, please retry in a moment' });
  }
});

// 2. Intelligent Regional Dialect Translation Endpoint (Central -> North / Isan / South)
app.post('/api/dialect/translate', async (req, res) => {
  try {
    const {
      text,
      targetRegion = 'northern',
      gender = 'female',
    } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Text is required for translation' });
      return;
    }

    if (targetRegion === 'central') {
      const harmonized = translateCentralToDialect(text, 'central', gender).translatedText;
      res.json({
        success: true,
        translatedText: harmonized,
        region: 'central',
      });
      return;
    }

    const voiceKeyMap: Record<string, { female: string; male: string }> = {
      northern: { female: 'Lanna_Female', male: 'Lanna_Male' },
      isan: { female: 'Isan_Female', male: 'Isan_Male' },
      southern: { female: 'Southern_Female', male: 'Southern_Male' },
    };

    const targetPair = voiceKeyMap[targetRegion] || voiceKeyMap.northern;
    const voiceKey = gender === 'male' ? targetPair.male : targetPair.female;

    const { spokenText } = await adaptScriptToVoiceDialect(text, voiceKey, true);

    res.json({
      success: true,
      translatedText: spokenText,
      targetRegion,
    });
  } catch (err: any) {
    console.error('Dialect translation error:', err);
    res.status(500).json({
      error: err?.message || 'Translation failed',
      fallbackRequired: true,
    });
  }
});

// 3. AI Voiceover Script Generator
app.post('/api/script/ai-generate', async (req, res) => {
  try {
    const {
      topic = 'แนะนำเครื่องดื่มกาแฟสดพรีเมียม',
      type = 'commercial',
      tone = 'น่าตื่นเต้นและเป็นมิตร',
      targetDuration = '30s',
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

    const response = await getAiClient().models.generateContent({
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

// Setup Vite or static serving when running as a standalone Node/Express server (not on Vercel Serverless)
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
