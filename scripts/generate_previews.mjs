import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PREVIEW_DIR = './public/audio/previews';
fs.mkdirSync(PREVIEW_DIR, { recursive: true });

function ensureWavBuffer(rawBuffer, defaultSampleRate = 24000) {
  if (
    rawBuffer.length >= 44 &&
    rawBuffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    rawBuffer.subarray(8, 12).toString('ascii') === 'WAVE'
  ) {
    return rawBuffer;
  }
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = defaultSampleRate * numChannels * (bitsPerSample / 8);
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
  header.writeUInt32LE(defaultSampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, rawBuffer]);
}

const SAMPLES = [
  {
    id: 'voice_Lanna_Female',
    text: 'สวัสดีเจ้า ยินดีต้อนฮับสู่เจียงใหม่เน้อเจ้า น้องบัวตองอู้กำเมืองม่วนๆ ลำแต้ๆ ลำขนาดเน้อเจ้า',
    voice: 'Kore',
    style: 'Authentic native Northern Thai woman from Chiang Mai speaking genuine Kam Mueang dialect with sweet melodic Lanna charm',
  },
  {
    id: 'voice_Lanna_Male',
    text: 'สุมาเต๊อะกั๊บ ยินดีจ้าดนักเน้อครับ อ้ายหนานเมืองยินดีต้อนฮับ อู้กำเมืองม่วนๆ อบอุ่นแต้ๆ กั๊บ',
    voice: 'Charon',
    style: 'Authentic native Northern Thai man from Chiang Mai speaking genuine Kam Mueang dialect with warm polite Lanna cadence',
  },
  {
    id: 'voice_Isan_Female',
    text: 'สะบายดีจ้าพี่น้อง! มาพ้อกับน้องคำแพงมื้อนี้ ตำบักหุ่งแซ่บหลาย ตาฮักคักอีหลีเด้อจ้า!',
    voice: 'Kore',
    style: 'Authentic native Northeastern Thai Isan woman speaking genuine Isan dialect with lively cheerful musical inflection',
  },
  {
    id: 'voice_Isan_Male',
    text: 'สะบายดีเด้อครับพี่น้อง! มื้อนี้อ้ายทิดทศพามาม่วนซื่นโฮแซว เว้าอีสานคักอีหลีเด้อครับพี่น้อง!',
    voice: 'Puck',
    style: 'Authentic native Northeastern Thai Isan man speaking genuine Isan dialect with upbeat jovial local charisma',
  },
  {
    id: 'voice_Southern_Female',
    text: 'หวัดดีค่ะพี่น้องเหอ! วันนี้น้องนุ้ยมาแหลงใต้ให้ฟัง แกงส้มร้านนี้หรอยจังหู้นิ หรอยอย่างแรง ลองชิมแลตะน้องเหอ!',
    voice: 'Kore',
    style: 'Authentic native Southern Thai woman from Nakhon Si Thammarat speaking real Pak Tai dialect with brisk punchy staccato cadence',
  },
  {
    id: 'voice_Southern_Male',
    text: 'หวัดดีคับพี่น้องชาวใต้! พี่บ่าวหลวงมาแหลงใต้หรอยๆ คมเข้มจริงใจ หรอยอย่างแรงนิคับพี่น้อง!',
    voice: 'Fenrir',
    style: 'Authentic native Southern Thai man speaking real Pak Tai dialect with bold crisp rapid Southern Thai intonation',
  },
  { id: 'voice_Kore', text: 'สวัสดีค่ะ ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI ขวัญข้าวพร้อมพากย์เสียงนุ่มนวลอบอุ่นให้คุณค่ะ', voice: 'Kore', style: 'Warm, gentle, melodic standard Central Thai female voice' },
  { id: 'voice_Mira', text: 'ฮัลโหลทุกคน! มายด์มาแล้วค่ะ วันนี้มีเรื่องสนุกๆ สดใสน่ารัก และไอเดียใหม่ๆ มาฝากเพียบเลยน้า!', voice: 'Kore', style: 'Youthful, bright, cheerful, energetic young Thai female voice' },
  { id: 'voice_Elena', text: 'สวัสดีค่ะ ลลิตาพร้อมนำเสนอข้อมูลธุรกิจและบทบรรยายระดับมืออาชีพที่น่าเชื่อถือค่ะ', voice: 'Zephyr', style: 'Sophisticated, confident, professional Central Thai businesswoman voice' },
  { id: 'voice_Puck', text: 'สวัสดีครับทุกคน! วันนี้อยู่กับพีท พร้อมลุยไปกับทุกคอนเทนต์สุดมันส์และน่าตื่นเต้นครับ!', voice: 'Puck', style: 'Energetic, lively, youthful Central Thai male voice' },
  { id: 'voice_Fenrir', text: 'ในโลกแห่งความลึกลับและการผจญภัยอันยิ่งใหญ่... เตรียมพบกับความระทึกขวัญไปกับผม ภูผา ครับ', voice: 'Fenrir', style: 'Deep, dramatic, powerful Central Thai male voice' },
  { id: 'voice_Charon', text: 'สวัสดีครับท่านผู้ฟัง ขอต้อนรับเข้าสู่รายงานข่าวและบทบรรยายสารคดีประจำวันครับ', voice: 'Charon', style: 'Calm, authoritative, professional Central Thai male news anchor voice' },
  { id: 'voice_Zephyr', text: 'สวัสดีครับ สตูดิโอพากย์เสียง AI โทนเสียงสบายๆ ทันสมัย เป็นธรรมชาติ เหมาะกับทุกงานนำเสนอครับ', voice: 'Zephyr', style: 'Modern, balanced, natural conversational Central Thai voice' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
  console.log(`Starting audio preview generation for ${SAMPLES.length} items...`);

  for (const item of SAMPLES) {
    const filePath = path.join(PREVIEW_DIR, `${item.id}.wav`);
    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath);
      if (existing.length > 44 && existing.subarray(0, 4).toString('ascii') === 'RIFF') {
        console.log(`[EXISTS] ${item.id}.wav already valid RIFF WAV (${existing.length} bytes), skipping.`);
        continue;
      }
    }

    console.log(`[GENERATING] ${item.id}...`);
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: item.text,
                speechMetadata: { style: item.style },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: item.voice } } },
        },
      });

      const b64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (b64) {
        const wavBuf = ensureWavBuffer(Buffer.from(b64, 'base64'));
        fs.writeFileSync(filePath, wavBuf);
        console.log(`[SUCCESS] Saved ${item.id}.wav (${wavBuf.length} bytes)`);
      }
    } catch (err) {
      console.warn(`[WARN] Failed ${item.id}: ${err.message?.slice(0, 120)}`);
    }
    await sleep(5000);
  }
}

run();
