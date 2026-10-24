/**
 * Audio Preview Player Utility
 *
 * Plays real Gemini TTS studio voice & style samples directly from the server cache (/api/tts/sample/:id).
 * Guarantees that testing voices and styles produces authentic dialect accents and expressive emotional tones,
 * instead of flat monotone browser robot voices.
 */

import { VoiceName } from '../types/voice';
import { speakWithBrowserSpeech } from './speechSynthEngine';
import { applyVoiceCharacterShift, audioBufferToWav } from './audioMixer';

let activeAudio: HTMLAudioElement | null = null;
let activePlayingId: string | null = null;
let activeAbortController: AbortController | null = null;
let globalStateCallback: ((isPlaying: boolean, playingId: string | null) => void) | null = null;
const processedPreviewCache = new Map<string, string>();

export function playPreviewAudio(
  id: string,
  onStateChange?: (isPlaying: boolean, playingId: string | null) => void,
  fallbackText?: string,
  fallbackVoice?: VoiceName
): void {
  // If user clicked the same item that is currently playing: pause it
  if (activePlayingId === id) {
    stopPreviewAudio();
    onStateChange?.(false, null);
    return;
  }

  // Stop any previous audio or pending fetch
  stopPreviewAudio();

  activePlayingId = id;
  globalStateCallback = onStateChange || null;
  onStateChange?.(true, id);

  const abortCtrl = new AbortController();
  activeAbortController = abortCtrl;

  const fallbackToBrowser = () => {
    if (abortCtrl.signal.aborted) return;
    if (fallbackText && fallbackVoice) {
      speakWithBrowserSpeech(fallbackText, fallbackVoice, 1.0, () => {
        if (activePlayingId === id) {
          activePlayingId = null;
          activeAudio = null;
          onStateChange?.(false, null);
          globalStateCallback?.(false, null);
        }
      });
    } else {
      activePlayingId = null;
      activeAudio = null;
      onStateChange?.(false, null);
      globalStateCallback?.(false, null);
    }
  };

  const startPlaybackFromUrl = (playUrl: string) => {
    if (abortCtrl.signal.aborted || activePlayingId !== id) return;
    const audio = new Audio(playUrl);
    activeAudio = audio;

    audio.onended = () => {
      if (activePlayingId === id) {
        activePlayingId = null;
        activeAudio = null;
        onStateChange?.(false, null);
        globalStateCallback?.(false, null);
      }
    };

    audio.onerror = () => {
      fallbackToBrowser();
    };

    audio.play().catch(() => {
      fallbackToBrowser();
    });
  };

  const cachedUrl = processedPreviewCache.get(id);
  if (cachedUrl) {
    startPlaybackFromUrl(cachedUrl);
    return;
  }

  fetch(`/api/tts/sample/${id}`, { signal: abortCtrl.signal })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const pitchHeader = parseFloat(res.headers.get('X-Voice-Pitch') || '1');
      const cadenceHeader = parseFloat(res.headers.get('X-Voice-Cadence') || '1');
      const contentType = res.headers.get('Content-Type') || 'audio/wav';
      const arrayBuf = await res.arrayBuffer();

      if (abortCtrl.signal.aborted) return;

      let finalUrl: string;
      const needsShift =
        !isNaN(pitchHeader) &&
        !isNaN(cadenceHeader) &&
        (Math.abs(pitchHeader - 1.0) > 0.015 || Math.abs(cadenceHeader - 1.0) > 0.015);

      if (needsShift) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx: AudioContext = new AudioCtx();
        try {
          const decoded = await audioCtx.decodeAudioData(arrayBuf.slice(0));
          const shifted = applyVoiceCharacterShift(decoded, pitchHeader, cadenceHeader);
          const wavBlob = audioBufferToWav(shifted);
          finalUrl = URL.createObjectURL(wavBlob);
        } finally {
          audioCtx.close().catch(() => {});
        }
      } else {
        const blob = new Blob([arrayBuf], { type: contentType });
        finalUrl = URL.createObjectURL(blob);
      }

      processedPreviewCache.set(id, finalUrl);
      startPlaybackFromUrl(finalUrl);
    })
    .catch((err) => {
      if (err?.name === 'AbortError') return;
      console.warn(`Sample ${id} preview fallback:`, err);
      fallbackToBrowser();
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
