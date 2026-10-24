/**
 * Web Audio Pitch, Speed & 16-bit PCM .WAV Processor
 *
 * - Decodes both Gemini WAV (24kHz PCM) and Fallback Engine MP3 seamlessly
 * - Applies accurate Pitch shifting (Male deep resonance vs Female bright clarity + user fine-tuning)
 * - Applies WSOLA Pitch-Preserving Time-Stretching so Speed changes never cause chipmunk distortion
 * - Applies subtle vocal warmth EQ when pitching down fallback voices for natural Male timbre
 * - Encodes output into a standard 16-bit PCM RIFF .WAV Blob ready for playback and download
 */

export interface WavRenderOptions {
  baseVoicePitch?: number;
  baseVoiceCadence?: number;
  userPitch?: number;
  userSpeed?: number;
  gender?: 'female' | 'male';
  isFallback?: boolean;
}

export interface WavRenderResult {
  processedBuffer: AudioBuffer;
  wavBlob: Blob;
  wavUrl: string;
  durationSeconds: number;
}

/**
 * Decodes a base64 audio string (WAV or MP3) into a Web Audio AudioBuffer
 */
export async function decodeBase64ToAudioBuffer(
  base64Data: string,
  mimeType = 'audio/wav'
): Promise<AudioBuffer> {
  const binary = atob(base64Data);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType });
  const arrayBuffer = await blob.arrayBuffer();

  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  try {
    return await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close().catch(() => {});
  }
}

/**
 * Pitch-Preserving Time-Stretching via Waveform Similarity Overlap-Add (WSOLA)
 * Changes speaking speed without altering fundamental pitch (F0).
 */
export function timeStretchWSOLA(inputBuffer: AudioBuffer, speedFactor: number): AudioBuffer {
  const clampedRate = Math.max(0.45, Math.min(2.5, speedFactor || 1.0));
  if (Math.abs(clampedRate - 1.0) <= 0.015) {
    return inputBuffer;
  }

  const sampleRate = inputBuffer.sampleRate;
  const numChannels = inputBuffer.numberOfChannels;
  const inLength = inputBuffer.length;
  const outLength = Math.max(256, Math.round(inLength / clampedRate));

  let winSize = Math.floor(sampleRate * 0.036);
  if (winSize % 2 !== 0) winSize -= 1;
  winSize = Math.max(256, winSize);

  const hopOut = winSize / 2;
  const searchDelta = Math.floor(sampleRate * 0.01);
  const corrLen = Math.min(hopOut, Math.floor(sampleRate * 0.012));

  if (inLength <= winSize * 2) {
    return inputBuffer;
  }

  const hann = new Float32Array(winSize);
  for (let n = 0; n < winSize; n++) {
    hann[n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / winSize));
  }

  const inChannels: Float32Array[] = [];
  const outChannels: Float32Array[] = [];
  const normWeight = new Float32Array(outLength);

  for (let c = 0; c < numChannels; c++) {
    inChannels.push(inputBuffer.getChannelData(c));
    outChannels.push(new Float32Array(outLength));
  }

  const refChannel = inChannels[0];
  let prevInPos = 0;
  let outPos = 0;

  while (outPos < outLength - hopOut) {
    let bestInPos = 0;
    if (outPos > 0) {
      const targetInPos = Math.round(outPos * clampedRate);
      const naturalContPos = Math.min(inLength - winSize, prevInPos + hopOut);
      const minCand = Math.max(0, targetInPos - searchDelta);
      const maxCand = Math.min(inLength - winSize, targetInPos + searchDelta);

      if (maxCand <= minCand) {
        bestInPos = Math.max(0, Math.min(inLength - winSize, targetInPos));
      } else {
        let bestScore = -Infinity;
        bestInPos = Math.max(0, Math.min(inLength - winSize, targetInPos));
        for (let cand = minCand; cand <= maxCand; cand += 2) {
          let dot = 0;
          let energy = 1e-7;
          for (let k = 0; k < corrLen; k += 2) {
            const a = refChannel[naturalContPos + k];
            const b = refChannel[cand + k];
            dot += a * b;
            energy += b * b;
          }
          const score = dot / Math.sqrt(energy);
          if (score > bestScore) {
            bestScore = score;
            bestInPos = cand;
          }
        }
      }
    }

    const writeCount = Math.min(winSize, outLength - outPos, inLength - bestInPos);
    for (let c = 0; c < numChannels; c++) {
      const src = inChannels[c];
      const dst = outChannels[c];
      for (let n = 0; n < writeCount; n++) {
        dst[outPos + n] += src[bestInPos + n] * hann[n];
      }
    }
    for (let n = 0; n < writeCount; n++) {
      normWeight[outPos + n] += hann[n];
    }

    prevInPos = bestInPos;
    outPos += hopOut;
  }

  for (let c = 0; c < numChannels; c++) {
    const dst = outChannels[c];
    for (let i = 0; i < outLength; i++) {
      if (normWeight[i] > 0.05) {
        dst[i] /= normWeight[i];
      }
    }
  }

  const offlineCtx = new OfflineAudioContext(numChannels, outLength, sampleRate);
  const stretched = offlineCtx.createBuffer(numChannels, outLength, sampleRate);
  for (let c = 0; c < numChannels; c++) {
    stretched.getChannelData(c).set(outChannels[c]);
  }
  return stretched;
}

/**
 * Applies combined Pitch & Speed transformations + subtle Male/Female vocal EQ shaping,
 * then encodes a crisp 16-bit PCM RIFF .WAV Blob.
 */
export async function renderProcessedWav(
  rawBuffer: AudioBuffer,
  options: WavRenderOptions = {}
): Promise<WavRenderResult> {
  const {
    baseVoicePitch = 1.0,
    baseVoiceCadence = 1.0,
    userPitch = 1.0,
    userSpeed = 1.0,
    gender = 'female',
    isFallback = false,
  } = options;

  const effectivePitch = Math.max(0.6, Math.min(1.45, baseVoicePitch * userPitch));
  const effectiveSpeed = Math.max(0.55, Math.min(1.85, baseVoiceCadence * userSpeed));

  let workingBuffer = rawBuffer;
  const sampleRate = rawBuffer.sampleRate;
  const numChannels = rawBuffer.numberOfChannels;

  // Step 1: Resample to shift fundamental Pitch (F0)
  if (Math.abs(effectivePitch - 1.0) > 0.015) {
    const inLen = rawBuffer.length;
    const resampledLen = Math.max(256, Math.round(inLen / effectivePitch));
    const tmpCtx = new OfflineAudioContext(numChannels, resampledLen, sampleRate);
    const resampled = tmpCtx.createBuffer(numChannels, resampledLen, sampleRate);

    for (let c = 0; c < numChannels; c++) {
      const src = rawBuffer.getChannelData(c);
      const dst = resampled.getChannelData(c);
      const maxIdx = inLen - 1;
      for (let i = 0; i < resampledLen; i++) {
        const srcPos = i * effectivePitch;
        const idx0 = Math.min(maxIdx, Math.floor(srcPos));
        const idx1 = Math.min(maxIdx, idx0 + 1);
        const frac = srcPos - idx0;
        dst[i] = src[idx0] * (1 - frac) + src[idx1] * frac;
      }
    }
    workingBuffer = resampled;
  }

  // Step 2: Compensate duration change from resampling and apply exact target Speed via WSOLA
  const wsolaRate = effectiveSpeed / effectivePitch;
  workingBuffer = timeStretchWSOLA(workingBuffer, wsolaRate);

  // Step 3: Subtle vocal warmth EQ when Male voice is synthesized via Fallback Engine
  if (isFallback && gender === 'male' && workingBuffer.length > 0) {
    const eqCtx = new OfflineAudioContext(numChannels, workingBuffer.length, sampleRate);
    const srcNode = eqCtx.createBufferSource();
    srcNode.buffer = workingBuffer;

    // Add natural chest warmth around 165Hz
    const lowShelf = eqCtx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 165;
    lowShelf.gain.value = 3.2;

    // Smooth upper sibilance after downward resampling
    const lowPass = eqCtx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 7600;

    srcNode.connect(lowShelf);
    lowShelf.connect(lowPass);
    lowPass.connect(eqCtx.destination);
    srcNode.start(0);

    workingBuffer = await eqCtx.startRendering();
  }

  const wavBlob = encodeAudioBufferToWav(workingBuffer);
  const wavUrl = URL.createObjectURL(wavBlob);

  return {
    processedBuffer: workingBuffer,
    wavBlob,
    wavUrl,
    durationSeconds: workingBuffer.duration,
  };
}

/**
 * Encodes a Web Audio AudioBuffer into a standard 16-bit PCM RIFF .WAV Blob
 */
export function encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataByteLength = numSamples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(arrayBuffer);

  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataByteLength, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const clamped = Math.max(-1, Math.min(1, channels[c][i]));
      const pcm16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      view.setInt16(offset, pcm16, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}
