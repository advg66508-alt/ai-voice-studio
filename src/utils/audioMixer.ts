/**
 * Audio Mixer, Ambient Synthesizer & Sound Effects (SFX) Engine
 * using Web Audio API (OfflineAudioContext).
 *
 * Supports:
 * - Ambient BGM (Cafe, Nature, Ocean, Lo-Fi, Cinematic)
 * - Specific SFX markers inserted in scripts:
 *   [SFX:ปรบมือ] (Applause), [SFX:แจ้งเตือน] (Ding), <laugh> (Laugh),
 *   [SFX:แคชเชียร์] (Cha-Ching), [SFX:ฉลอง] (Ta-Da), [SFX:วู้ช] (Whoosh), [SFX:กลองระทึก] (Drumroll)
 */

export type AmbientSoundType = 'none' | 'cafe' | 'nature' | 'ocean' | 'lofi' | 'cinematic';

export interface AmbientPreset {
  id: AmbientSoundType;
  title: string;
  subtitle: string;
  icon: string;
  defaultVolume: number;
  description: string;
}

export const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    id: 'none',
    title: 'ไม่มีเสียงพื้นหลัง',
    subtitle: 'เฉพาะเสียงพูดพากย์ล้วนๆ คมชัด',
    icon: '🚫',
    defaultVolume: 0,
    description: 'บันทึกเฉพาะเสียงพูดพากย์ ไม่ใส่เสียงเพลงหรือเสียงบรรยากาศ',
  },
  {
    id: 'cafe',
    title: 'บรรยากาศในคาเฟ่',
    subtitle: 'Cafe Ambience • เสียงอบอุ่น ชิลล์ๆ',
    icon: '☕',
    defaultVolume: 0.18,
    description: 'เสียงบรรยากาศในร้านกาแฟ เสียงแก้ว เสียงผู้คนคุยกันเบาๆ ชิลล์ๆ',
  },
  {
    id: 'nature',
    title: 'ธรรมชาติและสายฝน',
    subtitle: 'Nature & Gentle Rain • เสียงฝนพรำ ผ่อนคลาย',
    icon: '🌿',
    defaultVolume: 0.16,
    description: 'เสียงฝนพรำอ่อนๆ และสายลมธรรมชาติ ผ่อนคลาย ละมุนใจ',
  },
  {
    id: 'ocean',
    title: 'คลื่นทะเลริมหาด',
    subtitle: 'Ocean Waves & Breeze • สดชื่น ปลอดโปร่ง',
    icon: '🌊',
    defaultVolume: 0.20,
    description: 'เสียงคลื่นซัดหาดทรายอย่างนุ่มนวลเป็นจังหวะ ชวนผ่อนคลาย',
  },
  {
    id: 'lofi',
    title: 'ดนตรี Lo-Fi ชิลล์ๆ',
    subtitle: 'Lo-Fi Chill Beats • คอร์ดเปียโนอบอุ่น',
    icon: '🎵',
    defaultVolume: 0.22,
    description: 'ทำนองดนตรี Lo-Fi อบอุ่น ฟังสบาย เหมาะกับคอนเทนต์บิวตี้และไลฟ์สไตล์',
  },
  {
    id: 'cinematic',
    title: 'ดนตรีภาพยนตร์ทรงพลัง',
    subtitle: 'Cinematic Epic • เบสลึก ระทึกขวัญ ดราม่า',
    icon: '🎬',
    defaultVolume: 0.20,
    description: 'ดนตรีแอมเบียนต์ลึกทรงพลัง ดึงอารมณ์ เหมาะกับตัวอย่างหนังและสารคดี',
  },
];

/* ----------------------------------------------------
   Sound Effects (SFX) Presets & Parsing
   ---------------------------------------------------- */

export type SFXType = 'applause' | 'ding' | 'laugh' | 'chaching' | 'tada' | 'whoosh' | 'drumroll';

export interface SFXPreset {
  id: SFXType;
  title: string;
  tag: string;
  icon: string;
  category: 'audience' | 'alert' | 'comedy' | 'impact';
  description: string;
}

export const SFX_PRESETS: SFXPreset[] = [
  {
    id: 'applause',
    title: 'เสียงปรบมือ',
    tag: '[SFX:ปรบมือ]',
    icon: '👏',
    category: 'audience',
    description: 'เสียงปรบมือให้กำลังใจ ชื่นชม เหมาะกับช่วงเปิด/ปิดตัว หรือเฉลย',
  },
  {
    id: 'ding',
    title: 'เสียงแจ้งเตือน / ปิ๊ง!',
    tag: '[SFX:แจ้งเตือน]',
    icon: '🔔',
    category: 'alert',
    description: 'เสียงปิ๊งใสๆ ปลุกความสนใจ เน้นทริคเด็ด หรือเปิดหัวข้อใหม่',
  },
  {
    id: 'laugh',
    title: 'เสียงหัวเราะ / ขำ',
    tag: '[SFX:หัวเราะ]',
    icon: '😂',
    category: 'comedy',
    description: 'เสียงหัวเราะ ขำขัน เพิ่มความตลก ขี้เล่น มีชีวิตชีวา',
  },
  {
    id: 'chaching',
    title: 'แคชเชียร์ Cha-Ching',
    tag: '[SFX:แคชเชียร์]',
    icon: '🛒',
    category: 'alert',
    description: 'เสียงเหรียญเงิน/ขายของ ปิดการขาย โปรโมชั่น ป้ายยา',
  },
  {
    id: 'tada',
    title: 'เสียงฉลอง Ta-Da!',
    tag: '[SFX:ฉลอง]',
    icon: '🎉',
    category: 'impact',
    description: 'เสียงประโคมความสำเร็จ เซอร์ไพรส์ โค้ดลับ ของรางวัล',
  },
  {
    id: 'whoosh',
    title: 'เสียงวู้ช สลับฉาก',
    tag: '[SFX:วู้ช]',
    icon: '💨',
    category: 'impact',
    description: 'เสียงเปลี่ยนฉาก กระชับ ลื่นไหล ตัดอารมณ์',
  },
  {
    id: 'drumroll',
    title: 'เสียงกลองลุ้นระทึก',
    tag: '[SFX:กลองระทึก]',
    icon: '🥁',
    category: 'impact',
    description: 'เสียงดรัมโรลสร้างความตื่นเต้นก่อนเฉลยคำตอบ',
  },
];

/**
 * Clean text for Speech model so it doesn't speak "[SFX:...]" aloud.
 */
export function cleanScriptForSpeech(rawScript: string): string {
  return rawScript
    .replace(/\[SFX:[^\]]+\]/gi, ' ')
    .replace(/<laugh>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ParsedSFXMarker {
  type: SFXType;
  tag: string;
  relativePosition: number; // 0.0 to 1.0 along the text timeline
}

/**
 * Locate SFX tags in the text and calculate their relative position (0.0 to 1.0)
 */
export function parseSFXMarkers(script: string): ParsedSFXMarker[] {
  const markers: ParsedSFXMarker[] = [];
  if (!script) return markers;

  const totalLength = script.length;
  if (totalLength === 0) return markers;

  SFX_PRESETS.forEach((preset) => {
    let pos = script.indexOf(preset.tag);
    while (pos !== -1) {
      const relativePosition = Math.max(0, Math.min(1, pos / totalLength));
      markers.push({
        type: preset.id,
        tag: preset.tag,
        relativePosition,
      });
      pos = script.indexOf(preset.tag, pos + preset.tag.length);
    }
  });

  // Also support alias <laugh>
  let laughTagPos = script.indexOf('<laugh>');
  while (laughTagPos !== -1) {
    const relativePosition = Math.max(0, Math.min(1, laughTagPos / totalLength));
    markers.push({
      type: 'laugh',
      tag: '<laugh>',
      relativePosition,
    });
    laughTagPos = script.indexOf('<laugh>', laughTagPos + 7);
  }

  // Sort chronologically
  return markers.sort((a, b) => a.relativePosition - b.relativePosition);
}

/* ----------------------------------------------------
   Procedural Sound Effects (SFX) Synthesizers
   ---------------------------------------------------- */

export async function generateSFXBuffer(
  type: SFXType,
  sampleRate = 44100
): Promise<AudioBuffer | null> {
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * 2.0), sampleRate);

  if (type === 'applause') {
    // Clapping noise bursts
    const dur = 1.6;
    const buffer = offlineCtx.createBuffer(2, Math.ceil(sampleRate * dur), sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.04 * white) / 1.04;
        // Modulate with rhythmic density
        const clapWave = (Math.sin(i / 350) + Math.cos(i / 210)) * 0.5 + 0.5;
        data[i] = last * clapWave * 0.5;
      }
    }
    const src = offlineCtx.createBufferSource();
    src.buffer = buffer;

    const bpf = offlineCtx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1400;
    bpf.Q.value = 1.2;

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.01, 0);
    gain.gain.linearRampToValueAtTime(0.4, 0.15);
    gain.gain.setValueAtTime(0.35, dur - 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, dur);

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(offlineCtx.destination);
    src.start(0);
  } else if (type === 'ding') {
    // Dual Bell Ding (1046.5Hz & 2093Hz)
    const dur = 0.9;
    [1046.5, 2093.0, 3136.0].forEach((freq, idx) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, 0);

      const peak = idx === 0 ? 0.35 : idx === 1 ? 0.2 : 0.08;
      gain.gain.setValueAtTime(0.001, 0);
      gain.gain.linearRampToValueAtTime(peak, 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, dur);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(0);
      osc.stop(dur);
    });
  } else if (type === 'laugh') {
    // Bubbly laughing bursts
    const dur = 1.2;
    const bursts = [0.05, 0.22, 0.40, 0.60, 0.82];
    bursts.forEach((time) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420 + Math.random() * 80, time);
      osc.frequency.exponentialRampToValueAtTime(260, time + 0.14);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.25, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(time);
      osc.stop(time + 0.16);
    });
  } else if (type === 'chaching') {
    // Cha-Ching: Lever click + high bell + coin chime
    const dur = 1.0;
    // Metallic chime
    const bellOsc = offlineCtx.createOscillator();
    const bellGain = offlineCtx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(1975.5, 0); // B6
    bellGain.gain.setValueAtTime(0.35, 0);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, 0.7);
    bellOsc.connect(bellGain);
    bellGain.connect(offlineCtx.destination);
    bellOsc.start(0);
    bellOsc.stop(0.7);

    // Coins rattle
    const coinTimes = [0.12, 0.22, 0.33, 0.44];
    coinTimes.forEach((ct, i) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2800 + i * 350, ct);
      gain.gain.setValueAtTime(0.18, ct);
      gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.18);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(ct);
      osc.stop(ct + 0.2);
    });
  } else if (type === 'tada') {
    // Fanfare Ta-Da (C5 - E5 - G5 - C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const startTime = idx < 3 ? idx * 0.08 : 0.28;
      const durNote = idx === 3 ? 0.9 : 0.2;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      const amp = idx === 3 ? 0.3 : 0.18;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(amp, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durNote);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + durNote);
    });
  } else if (type === 'whoosh') {
    // Swept whoosh noise
    const dur = 0.45;
    const buffer = offlineCtx.createBuffer(2, Math.ceil(sampleRate * dur), sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }
    }
    const src = offlineCtx.createBufferSource();
    src.buffer = buffer;

    const bpf = offlineCtx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.Q.value = 2.0;
    bpf.frequency.setValueAtTime(200, 0);
    bpf.frequency.exponentialRampToValueAtTime(2800, dur * 0.5);
    bpf.frequency.exponentialRampToValueAtTime(300, dur);

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.001, 0);
    gain.gain.linearRampToValueAtTime(0.4, dur * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, dur);

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(offlineCtx.destination);
    src.start(0);
  } else if (type === 'drumroll') {
    // Fast snare roll + crash
    const dur = 1.3;
    const hits = 18;
    for (let i = 0; i < hits; i++) {
      const t = (i / hits) * 0.9;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 + Math.random() * 20, t);

      const amp = (0.05 + (i / hits) * 0.25);
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    }

    // Final crash
    const crashTime = 0.95;
    const crashOsc = offlineCtx.createOscillator();
    const crashGain = offlineCtx.createGain();
    crashOsc.type = 'triangle';
    crashOsc.frequency.setValueAtTime(80, crashTime);
    crashGain.gain.setValueAtTime(0.4, crashTime);
    crashGain.gain.exponentialRampToValueAtTime(0.001, dur);
    crashOsc.connect(crashGain);
    crashGain.connect(offlineCtx.destination);
    crashOsc.start(crashTime);
    crashOsc.stop(dur);
  }

  return await offlineCtx.startRendering();
}

/* ----------------------------------------------------
   Ambient Background Music Synthesizers
   ---------------------------------------------------- */

export async function generateAmbientBuffer(
  type: AmbientSoundType,
  durationInSeconds: number,
  sampleRate = 44100
): Promise<AudioBuffer | null> {
  if (type === 'none' || durationInSeconds <= 0) return null;

  const actualDuration = Math.max(2, durationInSeconds);
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * actualDuration), sampleRate);

  if (type === 'cafe') {
    const noiseBuffer = offlineCtx.createBuffer(2, sampleRate * actualDuration, sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = noiseBuffer.getChannelData(c);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 0.45;
      }
    }
    const noiseSource = offlineCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bpf = offlineCtx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 650;
    bpf.Q.value = 0.8;

    const lpf = offlineCtx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 1600;

    noiseSource.connect(bpf);
    bpf.connect(lpf);
    lpf.connect(offlineCtx.destination);
    noiseSource.start();

    // Occasional gentle cup clinks
    const clinkCount = Math.floor(actualDuration * 1.5);
    for (let k = 0; k < clinkCount; k++) {
      const time = 0.8 + Math.random() * (actualDuration - 1.2);
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400 + Math.random() * 1200, time);
      gain.gain.setValueAtTime(0.04, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(time);
      osc.stop(time + 0.2);
    }
  } else if (type === 'nature') {
    const buffer = offlineCtx.createBuffer(2, sampleRate * actualDuration, sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.055;
        b1 = 0.985 * b1 + white * 0.075;
        b2 = 0.950 * b2 + white * 0.153;
        data[i] = (b0 + b1 + b2) * 0.25;
      }
    }
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3200;

    source.connect(filter);
    filter.connect(offlineCtx.destination);
    source.start();
  } else if (type === 'ocean') {
    const buffer = offlineCtx.createBuffer(2, sampleRate * actualDuration, sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const swell = Math.sin(t * 0.8) * 0.5 + 0.5;
        const white = Math.random() * 2 - 1;
        last = (last + 0.04 * white) / 1.04;
        data[i] = last * swell * 0.6;
      }
    }
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    const lpf = offlineCtx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 1200;

    source.connect(lpf);
    lpf.connect(offlineCtx.destination);
    source.start();
  } else if (type === 'lofi') {
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];
    const chordDuration = 3.5;
    const totalChords = Math.ceil(actualDuration / chordDuration) + 1;

    for (let i = 0; i < totalChords; i++) {
      const chord = chords[i % chords.length];
      const startTime = i * chordDuration;
      chord.forEach((freq, idx) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), startTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + chordDuration + 0.5);

        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1400;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + chordDuration + 0.6);
      });
    }
  } else if (type === 'cinematic') {
    const freqs = [55.0, 110.0, 164.81, 220.0];
    freqs.forEach((freq, idx) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = idx === 0 ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, 0);

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, 0);
      filter.frequency.linearRampToValueAtTime(750, actualDuration / 2);
      filter.frequency.linearRampToValueAtTime(400, actualDuration);

      gain.gain.setValueAtTime(0.001, 0);
      gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), 1.0);
      gain.gain.setValueAtTime(0.05 / (idx + 1), actualDuration - 1.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, actualDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(0);
      osc.stop(actualDuration);
    });
  }

  return await offlineCtx.startRendering();
}

/**
 * Mix Voiceover AudioBuffer with Ambient Track and Sound Effects (SFX)
 */
export async function mixVoiceAndAmbient(
  speechBuffer: AudioBuffer,
  ambientType: AmbientSoundType,
  ambientVolume = 0.2,
  sampleRate = 44100,
  scriptWithSFX?: string
): Promise<{ mixedBuffer: AudioBuffer; wavBlob: Blob; audioUrl: string }> {
  const duration = speechBuffer.duration + 0.8; // short tail for natural release

  // Parse SFX markers
  const sfxMarkers = scriptWithSFX ? parseSFXMarkers(scriptWithSFX) : [];

  // If no ambient and no SFX, return pure speech directly
  if ((ambientType === 'none' || ambientVolume <= 0) && sfxMarkers.length === 0) {
    const wavBlob = audioBufferToWav(speechBuffer);
    const audioUrl = URL.createObjectURL(wavBlob);
    return { mixedBuffer: speechBuffer, wavBlob, audioUrl };
  }

  const ambientBuffer =
    ambientType !== 'none' && ambientVolume > 0
      ? await generateAmbientBuffer(ambientType, duration, sampleRate)
      : null;

  const offlineCtx = new OfflineAudioContext(
    2,
    Math.ceil(sampleRate * duration),
    sampleRate
  );

  // 1. Voiceover speech track
  const speechSource = offlineCtx.createBufferSource();
  speechSource.buffer = speechBuffer;
  const speechGain = offlineCtx.createGain();
  speechGain.gain.value = 1.0;
  speechSource.connect(speechGain);
  speechGain.connect(offlineCtx.destination);
  speechSource.start(0);

  // 2. Ambient BGM track
  if (ambientBuffer) {
    const ambientSource = offlineCtx.createBufferSource();
    ambientSource.buffer = ambientBuffer;
    const ambientGain = offlineCtx.createGain();
    ambientGain.gain.setValueAtTime(ambientVolume, 0);
    ambientGain.gain.setValueAtTime(0.001, 0);
    ambientGain.gain.linearRampToValueAtTime(ambientVolume, 0.4);
    ambientGain.gain.setValueAtTime(ambientVolume, Math.max(0.5, duration - 1.2));
    ambientGain.gain.linearRampToValueAtTime(0.001, duration);

    ambientSource.connect(ambientGain);
    ambientGain.connect(offlineCtx.destination);
    ambientSource.start(0);
  }

  // 3. Insert SFX at their specific timeline timestamps
  for (const marker of sfxMarkers) {
    try {
      const sfxBuf = await generateSFXBuffer(marker.type, sampleRate);
      if (sfxBuf) {
        // Calculate timestamp based on relative position
        const targetTime = Math.min(
          Math.max(0.05, marker.relativePosition * speechBuffer.duration),
          Math.max(0.1, duration - 1.0)
        );

        const sfxSource = offlineCtx.createBufferSource();
        sfxSource.buffer = sfxBuf;
        const sfxGain = offlineCtx.createGain();
        sfxGain.gain.value = 0.85; // SFX should be crisp and audible

        sfxSource.connect(sfxGain);
        sfxGain.connect(offlineCtx.destination);
        sfxSource.start(targetTime);
      }
    } catch (sfxErr) {
      console.warn('SFX insert error for:', marker.type, sfxErr);
    }
  }

  const mixedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWav(mixedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  return { mixedBuffer, wavBlob, audioUrl };
}

/**
 * Convert standard AudioBuffer to 16-bit PCM RIFF WAV format Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataByteLength = numSamples * blockAlign;
  const totalLength = 44 + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // RIFF Chunk Descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(view, 8, 'WAVE');

  // fmt Subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data Subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Interleave channels & convert to 16-bit PCM
  let offset = 44;
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
