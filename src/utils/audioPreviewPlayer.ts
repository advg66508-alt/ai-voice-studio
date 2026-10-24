/**
 * Zero-Quota Voice Talent Preview Player
 *
 * 1. Primary: Instant browser Web Speech API (`th-TH`) when native Thai OS voice is available (0ms latency, 0% API quota)
 * 2. Fallback: Keyless Thai audio stream + client-side character Pitch/Rate DSP (.WAV) so devices without OS Thai voice packs still hear crisp Thai speech with 0% Gemini API quota
 */

import type { RegionType, VoiceName } from '../types/voice';
import {
  getSmartVoiceParameters,
  translateCentralToDialect,
} from './dialectTranslator';
import {
  getAvailableSpeechVoices,
  pickBestThaiBrowserVoice,
  speakWithBrowserSpeech,
} from './speechSynthEngine';
import {
  decodeBase64ToAudioBuffer,
  renderProcessedWav,
} from './wavAudioProcessor';

let activeAudio: HTMLAudioElement | null = null;
let activePlayingId: string | null = null;
let activeAbortController: AbortController | null = null;
let globalStateCallback: ((isPlaying: boolean, playingId: string | null) => void) | null = null;
const processedPreviewCache = new Map<string, string>();

export interface PlayCharacterPreviewOptions {
  characterId: VoiceName;
  region?: RegionType;
  userPitch?: number;
  userSpeed?: number;
  customText?: string;
  onStateChange?: (isPlaying: boolean, playingId: string | null) => void;
}

export async function playCharacterPreview(options: PlayCharacterPreviewOptions): Promise<void> {
  const {
    characterId,
    region = 'central',
    userPitch = 1.0,
    userSpeed = 1.0,
    customText,
    onStateChange,
  } = options;

  const previewId = `voice_${characterId}_${region}`;

  // Clicking the active preview button toggles Stop
  if (activePlayingId === previewId) {
    stopPreviewAudio();
    onStateChange?.(false, null);
    return;
  }

  stopPreviewAudio();

  activePlayingId = previewId;
  globalStateCallback = onStateChange || null;
  onStateChange?.(true, previewId);

  const abortCtrl = new AbortController();
  activeAbortController = abortCtrl;

  const smart = getSmartVoiceParameters(characterId, region);
  const rawSample = customText?.trim() || smart.character.sampleText;
  const spokenSample = translateCentralToDialect(
    rawSample,
    region,
    smart.character.gender
  ).translatedText;

  const finishPlayback = () => {
    if (activePlayingId === previewId) {
      activePlayingId = null;
      activeAudio = null;
      onStateChange?.(false, null);
      globalStateCallback?.(false, null);
    }
  };

  // 1. Check if client browser has a native Thai Web Speech API voice installed (100% client-side, 0ms latency)
  const voices = await getAvailableSpeechVoices();
  if (abortCtrl.signal.aborted || activePlayingId !== previewId) return;

  const nativeThaiVoice = pickBestThaiBrowserVoice(voices, smart.character.gender);
  if (nativeThaiVoice) {
    const started = speakWithBrowserSpeech(spokenSample, characterId, {
      region,
      userPitch,
      userRate: userSpeed,
      autoTranslate: false,
      onEnd: finishPlayback,
      onError: () => {
        // Fallback to keyless WAV preview if speechSynthesis fails on mobile/iframe
        playKeylessWavPreview();
      },
    });
    if (started) return;
  }

  // 2. Keyless WAV preview fallback (for environments without Thai OS voice packs — still 0% Gemini API quota)
  async function playKeylessWavPreview() {
    if (abortCtrl.signal.aborted || activePlayingId !== previewId) return;

    const cacheKey = `${previewId}_${userPitch.toFixed(2)}_${userSpeed.toFixed(2)}`;
    const cachedUrl = processedPreviewCache.get(cacheKey);
    if (cachedUrl) {
      playAudioUrl(cachedUrl);
      return;
    }

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          text: spokenSample,
          voiceName: characterId,
          region,
          gender: smart.character.gender,
          autoTranslate: false,
        }),
      });

      const data = await res.json();
      if (abortCtrl.signal.aborted || activePlayingId !== previewId) return;

      if (data?.audioBase64) {
        const rawBuf = await decodeBase64ToAudioBuffer(
          data.audioBase64,
          data.mimeType || 'audio/mpeg'
        );
        const rendered = await renderProcessedWav(rawBuf, {
          baseVoicePitch: smart.wavPitchFactor,
          baseVoiceCadence: smart.wavCadenceFactor,
          userPitch,
          userSpeed,
          gender: smart.character.gender,
          eqProfile: smart.character.eqProfile,
          isFallback: true,
        });
        processedPreviewCache.set(cacheKey, rendered.wavUrl);
        playAudioUrl(rendered.wavUrl);
        return;
      }
    } catch {
      // Silently fall back to Web Speech utterance if network unreachable
    }

    if (!abortCtrl.signal.aborted && activePlayingId === previewId) {
      const ok = speakWithBrowserSpeech(spokenSample, characterId, {
        region,
        userPitch,
        userRate: userSpeed,
        autoTranslate: false,
        onEnd: finishPlayback,
      });
      if (!ok) finishPlayback();
    }
  }

  function playAudioUrl(url: string) {
    if (abortCtrl.signal.aborted || activePlayingId !== previewId) return;
    const audio = new Audio(url);
    activeAudio = audio;
    audio.onended = finishPlayback;
    audio.onerror = finishPlayback;
    audio.play().catch(finishPlayback);
  }

  await playKeylessWavPreview();
}

/**
 * Legacy helper maintained for compatibility with existing components
 */
export function playPreviewAudio(
  id: string,
  onStateChange?: (isPlaying: boolean, playingId: string | null) => void,
  fallbackText?: string,
  fallbackVoice?: VoiceName
): void {
  const voiceId = (fallbackVoice || id.replace(/^voice_/, '') || 'Kore') as VoiceName;
  void playCharacterPreview({
    characterId: voiceId,
    customText: fallbackText,
    onStateChange: (playing) => onStateChange?.(playing, playing ? id : null),
  });
}

export function stopPreviewAudio(): void {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  activePlayingId = null;
  globalStateCallback?.(false, null);
}

export function getActivePreviewId(): string | null {
  return activePlayingId;
}
