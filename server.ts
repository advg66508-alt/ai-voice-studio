import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  STUDIO_CHARACTERS,
  getSmartVoiceParameters,
  translateCentralToDialect,
} from './src/utils/dialectTranslator.js';
import type { GenderType, RegionType, VoiceName } from './src/types/voice.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isVercel = Boolean(process.env.VERCEL);

app.use(express.json({ limit: '10mb' }));

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
 * Zero-Quota Keyless Thai Speech Synthesis Stream (0% Gemini API Quota, Vercel-Safe with 4.5s timeout)
 */
async function fetchKeylessThaiSpeechMp3(spokenText: string): Promise<Buffer> {
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
      const timeoutId = setTimeout(() => controller.abort(), 4500);
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
      throw lastErr instanceof Error ? lastErr : new Error('Keyless TTS stream unavailable');
    }
    buffers.push(chunkBuf);
  }

  return Buffer.concat(buffers);
}

function resolveCharacterId(voiceName?: string, gender?: GenderType): VoiceName {
  if (voiceName) {
    const exact = STUDIO_CHARACTERS.find((c) => c.id === voiceName);
    if (exact) return exact.id;
  }
  return gender === 'male' ? 'Puck' : 'Kore';
}

function normalizeRegion(region?: string): RegionType {
  if (region === 'northern' || region === 'isan' || region === 'southern') {
    return region;
  }
  return 'central';
}

// Health check endpoint (0% cloud LLM quota required)
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    engine: 'zero-quota-thai-tts',
    characters: STUDIO_CHARACTERS.length,
  });
});

// 1. Primary Zero-Quota Text-to-Speech Endpoint (.WAV pipeline source)
app.post('/api/tts/generate', async (req, res) => {
  const rawText = String(req.body?.text || '').trim();
  const safeRegion = normalizeRegion(req.body?.region);
  const requestedGender: GenderType = req.body?.gender === 'male' ? 'male' : 'female';
  const charId = resolveCharacterId(req.body?.voiceName, requestedGender);
  const autoTranslate = req.body?.autoTranslate !== false;

  const smart = getSmartVoiceParameters(charId, safeRegion);
  const effectiveGender = smart.character.gender;

  const baseInput = (rawText || smart.character.sampleText)
    .replace(/\[SFX:[^\]]+\]/gi, ' ')
    .replace(/<laugh>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const spokenText = autoTranslate
    ? translateCentralToDialect(baseInput, safeRegion, effectiveGender).translatedText
    : baseInput;

  try {
    const mp3Buffer = await fetchKeylessThaiSpeechMp3(spokenText || 'สวัสดีค่ะ');
    res.json({
      success: true,
      audioBase64: mp3Buffer.toString('base64'),
      mimeType: 'audio/mpeg',
      isFallback: true,
      clientSynthFallback: false,
      voicePitchFactor: smart.wavPitchFactor,
      voiceCadenceFactor: smart.wavCadenceFactor,
      webSpeechPitch: smart.webSpeechPitch,
      webSpeechRate: smart.webSpeechRate,
      eqProfile: smart.character.eqProfile,
      spokenText,
      wasDialectAdapted: spokenText !== baseInput,
      region: safeRegion,
      gender: effectiveGender,
      voiceName: charId,
      modelUsed: 'zero-quota-thai-engine',
    });
  } catch {
    // Error-free fallback: never return 500 or trigger red error boxes on Vercel
    res.json({
      success: true,
      clientSynthFallback: true,
      isFallback: true,
      mimeType: 'audio/wav',
      voicePitchFactor: smart.wavPitchFactor,
      voiceCadenceFactor: smart.wavCadenceFactor,
      webSpeechPitch: smart.webSpeechPitch,
      webSpeechRate: smart.webSpeechRate,
      eqProfile: smart.character.eqProfile,
      spokenText,
      wasDialectAdapted: spokenText !== baseInput,
      region: safeRegion,
      gender: effectiveGender,
      voiceName: charId,
      modelUsed: 'web-speech-client-fallback',
    });
  }
});

// 2. Voice Sample Preview Endpoint (Vercel /tmp safe, 0% Gemini quota)
const WRITABLE_PREVIEWS_DIR = path.join(os.tmpdir(), 'ai-voiceover-previews');

app.get('/api/tts/sample/:id', async (req, res) => {
  const sampleId = req.params.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const rawVoiceId = sampleId.replace(/^voice_/, '');
  const charId = resolveCharacterId(rawVoiceId);
  const smart = getSmartVoiceParameters(charId, 'central');
  const cachedMp3Path = path.join(WRITABLE_PREVIEWS_DIR, `${sampleId}.mp3`);

  if (fs.existsSync(cachedMp3Path)) {
    try {
      const cached = fs.readFileSync(cachedMp3Path);
      if (cached.length > 128) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('X-Voice-Pitch', String(smart.wavPitchFactor));
        res.setHeader('X-Voice-Cadence', String(smart.wavCadenceFactor));
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(cached);
        return;
      }
    } catch {
      // Regenerate below
    }
  }

  try {
    const mp3Buffer = await fetchKeylessThaiSpeechMp3(smart.character.sampleText);
    try {
      fs.mkdirSync(WRITABLE_PREVIEWS_DIR, { recursive: true });
      fs.writeFileSync(cachedMp3Path, mp3Buffer);
    } catch {
      // Ignore read-only fs errors
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Voice-Pitch', String(smart.wavPitchFactor));
    res.setHeader('X-Voice-Cadence', String(smart.wavCadenceFactor));
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(mp3Buffer);
  } catch {
    res.status(204).end();
  }
});

// 3. Deterministic Regional Dialect Translation Endpoint (0% API Quota)
app.post('/api/dialect/translate', (req, res) => {
  const text = String(req.body?.text || '').trim();
  const targetRegion = normalizeRegion(req.body?.targetRegion);
  const gender: GenderType = req.body?.gender === 'male' ? 'male' : 'female';

  const result = translateCentralToDialect(text, targetRegion, gender);
  res.json({
    success: true,
    translatedText: result.translatedText,
    replacedWordsCount: result.replacedWordsCount,
    targetRegion,
    gender,
  });
});

// Standalone Express + Vite middleware runner (skipped automatically when imported on Vercel)
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
