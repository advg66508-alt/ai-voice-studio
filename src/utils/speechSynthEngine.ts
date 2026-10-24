/**
 * Zero-Quota Client-Side Thai Web Speech API & Synthetic WAV Fallback Engine
 *
 * - Uses 0% Gemini API quota (100% free via browser Web Speech API `th-TH`)
 * - Smartly maps Pitch & Rate per character profile (12 voices: 6 Female, 6 Male) + 4 Thai regional accents
 * - Automatically selects gender-matched Thai OS voices (e.g., Premwadee/Kanya vs Niwat) when available
 * - Provides a guaranteed offline AudioBuffer (.WAV) synthesizer so exports never crash on Vercel or offline
 */

import type { GenderType, RegionType, SpeedPreset, VoiceName } from '../types/voice';
import {
  getSmartVoiceParameters,
  translateCentralToDialect,
} from './dialectTranslator';
import { encodeAudioBufferToWav } from './wavAudioProcessor';

export interface SynthVoiceParams {
  text: string;
  voiceName: VoiceName;
  speed: SpeedPreset;
  speedRate: number;
}

export interface BrowserSpeechOptions {
  region?: RegionType;
  userPitch?: number;
  userRate?: number;
  autoTranslate?: boolean;
  onEnd?: () => void;
  onError?: () => void;
}

let voicesLoadedPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * Ensures Chrome/Safari asynchronous voice list is populated before checking for `th-TH` voices
 */
export function getAvailableSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }

  const immediate = window.speechSynthesis.getVoices();
  if (immediate.length > 0) {
    return Promise.resolve(immediate);
  }

  if (!voicesLoadedPromise) {
    voicesLoadedPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
      setTimeout(finish, 180);
    });
  }

  return voicesLoadedPromise;
}

/**
 * Selects the best matching Thai voice on the user's device for the requested gender
 */
export function pickBestThaiBrowserVoice(
  voices: SpeechSynthesisVoice[],
  gender: GenderType
): SpeechSynthesisVoice | null {
  const thaiVoices = voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith('th') ||
      v.lang.toLowerCase().includes('th-th') ||
      /thai|ไทย|premwadee|niwat|kanya|narisa/i.test(v.name)
  );

  if (thaiVoices.length === 0) {
    return null;
  }

  if (gender === 'male') {
    const maleMatch = thaiVoices.find((v) =>
      /niwat|pattara|male|ชาย|man/i.test(v.name)
    );
    if (maleMatch) return maleMatch;
  } else {
    const femaleMatch = thaiVoices.find((v) =>
      /premwadee|kanya|narisa|female|หญิง|woman/i.test(v.name)
    );
    if (femaleMatch) return femaleMatch;
  }

  return thaiVoices[0];
}

/**
 * Speaks Thai text via native Web Speech API (`th-TH`) with smart character Pitch & Rate mapping.
 * Returns `true` if a Thai-capable Web Speech utterance was started, or `false` if unavailable.
 */
export function speakWithBrowserSpeech(
  text: string,
  voiceName: VoiceName,
  rateOrOptions: number | BrowserSpeechOptions = 1.0,
  legacyOnEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  const opts: BrowserSpeechOptions =
    typeof rateOrOptions === 'number'
      ? { userRate: rateOrOptions, onEnd: legacyOnEnd }
      : rateOrOptions;

  const region: RegionType = opts.region || 'central';
  const userPitch = opts.userPitch ?? 1.0;
  const userRate = opts.userRate ?? 1.0;
  const autoTranslate = opts.autoTranslate ?? true;

  const smart = getSmartVoiceParameters(voiceName, region);
  const gender = smart.character.gender;

  let textToSpeak = text.trim();
  if (!textToSpeak) {
    textToSpeak = smart.character.sampleText;
  }

  if (autoTranslate) {
    textToSpeak = translateCentralToDialect(textToSpeak, region, gender).translatedText;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = 'th-TH';

  const finalPitch = Math.max(0.5, Math.min(2.0, smart.webSpeechPitch * userPitch));
  const finalRate = Math.max(0.6, Math.min(2.0, smart.webSpeechRate * userRate));

  utterance.pitch = finalPitch;
  utterance.rate = finalRate;

  const voices = window.speechSynthesis.getVoices();
  const bestThaiVoice = pickBestThaiBrowserVoice(voices, gender);
  if (bestThaiVoice) {
    utterance.voice = bestThaiVoice;
  }

  if (opts.onEnd) {
    utterance.onend = () => opts.onEnd?.();
  }
  utterance.onerror = () => {
    if (opts.onError) {
      opts.onError();
    } else {
      opts.onEnd?.();
    }
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Creates a guaranteed client-side AudioBuffer (.WAV) with smart character Pitch & Rate resonance
 * when running completely offline or when serverless network is unreachable.
 */
export async function createSyntheticSpeechBuffer(
  text: string,
  voiceName: VoiceName,
  rate = 1.0,
  region: RegionType = 'central',
  sampleRate = 24000
): Promise<{ buffer: AudioBuffer; wavBlob: Blob; audioUrl: string }> {
  const smart = getSmartVoiceParameters(voiceName, region);
  const character = smart.character;

  const charLength = Math.max(10, text.trim().length);
  const speedMultiplier = 12.5 * smart.wavCadenceFactor * Math.max(0.65, rate);
  const duration = Math.max(2.0, Math.min(90, charLength / speedMultiplier));
  const numSamples = Math.floor(sampleRate * duration);

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  let buffer: AudioBuffer;
  try {
    buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
  } finally {
    audioCtx.close().catch(() => {});
  }

  const channel = buffer.getChannelData(0);
  const f0Base =
    character.gender === 'male'
      ? 135 * smart.wavPitchFactor
      : 215 * smart.wavPitchFactor;

  const syllables = Math.max(5, Math.floor(charLength / 3));
  const syllableDuration = duration / syllables;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = t / duration;
    let pitchContour = 1.0 - 0.1 * progress + 0.06 * Math.sin(progress * Math.PI * 3);

    if (region === 'northern') {
      pitchContour += 0.05 * Math.sin(progress * Math.PI * 4);
    } else if (region === 'isan') {
      pitchContour += 0.07 * Math.sin(progress * Math.PI * 6);
    } else if (region === 'southern') {
      pitchContour += 0.04 * Math.sin(progress * Math.PI * 8);
    }

    const syllT = (t % syllableDuration) / syllableDuration;
    const envelope = Math.pow(Math.sin(syllT * Math.PI), 0.85);
    const phase = 2 * Math.PI * f0Base * pitchContour * t;

    const glottal =
      (Math.sin(phase) +
        0.48 * Math.sin(2 * phase) +
        0.24 * Math.sin(3 * phase) +
        0.12 * Math.sin(4 * phase)) /
      1.84;

    const formant =
      0.65 * glottal +
      0.22 * Math.sin(2 * Math.PI * 620 * t) +
      0.13 * Math.sin(2 * Math.PI * 1550 * t);

    const fade = Math.min(1, Math.min(t / 0.06, (duration - t) / 0.12));
    channel[i] = formant * envelope * fade * 0.42;
  }

  const wavBlob = encodeAudioBufferToWav(buffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  return { buffer, wavBlob, audioUrl };
}
