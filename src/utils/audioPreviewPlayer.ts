/**
 * Audio Preview Player Utility
 *
 * Plays real Gemini TTS studio voice & style samples directly from the server cache (/api/tts/sample/:id).
 * Guarantees that testing voices and styles produces authentic dialect accents and expressive emotional tones,
 * instead of flat monotone browser robot voices.
 */

import { VoiceName } from '../types/voice';
import { speakWithBrowserSpeech } from './speechSynthEngine';

let activeAudio: HTMLAudioElement | null = null;
let activePlayingId: string | null = null;
let globalStateCallback: ((isPlaying: boolean, playingId: string | null) => void) | null = null;

export function playPreviewAudio(
  id: string,
  onStateChange?: (isPlaying: boolean, playingId: string | null) => void,
  fallbackText?: string,
  fallbackVoice?: VoiceName
): void {
  // If user clicked the same item that is currently playing: pause it
  if (activeAudio && activePlayingId === id) {
    activeAudio.pause();
    activeAudio = null;
    activePlayingId = null;
    onStateChange?.(false, null);
    globalStateCallback?.(false, null);
    return;
  }

  // Stop any previous audio
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  activePlayingId = id;
  globalStateCallback = onStateChange || null;
  onStateChange?.(true, id);

  const sampleUrl = `/api/tts/sample/${id}`;
  const audio = new Audio(sampleUrl);
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
    console.warn(`Sample ${id} failed to load, falling back to local speech`);
    if (fallbackText && fallbackVoice) {
      speakWithBrowserSpeech(fallbackText, fallbackVoice, 1.0, () => {
        activePlayingId = null;
        activeAudio = null;
        onStateChange?.(false, null);
        globalStateCallback?.(false, null);
      });
    } else {
      activePlayingId = null;
      activeAudio = null;
      onStateChange?.(false, null);
      globalStateCallback?.(false, null);
    }
  };

  audio.play().catch((playErr) => {
    console.warn(`Audio play interrupted or error:`, playErr);
    if (fallbackText && fallbackVoice) {
      speakWithBrowserSpeech(fallbackText, fallbackVoice, 1.0, () => {
        activePlayingId = null;
        activeAudio = null;
        onStateChange?.(false, null);
        globalStateCallback?.(false, null);
      });
    } else {
      activePlayingId = null;
      activeAudio = null;
      onStateChange?.(false, null);
      globalStateCallback?.(false, null);
    }
  });
}

export function stopPreviewAudio(): void {
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
