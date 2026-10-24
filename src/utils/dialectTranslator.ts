/**
 * 4-Region & Gender-Aware Thai Dialect Engine
 *
 * Regions:
 * - central  : ภาษากลาง (มาตรฐาน)
 * - northern : ภาษาเหนือ (อู้กำเมือง ล้านนา)
 * - isan     : ภาษาอีสาน (เว้าอีสาน)
 * - southern : ภาษาใต้ (แหลงใต้ ปักษ์ใต้)
 *
 * Genders:
 * - female (ผู้หญิง) / male (ผู้ชาย)
 */

import type { GenderType, RegionType, StudioCharacter, VoiceName } from '../types/voice.js';

export interface RegionalMeta {
  id: RegionType;
  title: string;
  shortTitle: string;
  nameThai: string;
  dialectTagline: string;
  icon: string;
  accentCharacteristics: string;
  commonParticles: { male: string[]; female: string[] };
  greetingSample: { male: string; female: string };
  cardGradient: string;
}

export const REGIONAL_METAS: Record<RegionType, RegionalMeta> = {
  central: {
    id: 'central',
    title: 'ภาษากลาง (มาตรฐาน)',
    shortTitle: 'ภาคกลาง',
    nameThai: 'ภาษากลาง',
    dialectTagline: 'ชัดถ้อยชัดคำ สุภาพ มาตรฐาน',
    icon: '🏛️',
    accentCharacteristics: 'ระดับเสียงสมดุล วรรณยุกต์มาตรฐาน ชัดถ้อยชัดคำ',
    commonParticles: {
      male: ['ครับ', 'นะครับ'],
      female: ['ค่ะ', 'นะคะ'],
    },
    greetingSample: {
      male: 'สวัสดีครับ ยินดีต้อนรับทุกท่านครับ',
      female: 'สวัสดีค่ะ ยินดีต้อนรับทุกท่านนะคะ',
    },
    cardGradient: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
  },
  northern: {
    id: 'northern',
    title: 'ภาษาเหนือ (คำเมือง)',
    shortTitle: 'ภาคเหนือ · คำเมือง',
    nameThai: 'ภาษาเหนือ (อู้กำเมือง)',
    dialectTagline: 'นุ่มนวล ละมุน เจ้า / เน้อกั๊บ',
    icon: '🏔️',
    accentCharacteristics: 'จังหวะเนิบช้า ลากเสียงท้ายนุ่มนวล ท่วงทำนองล้านนา',
    commonParticles: {
      male: ['กั๊บ', 'เน้อกั๊บ', 'เน้อครับ'],
      female: ['เจ้า', 'เน้อเจ้า', 'เจ๊า'],
    },
    greetingSample: {
      male: 'สุมาเต๊อะกั๊บ ยินดีจ้าดนักเน้อครับ',
      female: 'สวัสดีเจ้า ยินดีต้อนฮับสู่เจียงใหม่เน้อเจ้า',
    },
    cardGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
  },
  isan: {
    id: 'isan',
    title: 'ภาษาอีสาน (เว้าอีสาน)',
    shortTitle: 'ภาคอีสาน · เว้าอีสาน',
    nameThai: 'ภาษาอีสาน (เว้าอีสาน)',
    dialectTagline: 'ม่วนซื่น จริงใจ เด้อจ้า / เด้อครับ',
    icon: '🌾',
    accentCharacteristics: 'จังหวะกระฉับกระเฉง รื่นเริง เป็นกันเอง',
    commonParticles: {
      male: ['เด้อครับ', 'เด้อครับพี่น้อง', 'เด้อ'],
      female: ['เด้อจ้า', 'จ้า', 'แหน่เด้อจ้า'],
    },
    greetingSample: {
      male: 'สะบายดีเด้อครับพี่น้อง มื้อนี้มาพ้อกันอีกแล้วเด้อ',
      female: 'สะบายดีจ้าพี่น้อง มาพ้อกับน้องคำแพงมื้อนี้ม่วนหลายเด้อจ้า',
    },
    cardGradient: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
  },
  southern: {
    id: 'southern',
    title: 'ภาษาใต้ (แหลงใต้)',
    shortTitle: 'ภาคใต้ · แหลงใต้',
    nameThai: 'ภาษาใต้ (แหลงใต้)',
    dialectTagline: 'กระชับ หรอยแรง นิ / พี่น้องเหอ',
    icon: '🌊',
    accentCharacteristics: 'จังหวะเร็ว สั้น กระชับ หนักแน่น สำเนียงปักษ์ใต้แท้',
    commonParticles: {
      male: ['นิ', 'คับพี่น้อง', 'ตะพี่น้อง'],
      female: ['นิค่ะ', 'พี่น้องเหอ', 'ตะน้องเหอ'],
    },
    greetingSample: {
      male: 'หวัดดีคับพี่น้องชาวใต้ แหลงใต้กันหรอยจังหู้วันนี้นิ',
      female: 'หวัดดีค่ะพี่น้องเหอ วันนี้น้องนุ้ยมาแหลงใต้ให้ฟัง หรอยจังหู้นิค่ะ',
    },
    cardGradient: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  },
};

/**
 * Regional Prosody Modifiers (layered onto any selected character profile)
 */
export const REGION_PROSODY_MODIFIERS: Record<
  RegionType,
  { pitchMultiplier: number; rateMultiplier: number }
> = {
  central: { pitchMultiplier: 1.0, rateMultiplier: 1.0 },
  northern: { pitchMultiplier: 1.02, rateMultiplier: 0.93 },
  isan: { pitchMultiplier: 1.01, rateMultiplier: 1.04 },
  southern: { pitchMultiplier: 0.99, rateMultiplier: 1.09 },
};

/**
 * Expanded 12-Character Voice Talent Library (Zero API Quota Required)
 * - 6 Female Voices: ขวัญข้าว, มายด์, ลลิตา, พิมรี่, พิมพ์ดาว, ญดา
 * - 6 Male Voices: พีท, ชลันธร, ภูผา, ธันวา, กันต์, อคิน
 */
export const STUDIO_CHARACTERS: StudioCharacter[] = [
  // ==========================================
  // 6 Female Voices (เสียงผู้หญิง)
  // ==========================================
  {
    id: 'Kore',
    name: 'ขวัญข้าว',
    roleLabel: 'นุ่มนวล - อบอุ่น',
    region: 'central',
    gender: 'female',
    toneSummary: 'น้ำเสียงอบอุ่น นุ่มนวล สุภาพ ฟังสบาย',
    webSpeechPitch: 1.03,
    webSpeechRate: 0.96,
    fallbackPitch: 1.0,
    fallbackCadence: 0.97,
    eqProfile: 'warm',
    sampleText: 'สวัสดีค่ะ ขวัญข้าวพร้อมดูแลเสียงพากย์ที่นุ่มนวลและอบอุ่นให้คุณนะคะ',
  },
  {
    id: 'Mira',
    name: 'มายด์',
    roleLabel: 'สดใส - รีวิว/ป้ายยา',
    region: 'central',
    gender: 'female',
    toneSummary: 'น้ำเสียงสดใส ร่าเริง คล่องแคล่ว น่าชวนซื้อ',
    webSpeechPitch: 1.14,
    webSpeechRate: 1.08,
    fallbackPitch: 1.08,
    fallbackCadence: 1.06,
    eqProfile: 'bright',
    sampleText: 'สวัสดีค่ะทุกคน วันนี้มายด์มีของดีมารีวิวป้ายยา บอกเลยว่าคุ้มค่ามากจริงๆ ค่ะ',
  },
  {
    id: 'Elena',
    name: 'ลลิตา',
    roleLabel: 'ผู้ประกาศ - มืออาชีพ',
    region: 'central',
    gender: 'female',
    toneSummary: 'น้ำเสียงสุขุม มั่นใจ ชัดถ้อยชัดคำ น่าเชื่อถือ',
    webSpeechPitch: 0.96,
    webSpeechRate: 1.0,
    fallbackPitch: 0.96,
    fallbackCadence: 1.0,
    eqProfile: 'crisp',
    sampleText: 'สวัสดีค่ะ ลลิตาพร้อมนำเสนอบทบรรยายและข้อมูลธุรกิจระดับมืออาชีพค่ะ',
  },
  {
    id: 'Pimry',
    name: 'พิมรี่',
    roleLabel: 'สดใส - มีพลัง / TikTok Style',
    region: 'central',
    gender: 'female',
    toneSummary: 'น้ำเสียงกระฉับกระเฉง พลังสูง เร้าใจ สไตล์ไลฟ์และคลิปสั้น',
    webSpeechPitch: 1.19,
    webSpeechRate: 1.18,
    fallbackPitch: 1.12,
    fallbackCadence: 1.15,
    eqProfile: 'bright',
    sampleText: 'ทุกคนฟังทางนี้เลยค่ะ โปรโมชั่นพิเศษวันนี้ลดจัดเต็ม รีบสั่งซื้อกันเลยนะคะ',
  },
  {
    id: 'Pimdao',
    name: 'พิมพ์ดาว',
    roleLabel: 'นุ่มนวล - สบายๆ / เล่าเรื่อง',
    region: 'central',
    gender: 'female',
    toneSummary: 'น้ำเสียงละมุน จังหวะผ่อนคลาย เหมาะกับเล่าเรื่องและพอดแคสต์',
    webSpeechPitch: 1.06,
    webSpeechRate: 0.9,
    fallbackPitch: 1.03,
    fallbackCadence: 0.91,
    eqProfile: 'warm',
    sampleText: 'สวัสดีค่ะ วันนี้พิมพ์ดาวจะชวนทุกคนมาฟังเรื่องราวสบายๆ ผ่อนคลายไปด้วยกันนะคะ',
  },
  {
    id: 'Yada',
    name: 'ญดา',
    roleLabel: 'ฉะฉาน - สปอตโฆษณา',
    region: 'central',
    gender: 'female',
    toneSummary: 'น้ำเสียงคมชัด ฉะฉาน ดึงดูดความสนใจ เหมาะกับสปอตโฆษณา',
    webSpeechPitch: 1.09,
    webSpeechRate: 1.12,
    fallbackPitch: 1.05,
    fallbackCadence: 1.1,
    eqProfile: 'crisp',
    sampleText: 'ยกระดับทุกความคุ้มค่า สัมผัสคุณภาพที่คุณมั่นใจได้ตั้งแต่วันนี้ สั่งซื้อได้เลยค่ะ',
  },

  // ==========================================
  // 6 Male Voices (เสียงผู้ชาย)
  // ==========================================
  {
    id: 'Puck',
    name: 'พีท',
    roleLabel: 'สดใส - มีพลัง',
    region: 'central',
    gender: 'male',
    toneSummary: 'น้ำเสียงผู้ชายสดใส กระตือรือร้น เป็นกันเอง',
    webSpeechPitch: 0.88,
    webSpeechRate: 1.08,
    fallbackPitch: 0.82,
    fallbackCadence: 1.06,
    eqProfile: 'bright',
    sampleText: 'สวัสดีครับทุกคน วันนี้อยู่กับพีท พร้อมลุยทุกคอนเทนต์สนุกๆ ไปด้วยกันเลยครับ',
  },
  {
    id: 'Charon',
    name: 'ชลันธร',
    roleLabel: 'สุขุม - อ่านข่าว/สารคดี',
    region: 'central',
    gender: 'male',
    toneSummary: 'น้ำเสียงผู้ชายสุขุม คมชัด ทางการ น่าเชื่อถือ',
    webSpeechPitch: 0.78,
    webSpeechRate: 0.98,
    fallbackPitch: 0.77,
    fallbackCadence: 0.98,
    eqProfile: 'crisp',
    sampleText: 'สวัสดีครับ ขอต้อนรับทุกท่านเข้าสู่รายงานข่าวและสารคดีประจำวันครับ',
  },
  {
    id: 'Fenrir',
    name: 'ภูผา',
    roleLabel: 'ทุ้มลึก - ทรงพลัง',
    region: 'central',
    gender: 'male',
    toneSummary: 'น้ำเสียงผู้ชายทุ้มต่ำ เข้มขรึม ทรงพลัง',
    webSpeechPitch: 0.67,
    webSpeechRate: 0.92,
    fallbackPitch: 0.71,
    fallbackCadence: 0.93,
    eqProfile: 'deep',
    sampleText: 'ในห้วงเวลาแห่งการเดินทางครั้งสำคัญ เตรียมพบกับพลังเสียงที่ทุ้มลึกทรงพลังครับ',
  },
  {
    id: 'Thanwa',
    name: 'ธันวา',
    roleLabel: 'อบอุ่น - นุ่มลึก',
    region: 'central',
    gender: 'male',
    toneSummary: 'น้ำเสียงผู้ชายอบอุ่น นุ่มลึก สุภาพ ฟังเพลิน',
    webSpeechPitch: 0.75,
    webSpeechRate: 0.93,
    fallbackPitch: 0.75,
    fallbackCadence: 0.94,
    eqProfile: 'warm',
    sampleText: 'สวัสดีครับ ธันวาพร้อมถ่ายทอดเรื่องราวด้วยน้ำเสียงที่อบอุ่นและนุ่มลึกให้คุณครับ',
  },
  {
    id: 'Kan',
    name: 'กันต์',
    roleLabel: 'กวนๆ - สนุกสนาน',
    region: 'central',
    gender: 'male',
    toneSummary: 'น้ำเสียงผู้ชายอารมณ์ดี ขี้เล่น จังหวะสนุกเป็นกันเอง',
    webSpeechPitch: 0.93,
    webSpeechRate: 1.14,
    fallbackPitch: 0.86,
    fallbackCadence: 1.13,
    eqProfile: 'bright',
    sampleText: 'สวัสดีครับเพื่อนๆ วันนี้กันต์มีของเด็ดสนุกๆ มาเล่าให้ฟัง ห้ามพลาดเด็ดขาดเลยครับ',
  },
  {
    id: 'Akin',
    name: 'อคิน',
    roleLabel: 'ดุดัน - ตื่นเต้นเร้าใจ',
    region: 'central',
    gender: 'male',
    toneSummary: 'น้ำเสียงผู้ชายดุดัน กระชับ เร้าอารมณ์ ตื่นเต้น',
    webSpeechPitch: 0.71,
    webSpeechRate: 1.13,
    fallbackPitch: 0.73,
    fallbackCadence: 1.12,
    eqProfile: 'deep',
    sampleText: 'ถึงเวลาตัดสินชะตา เตรียมพบกับความตื่นเต้นเร้าใจแบบเต็มพิกัดได้แล้ววันนี้ครับ',
  },
];

export function getCharactersByGender(gender: GenderType): StudioCharacter[] {
  return STUDIO_CHARACTERS.filter((c) => c.gender === gender);
}

export function getCharactersByRegionAndGender(
  _region: RegionType,
  gender: GenderType
): StudioCharacter[] {
  return getCharactersByGender(gender);
}

export function resolveStudioCharacter(
  _region: RegionType,
  gender: GenderType,
  preferredId?: VoiceName
): StudioCharacter {
  const matching = getCharactersByGender(gender);
  if (preferredId) {
    const exact = matching.find((c) => c.id === preferredId);
    if (exact) return exact;
  }
  return matching[0] || STUDIO_CHARACTERS[0];
}

export function getSmartVoiceParameters(
  characterId: VoiceName,
  region: RegionType = 'central'
): {
  character: StudioCharacter;
  webSpeechPitch: number;
  webSpeechRate: number;
  wavPitchFactor: number;
  wavCadenceFactor: number;
} {
  const character =
    STUDIO_CHARACTERS.find((c) => c.id === characterId) || STUDIO_CHARACTERS[0];
  const mod = REGION_PROSODY_MODIFIERS[region] || REGION_PROSODY_MODIFIERS.central;

  return {
    character,
    webSpeechPitch: Number(
      Math.max(0.5, Math.min(1.6, character.webSpeechPitch * mod.pitchMultiplier)).toFixed(2)
    ),
    webSpeechRate: Number(
      Math.max(0.65, Math.min(1.65, character.webSpeechRate * mod.rateMultiplier)).toFixed(2)
    ),
    wavPitchFactor: Number(
      Math.max(0.65, Math.min(1.35, character.fallbackPitch * mod.pitchMultiplier)).toFixed(2)
    ),
    wavCadenceFactor: Number(
      Math.max(0.75, Math.min(1.5, character.fallbackCadence * mod.rateMultiplier)).toFixed(2)
    ),
  };
}

export function isDefaultWelcomeScript(scriptText: string): boolean {
  const t = scriptText.trim();
  if (!t) return true;
  return (
    t.includes('ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI') ||
    t.includes('ยินดีต้อนฮับสู่สตูดิโอ') ||
    t.includes('ยินดีต้อนรับสู่สตูดิโอแหลงเสียง AI') ||
    t.includes('วันนี้อาหารร้านนี้อร่อยมาก รสชาติกลมกล่อม ราคาไม่แพง') ||
    t.includes('สุมาเต๊อะกั๊บ') ||
    t.includes('สวัสดีเจ้า ยินดีต้อนฮับสู่เจียงใหม่') ||
    t.includes('สะบายดีเด้อครับพี่น้อง') ||
    t.includes('สะบายดีจ้าพี่น้อง') ||
    t.includes('หวัดดีคับพี่น้อง') ||
    t.includes('หวัดดีค่ะพี่น้องเหอ')
  );
}

export function getDefaultScriptForRegionAndGender(
  region: RegionType,
  gender: 'female' | 'male' | 'neutral' = 'female'
): string {
  const isMale = gender === 'male';
  if (region === 'northern') {
    return isMale
      ? 'สวัสดีครับ วันนี้อาหารร้านนี้อร่อยมาก รสชาติกลมกล่อม ราคาไม่แพง อยากชวนทุกคนมาลองชิมด้วยกันนะครับ'
      : 'สวัสดีค่ะ วันนี้อาหารร้านนี้อร่อยมาก รสชาติกลมกล่อม ราคาไม่แพง อยากชวนทุกคนมาลองชิมด้วยกันนะคะ';
  }
  if (region === 'isan') {
    return isMale
      ? 'สวัสดีครับ วันนี้ส้มตำร้านนี้อร่อยมากจริงๆ ราคาไม่แพง อยากชวนเพื่อนๆ ทุกคนรีบมาลองชิมด้วยกันเลยครับ'
      : 'สวัสดีค่ะ วันนี้ส้มตำร้านนี้อร่อยมากจริงๆ ราคาไม่แพง อยากชวนเพื่อนๆ ทุกคนรีบมาลองชิมด้วยกันเลยนะคะ';
  }
  if (region === 'southern') {
    return isMale
      ? 'สวัสดีครับ วันนี้แกงส้มร้านนี้อร่อยมาก รสเด็ดจริงๆ ราคาไม่แพง อยากให้ทุกคนได้ลองชิมกันเลยครับ'
      : 'สวัสดีค่ะ วันนี้แกงส้มร้านนี้อร่อยมาก รสเด็ดจริงๆ ราคาไม่แพง อยากให้ทุกคนได้ลองชิมกันเลยนะคะ';
  }
  return isMale
    ? 'สวัสดีครับ วันนี้อาหารร้านนี้อร่อยมาก รสชาติกลมกล่อม ราคาไม่แพง อยากชวนทุกคนมาลองชิมด้วยกันนะครับ'
    : 'สวัสดีค่ะ วันนี้อาหารร้านนี้อร่อยมาก รสชาติกลมกล่อม ราคาไม่แพง อยากชวนทุกคนมาลองชิมด้วยกันนะคะ';
}

interface DictEntry {
  central: string;
  northern: string;
  isan: string;
  southern: string;
}

/**
 * Comprehensive 4-Region Thai Dialect Dictionary (290+ Phrase & Vocabulary Mappings)
 * Compound phrases are prioritized automatically via longest-match sorting.
 */
export const DIALECT_DICTIONARY: DictEntry[] = [
  // 1. วลีเปิด-ปิด การเชิญชวน รีวิว และโปรโมชั่น
  { central: 'ยินดีต้อนรับสู่', northern: 'ยินดีต้อนฮับสู่', isan: 'ยินดีต้อนฮับสู่', southern: 'ยินดีต้อนรับสู่' },
  { central: 'ยินดีต้อนรับ', northern: 'ยินดีต้อนฮับ', isan: 'ยินดีต้อนฮับ', southern: 'ยินดีต้อนรับนิ' },
  { central: 'เริ่มต้นเช้าวันใหม่', northern: 'เริ่มต้นยามเจ๊าวันใหม่', isan: 'เริ่มต้นยามเซ้าวันใหม่', southern: 'เปิดหัวเช้าวันใหม่' },
  { central: 'เริ่มต้นวันใหม่', northern: 'เริ่มต้นยามเจ๊าวันใหม่', isan: 'เริ่มต้นยามเซ้าวันใหม่', southern: 'เปิดหัวเช้าวันใหม่' },
  { central: 'คัดสรรเมล็ดพันธุ์ชั้นดี', northern: 'คัดเมล็ดพันธุ์อย่างดีแต้ๆ', isan: 'คัดเมล็ดพันธุ์อย่างคัก', southern: 'คัดแต่เมล็ดอย่างดีหรอยๆ' },
  { central: 'คัดสรรเมล็ดพันธุ์ชั้นเลิศ', northern: 'คัดเมล็ดพันธุ์ชั้นเลิศแต้ๆ', isan: 'คัดเมล็ดพันธุ์ชั้นเลิศคักๆ', southern: 'คัดแต่เมล็ดชั้นเลิศได้ใจ' },
  { central: 'รสชาติกลมกล่อม', northern: 'รสชาติกลมกล่อมลำขนาด', isan: 'รสชาติกลมกล่อมนัวคัก', southern: 'รสชาติกลมกล่อมหรอยได้ใจ' },
  { central: 'อยากให้ทุกคนได้ลองชิม', northern: 'อยากฮื้อสูเจ้าตึงหลายได้ลองจิมผ่อ', isan: 'อยากให้พี่น้องสู่สุคนได้ลองชิมเบิ่ง', southern: 'อยากให้พี่น้องทุกคนได้ลองชิมแลตะ' },
  { central: 'อยากชวนเพื่อนๆ ทุกคน', northern: 'อยากจวนเปื้อนๆ ตึงหลาย', isan: 'อยากซวนหมู่เสี่ยวสู่สุคน', southern: 'อยากชวนเพื่อนเกลอพี่น้องทุกคน' },
  { central: 'อยากชวนทุกคนมาลองชิม', northern: 'อยากจวนสูเจ้ามาลองจิมผ่อ', isan: 'อยากซวนพี่น้องมาลองชิมเบิ่ง', southern: 'อยากชวนพี่น้องมาลองชิมแลตะ' },
  { central: 'รีบมาลองชิมด้วยกันเลย', northern: 'ฟั่งมาลองจิมผ่อโตยกั๋นเลย', isan: 'ฟ้าวมาลองชิมนำกันโลด', southern: 'รีบมาลองชิมแลด้วยกันเลยตะ' },
  { central: 'รีบสั่งไปชิมกันเลย', northern: 'ฟั่งสั่งไปจิมผ่อกั๋นเลย', isan: 'ฟ้าวสั่งไปชิมนำกันโลด', southern: 'รีบสั่งไปชิมแลกันเลยตะ' },
  { central: 'รีบสั่งไปชิม', northern: 'ฟั่งสั่งไปจิมผ่อ', isan: 'ฟ้าวสั่งไปชิมเบิ่ง', southern: 'รีบสั่งไปชิมแล' },
  { central: 'โปรโมชั่นพิเศษวันนี้', northern: 'โปรโมชั่นพิเศษวันนี้ดีขนาด', isan: 'โปรพิเศษมื้อนี้คักอีหลี', southern: 'โปรเด็ดอย่างแรงวันนี้นิพี่น้อง' },
  { central: 'โปรโมชั่นพิเศษ', northern: 'โปรโมชั่นดีขนาด', isan: 'โปรพิเศษคักหลาย', southern: 'โปรเด็ดหรอยแรง' },
  { central: 'ลดทันทีสูงสุด', northern: 'ลดตั๋นตีสูงสุด', isan: 'ลดโลดสูงสุด', southern: 'ลดทันทีอย่างแรงสูงสุด' },
  { central: 'สินค้ามีจำนวนจำกัด', northern: 'ของมีจ๋ำนวนจ๋ำกัดเน้อ', isan: 'ของมีจำกัดเด้อพี่น้อง', southern: 'ของมีไม่มากแล้วนิ' },
  { central: 'พลาดรอบนี้รออีกทีปีหน้า', northern: 'พลาดรอบนี้ท่าแหมทีปี๋หน้า', isan: 'พลาดเทื่อนี้ถ่าอีกทีปีหน้า', southern: 'พลาดรอบนี้รออีกทีปีหน้าเลยตะ' },
  { central: 'ช้อปด่วน', northern: 'ฟั่งซื้อโวยๆ เน้อ', isan: 'ฟ้าวช้อปโลดเด้อ', southern: 'รีบสอยด่วนตะ' },
  { central: 'สั่งซื้อได้เลย', northern: 'สั่งซื้อได้เลยเน้อ', isan: 'กดสั่งได้โลดเด้อ', southern: 'กดสั่งได้เลยตะ' },
  { central: 'สั่งซื้อเลย', northern: 'สั่งซื้อเลยเน้อ', isan: 'กดสั่งโลดเด้อ', southern: 'กดสั่งเลยตะ' },
  { central: 'รีบสั่งซื้อกันเลย', northern: 'ฟั่งสั่งซื้อกั๋นเลยเน้อ', isan: 'ฟ้าวสั่งซื้อนำกันโลด', southern: 'รีบสั่งซื้อกันเลยตะ' },
  { central: 'รีบสั่งซื้อ', northern: 'ฟั่งสั่งซื้อ', isan: 'ฟ้าวสั่งซื้อ', southern: 'รีบสั่งซื้อ' },
  { central: 'ราคาไม่แพงเลย', northern: 'ราคาบ่แปงเลย', isan: 'ราคาบ่แพงเลย', southern: 'ราคาไม่แพงสักนิดนิ' },
  { central: 'ราคาไม่แพง', northern: 'ราคาบ่แปง', isan: 'ราคาบ่แพง', southern: 'ราคาไม่แพงนิ' },
  { central: 'คุ้มค่าเกินราคา', northern: 'คุ้มค่าเกินราคาแต้ๆ', isan: 'คุ้มคักเกินราคาอีหลี', southern: 'คุ้มเกินราคาอย่างแรงนิ' },
  { central: 'คุ้มค่าที่สุด', northern: 'คุ้มค่าแต้ๆ', isan: 'คุ้มคักอีหลี', southern: 'คุ้มอย่างแรงนิ' },
  { central: 'นำไปใช้งานได้ทันที', northern: 'เอาไปใจ้ก๋านได้ตั๋นตี', isan: 'เอาไปเฮ็ดเวียกได้โลดทันที', southern: 'เอาไปใช้การได้ทันทีเลยตะ' },
  { central: 'นำไปใช้งาน', northern: 'เอาไปใจ้ก๋าน', isan: 'เอาไปเฮ็ดเวียก', southern: 'เอาไปใช้การ' },
  { central: 'ใช้งาน', northern: 'ใจ้ก๋าน', isan: 'เฮ็ดเวียก', southern: 'ใช้การ' },
  { central: 'ปรับความเร็ว', northern: 'ปรับความโวย', isan: 'ปรับความไว', southern: 'ปรับความเร็ว' },
  { central: 'ความเร็ว', northern: 'ความโวย', isan: 'ความไว', southern: 'ความเร็ว' },
  { central: 'สตูดิโอพากย์เสียง', northern: 'สตูดิโออู้เสียง', isan: 'สตูดิโอเว้าเสียง', southern: 'สตูดิโอแหลงเสียง' },
  { central: 'พากย์เสียง', northern: 'อู้เสียง', isan: 'เว้าเสียง', southern: 'แหลงเสียง' },
  { central: 'เสียงพากย์', northern: 'เสียงอู้', isan: 'เสียงเว้า', southern: 'เสียงแหลง' },
  { central: 'ดาวน์โหลด', northern: 'โหลด', isan: 'โหลด', southern: 'โหลด' },
  { central: 'วันนี้จะพามาดู', northern: 'วันนี้จะพามาผ่อ', isan: 'มื้อนี้สิพามาเบิ่ง', southern: 'วันนี้พามาแล' },
  { central: 'จะพาไปดู', northern: 'จะพาไปผ่อ', isan: 'สิพาไปเบิ่ง', southern: 'พาไปแล' },
  { central: 'จะพาไปเที่ยว', northern: 'จะปาไปแอ่ว', isan: 'สิพาไปเลาะ', southern: 'พาไปเที่ยวแล' },
  { central: 'พามาดู', northern: 'พามาผ่อ', isan: 'พามาเบิ่ง', southern: 'พามาแล' },
  { central: 'บอกเลยว่า', northern: 'บอกเลยว่า', isan: 'เว้าเลยว่า', southern: 'แหลงตรงๆ เลยว่า' },
  { central: 'รับรองว่า', northern: 'ฮับรองเลยว่า', isan: 'ฮับรองเลยว่า', southern: 'รับรองเลยนิว่า' },
  { central: 'ห้ามพลาดเด็ดขาด', northern: 'ห้ามพลาดเด็ดขาดเน้อ', isan: 'ห้ามพลาดเด็ดขาดเด้อ', southern: 'อย่าพลาดเด็ดขาดตะ' },
  { central: 'ห้ามพลาด', northern: 'ห้ามพลาดเน้อ', isan: 'ห้ามพลาดเด้อ', southern: 'อย่าพลาดตะ' },
  { central: 'อยากให้ลอง', northern: 'อยากฮื้อลองจิมผ่อ', isan: 'อยากให้ลองเบิ่ง', southern: 'อยากให้ลองแลตะ' },
  { central: 'ต้องลองเลย', northern: 'ต้องลองผ่อเลยเน้อ', isan: 'ต้องลองเบิ่งโลดเด้อ', southern: 'ต้องลองแลเลยตะ' },
  { central: 'ต้องลอง', northern: 'ต้องลองผ่อ', isan: 'ต้องลองเบิ่ง', southern: 'ต้องลองแลตะ' },
  { central: 'ด้วยกันเลย', northern: 'โตยกั๋นเลย', isan: 'นำกันโลด', southern: 'ด้วยกันเลยตะ' },
  { central: 'ด้วยกัน', northern: 'โตยกั๋น', isan: 'นำกัน', southern: 'ด้วยกันตะ' },
  { central: 'กันเลย', northern: 'กั๋นเลย', isan: 'นำกันโลด', southern: 'กันเลยตะ' },
  { central: 'ได้เลย', northern: 'ได้เลย', isan: 'ได้โลด', southern: 'ได้เลยตะ' },

  // 2. คำทักทาย ขอบคุณ ขอโทษ และถามไถ่
  { central: 'สวัสดีครับ', northern: 'สุมาเต๊อะกั๊บ', isan: 'สะบายดีเด้อครับพี่น้อง', southern: 'หวัดดีคับพี่น้อง' },
  { central: 'สวัสดีค่ะ', northern: 'สวัสดีเจ้า', isan: 'สะบายดีเด้อจ้าพี่น้อง', southern: 'หวัดดีค่ะพี่น้องเหอ' },
  { central: 'สวัสดี', northern: 'สวัสดีเจ้า', isan: 'สะบายดี', southern: 'หวัดดีนิ' },
  { central: 'สบายดีไหม', northern: 'สะบายดีก่อ', isan: 'สะบายดีบ่', southern: 'บายดีหม้าย' },
  { central: 'สบายดีหรือเปล่า', northern: 'สะบายดีก่อ', isan: 'สะบายดีบ่', southern: 'บายดีหม้าย' },
  { central: 'สบายดี', northern: 'สะบายดี', isan: 'สะบายดี', southern: 'บายดี' },
  { central: 'ขอบคุณมาก', northern: 'ยินดีจ้าดนัก', isan: 'ขอบใจหลายๆ', southern: 'ขอบคุณจังหู้' },
  { central: 'ขอบคุณ', northern: 'ยินดีนัก', isan: 'ขอบใจหลาย', southern: 'ขอบคุณนิ' },
  { central: 'ขอโทษ', northern: 'สุมาเต๊อะ', isan: 'ขอโทษหลายๆ', southern: 'ขอโทษทีนิ' },
  { central: 'เป็นอย่างไรบ้าง', northern: 'เป๋นจะไดพ่อง', isan: 'เป็นจังได๋แหน่', southern: 'เป็นพันพรือมั่ง' },
  { central: 'เป็นยังไงบ้าง', northern: 'เป๋นจะไดพ่อง', isan: 'เป็นจังได๋แหน่', southern: 'เป็นพันพรือมั่ง' },
  { central: 'ไม่เจอกันนาน', northern: 'บ่ป๊ะกั๋นเมิน', isan: 'บ่พ้อกันดน', southern: 'ไม่พบกันนานนิ' },
  { central: 'คิดถึงมาก', northern: 'กึดเติงหาขนาด', isan: 'คึดฮอดหลาย', southern: 'หวังเหวิดจังหู้' },
  { central: 'คิดถึง', northern: 'กึดเติงหา', isan: 'คึดฮอด', southern: 'หวังเหวิด' },

  // 3. สรรพนามและบุคคล
  { central: 'ผู้ชาย', northern: 'ป้อจาย', isan: 'ผู้ชาย', southern: 'พี่บ่าว' },
  { central: 'ผู้หญิง', northern: 'แม่ญิง', isan: 'ผู้หญิง', southern: 'สาวนุ้ย' },
  { central: 'เพื่อนๆ', northern: 'เปื้อนๆ', isan: 'หมู่เสี่ยว', southern: 'เพื่อนเกลอ' },
  { central: 'เพื่อน', northern: 'เปื้อน', isan: 'หมู่', southern: 'เกลอ' },
  { central: 'พี่น้อง', northern: 'ปี้น้อง', isan: 'พี่น้อง', southern: 'พี่น้อง' },
  { central: 'พี่ชาย', northern: 'ปี้จาย', isan: 'อ้าย', southern: 'พี่บ่าว' },
  { central: 'พี่สาว', northern: 'ปี้สาว', isan: 'เอื้อย', southern: 'พี่สาว' },
  { central: 'น้องสาว', northern: 'น้องสาว', isan: 'น้องหล้า', southern: 'น้องสาวนุ้ย' },
  { central: 'น้องชาย', northern: 'น้องจาย', isan: 'บักหล่า', southern: 'น้องบ่าว' },
  { central: 'พวกเรา', northern: 'หมู่เฮา', isan: 'พวกเฮา', southern: 'หมู่เรา' },
  { central: 'ทุกคน', northern: 'สูเจ้าตึงหลาย', isan: 'พี่น้องสู่สุคน', southern: 'พี่น้องทุกคนนิ' },
  { central: 'คุณสามารถ', northern: 'สูเจ้าสามารถ', isan: 'พี่น้องสามารถ', southern: 'พี่น้องสามารถ' },
  { central: 'คุณ', northern: 'สูเจ้า', isan: 'เจ้า', southern: 'พี่น้อง' },
  { central: 'ดิฉัน', northern: 'ข้าเจ้า', isan: 'ข้อย', southern: 'ฉาน' },
  { central: 'ฉัน', northern: 'ข้าเจ้า', isan: 'ข้อย', southern: 'ฉาน' },
  { central: 'เธอ', northern: 'ตั๋ว', isan: 'เจ้า', southern: 'ตัวเอง' },
  { central: 'ใคร', northern: 'ไผ', isan: 'ไผ', southern: 'ใคร' },

  // 4. รสชาติ ความรู้สึก และคำคุณศัพท์
  { central: 'อร่อยมากจริงๆ', northern: 'ลำขนาดแต้ๆ', isan: 'แซ่บหลายคักอีหลี', southern: 'หรอยจังหู้อย่างแรง' },
  { central: 'อร่อยมาก', northern: 'ลำขนาด', isan: 'แซ่บหลาย', southern: 'หรอยจังหู้' },
  { central: 'อร่อยจริงๆ', northern: 'ลำแต้ๆ', isan: 'แซ่บคักอีหลี', southern: 'หรอยอย่างแรง' },
  { central: 'อร่อยสุดๆ', northern: 'ลำแต้ลำว่า', isan: 'แซ่บคักอีหลี', southern: 'หรอยหนัดเหนียน' },
  { central: 'ความอร่อย', northern: 'ความลำ', isan: 'ความแซ่บ', southern: 'ความหรอย' },
  { central: 'ไม่อร่อย', northern: 'บ่ลำ', isan: 'บ่แซ่บ', southern: 'ไม่หรอย' },
  { central: 'อร่อย', northern: 'ลำ', isan: 'แซ่บ', southern: 'หรอย' },
  { central: 'รสเด็ด', northern: 'รสเด็ดลำแต้ๆ', isan: 'รสเด็ดแซ่บคัก', southern: 'รสเด็ดหรอยแรง' },
  { central: 'หอมกรุ่น', northern: 'หอมกรุ่นขนาด', isan: 'หอมหวนคัก', southern: 'หอมฟุ้งจังหู้' },
  { central: 'สวยมาก', northern: 'งามขนาด', isan: 'งามหลาย', southern: 'งามจังหู้' },
  { central: 'สวยจริงๆ', northern: 'งามแต้ๆ', isan: 'งามคักอีหลี', southern: 'งามได้ใจนิ' },
  { central: 'สวย', northern: 'งาม', isan: 'งาม', southern: 'งาม' },
  { central: 'น่ารักมาก', northern: 'น่าฮักขนาด', isan: 'ตาฮักหลาย', southern: 'น่ารักจังหู้' },
  { central: 'น่ารักจริงๆ', northern: 'น่าฮักแต้ๆ', isan: 'ตาฮักคักอีหลี', southern: 'น่ารักได้ใจนิ' },
  { central: 'น่ารัก', northern: 'น่าฮัก', isan: 'ตาฮัก', southern: 'น่ารักได้ใจ' },
  { central: 'สนุกมาก', northern: 'ม่วนขนาด', isan: 'ม่วนหลาย', southern: 'หรอยหนัด' },
  { central: 'สนุกสนาน', northern: 'ม่วนงัน', isan: 'ม่วนซื่นโฮแซว', southern: 'หรอยครื้นเครง' },
  { central: 'สนุก', northern: 'ม่วน', isan: 'ม่วนซื่น', southern: 'หรอย' },
  { central: 'มีความสุขมาก', northern: 'มีความสุขขนาด', isan: 'มีความสุขหลาย', southern: 'บายใจจังหู้' },
  { central: 'ดีใจมาก', northern: 'ดีใจ๋ขนาด', isan: 'ดีใจหลาย', southern: 'ดีใจจังหู้' },
  { central: 'เหนื่อยมาก', northern: 'อิดขนาด', isan: 'เมื่อยหลาย', southern: 'เหนื่อยหนัด' },
  { central: 'เหนื่อย', northern: 'อิด', isan: 'เมื่อย', southern: 'เหนื่อย' },
  { central: 'ร้อนมาก', northern: 'ฮ้อนขนาด', isan: 'ฮ้อนหลาย', southern: 'ร้อนจังหู้' },
  { central: 'ร้อน', northern: 'ฮ้อน', isan: 'ฮ้อน', southern: 'ร้อน' },
  { central: 'หนาวมาก', northern: 'หนาวขนาด', isan: 'หนาวคัก', southern: 'เย็นเยียบ' },
  { central: 'เผ็ดมาก', northern: 'เผ็ดขนาด', isan: 'เผ็ดคัก', southern: 'เผ็ดถึงใจหรอยแรง' },
  { central: 'สุดยอด', northern: 'สุดยอดแต้ๆ', isan: 'สุดยอดคัก', southern: 'หรอยได้ใจ' },
  { central: 'ยอดเยี่ยม', northern: 'ดีขนาด', isan: 'คักอีหลี', southern: 'หรอยหนัด' },
  { central: 'ดีมาก', northern: 'ดีขนาด', isan: 'ดีหลาย', southern: 'ดีจังหู้' },
  { central: 'ของดี', northern: 'ของดีแต้ๆ', isan: 'ของดีคักๆ', southern: 'ของหรอยได้ใจ' },
  { central: 'เยอะมาก', northern: 'จ้าดนัก', isan: 'หลายคัก', southern: 'ลุยเหม็ด' },
  { central: 'มากจริงๆ', northern: 'ขนาดแต้ๆ', isan: 'คักอีหลี', southern: 'อย่างแรงนิ' },
  { central: 'มากๆ', northern: 'แต้ๆ', isan: 'คักๆ', southern: 'จังหู้' },
  { central: 'สุดๆ', northern: 'แต้ๆ', isan: 'คักอีหลี', southern: 'หนัดเหนียน' },
  { central: 'รักมาก', northern: 'ฮักขนาด', isan: 'ฮักหลาย', southern: 'รักจังหู้' },
  { central: 'รัก', northern: 'ฮัก', isan: 'ฮัก', southern: 'รัก' },
  { central: 'ชอบมาก', northern: 'มักขนาด', isan: 'มักหลาย', southern: 'ชอบจังหู้' },
  { central: 'ไม่ชอบ', northern: 'บ่มัก', isan: 'บ่มัก', southern: 'ไม่ชอบนิ' },
  { central: 'ชอบ', northern: 'มัก', isan: 'มัก', southern: 'ชอบ' },
  { central: 'จริงๆ', northern: 'แต้ๆ', isan: 'อีหลี', southern: 'อย่างแรง' },
  { central: 'มาก', northern: 'ขนาด', isan: 'หลาย', southern: 'จังหู้' },

  // 5. คำกริยาที่ใช้บ่อย
  { central: 'อย่าพูดโกหก', northern: 'อย่ามาอู้ขี้จุ๊', isan: 'อย่ามาเว้าขี้ตั๋ว', southern: 'อย่ามาแหลงขี้หก' },
  { central: 'อย่าโกหก', northern: 'อย่ามาขี้จุ๊', isan: 'อย่ามาขี้ตั๋ว', southern: 'อย่ามาขี้หก' },
  { central: 'พูดโกหก', northern: 'อู้ขี้จุ๊', isan: 'เว้าขี้ตั๋ว', southern: 'แหลงขี้หก' },
  { central: 'โกหก', northern: 'ขี้จุ๊', isan: 'ขี้ตั๋ว', southern: 'ขี้หก' },
  { central: 'พูดคุย', northern: 'อู้จา', isan: 'เว้าจา', southern: 'แหลงคุย' },
  { central: 'พูด', northern: 'อู้', isan: 'เว้า', southern: 'แหลง' },
  { central: 'ลองชิมดู', northern: 'ลองจิมผ่อ', isan: 'ลองชิมเบิ่ง', southern: 'ลองชิมแลตะ' },
  { central: 'ลองชิม', northern: 'ลองจิมผ่อ', isan: 'ลองชิมเบิ่ง', southern: 'ลองชิมแลตะ' },
  { central: 'ชิม', northern: 'จิม', isan: 'ชิม', southern: 'ชิมแล' },
  { central: 'ลองดู', northern: 'ลองผ่อเน้อ', isan: 'ลองเบิ่งเด้อ', southern: 'ลองแลตะ' },
  { central: 'มาดูกัน', northern: 'มาผ่อกั๋น', isan: 'มาเบิ่งนำกัน', southern: 'มาแลกันตะ' },
  { central: 'มองดู', northern: 'จ้องผ่อ', isan: 'เบิ่งแยง', southern: 'แลดู' },
  { central: 'มองเห็น', northern: 'หัน', isan: 'แนมเห็น', southern: 'แลเห็น' },
  { central: 'มอง', northern: 'ผ่อ', isan: 'เบิ่ง', southern: 'แล' },
  { central: 'ดู', northern: 'ผ่อ', isan: 'เบิ่ง', southern: 'แล' },
  { central: 'เห็น', northern: 'หัน', isan: 'เห็น', southern: 'แลเห็น' },
  { central: 'กลับบ้าน', northern: 'ปิ๊กเฮือน', isan: 'เมือเฮือน', southern: 'หลบเริน' },
  { central: 'ไปเที่ยว', northern: 'ไปแอ่ว', isan: 'ไปเลาะ', southern: 'ไปเที่ยวแล' },
  { central: 'มาเที่ยว', northern: 'มาแอ่ว', isan: 'มาเลาะ', southern: 'มาเที่ยวแล' },
  { central: 'ไปไหนมา', northern: 'ไปตางไดมา', isan: 'ไปไสมาน้อ', southern: 'ไปไหนมานิ' },
  { central: 'ไปไหน', northern: 'ไปตางได', isan: 'ไปไส', southern: 'ไปไหนนิ' },
  { central: 'ทำอะไรอยู่', northern: 'ยะหยังอยู่', isan: 'เฮ็ดหยังอยู่', southern: 'ทำไอ้ไหรอยู่' },
  { central: 'ทำอะไร', northern: 'ยะหยัง', isan: 'เฮ็ดหยัง', southern: 'ทำไอ้ไหร' },
  { central: 'ทำไม', northern: 'ยะหยัง', isan: 'เป็นหยัง', southern: 'ไซร' },
  { central: 'ทำงาน', northern: 'ยะก๋าน', isan: 'เฮ็ดเวียก', southern: 'ทำงานหาเบี้ย' },
  { central: 'กินข้าวหรือยัง', northern: 'กิ๋นข้าวแล้วก๋า', isan: 'กินข้าวแล้วบ่', southern: 'กินข้าวแล้วหม้าย' },
  { central: 'กินข้าว', northern: 'กิ๋นข้าว', isan: 'กินข้าว', southern: 'กินข้าว' },
  { central: 'กิน', northern: 'กิ๋น', isan: 'กิน', southern: 'กิน' },
  { central: 'ไปตลาด', northern: 'ไปกาด', isan: 'ไปเลาะตลาด', southern: 'ไปหลาด' },
  { central: 'ตลาด', northern: 'กาด', isan: 'ตลาด', southern: 'หลาด' },
  { central: 'ร้านนี้', northern: 'ฮ้านนี้', isan: 'ฮ้านนี้', southern: 'ร้านนี้นิ' },
  { central: 'ช่วยเหลือ', northern: 'จ่วยเหลือ', isan: 'ซ่อยเหลือ', southern: 'ช่วยเหลือ' },

  // 6. คำปฏิเสธ คำถาม และคำเชื่อม
  { central: 'ไม่เป็นไร', northern: 'บ่เป็นหยัง', isan: 'บ่เป็นหยังดอก', southern: 'หม้ายพรือ' },
  { central: 'ไม่เข้าใจ', northern: 'บ่ฮู้เรื่อง', isan: 'บ่เข้าใจ', southern: 'ไม่โร้เรื่อง' },
  { central: 'ไม่รู้', northern: 'บ่ฮู้', isan: 'บ่ฮู้', southern: 'ไม่โร้' },
  { central: 'รู้ไหม', northern: 'ฮู้ก่อ', isan: 'ฮู้บ่', southern: 'โร้หม้าย' },
  { central: 'ได้ไหม', northern: 'ได้ก่อ', isan: 'ได้บ่', southern: 'ได้หม้าย' },
  { central: 'ดีไหม', northern: 'ดีก่อ', isan: 'ดีบ่', southern: 'ดีหม้าย' },
  { central: 'จริงไหม', northern: 'แต้ก่อ', isan: 'อีหลีบ่', southern: 'จริงหม้าย' },
  { central: 'จริงเหรอ', northern: 'แต้ก๋า', isan: 'อีหลีติ', southern: 'จริงเห้อ' },
  { central: 'ใช่ไหม', northern: 'แม่นก่อ', isan: 'แม่นบ่', southern: 'หม้ายเล่า' },
  { central: 'ไม่ใช่', northern: 'บ่ใจ้', isan: 'บ่แม่น', southern: 'ไม่ช่ายนิ' },
  { central: 'ไม่มี', northern: 'บ่มี', isan: 'บ่มี', southern: 'หม้าย' },
  { central: 'ไม่เคย', northern: 'บ่เกย', isan: 'บ่เคย', southern: 'ไม่เคยนิ' },
  { central: 'ไม่ต้อง', northern: 'บ่ต้อง', isan: 'บ่ต้อง', southern: 'ไม่ต้องนิ' },
  { central: 'ไม่ได้', northern: 'บ่ได้', isan: 'บ่ได้', southern: 'ไม่ได้นิ' },
  { central: 'อะไร', northern: 'อะหยัง', isan: 'อีหยัง', southern: 'ไอ้ไหร' },
  { central: 'ที่ไหน', northern: 'ตี้ไหน', isan: 'หม่องได๋', southern: 'ตรงไหนนิ' },
  { central: 'ที่นี่', northern: 'ตี้นี้', isan: 'หม่องนี้', southern: 'ตรงนี้นิ' },
  { central: 'อย่างไร', northern: 'จะได', isan: 'จังได๋', southern: 'พันพรือ' },
  { central: 'ยังไง', northern: 'จะได', isan: 'จังได๋', southern: 'พันพรือ' },
  { central: 'เท่าไหร่', northern: 'เต้าใด', isan: 'ท่อได๋', southern: 'กี่บาทนิ' },
  { central: 'ทันที', northern: 'ตั๋นตี', isan: 'โลดทันที', southern: 'ทันทีนิ' },

  // 7. วันเวลาและอาหารยอดนิยม
  { central: 'วันนี้', northern: 'วันนี้', isan: 'มื้อนี้', southern: 'วันนี้' },
  { central: 'พรุ่งนี้', northern: 'วันพูก', isan: 'มื้ออื่น', southern: 'วันพูก' },
  { central: 'เมื่อวานนี้', northern: 'ตะวานซืน', isan: 'มื้อวานนี้', southern: 'ต่อโพลก' },
  { central: 'เมื่อวาน', northern: 'ตะวาน', isan: 'มื้อวาน', southern: 'ต่อโพลก' },
  { central: 'ตอนเช้า', northern: 'ยามเจ๊า', isan: 'ยามเซ้า', southern: 'หัวเช้า' },
  { central: 'ตอนเย็น', northern: 'ยามแลง', isan: 'ยามแลง', southern: 'หวางเย็น' },
  { central: 'ส้มตำ', northern: 'ส้มต๋ำ', isan: 'ตำบักหุ่ง', southern: 'ส้มตำรสจัด' },
  { central: 'ปลาร้า', northern: 'ฮ้า', isan: 'ปลาแดก', southern: 'ปลาร้า' },
  { central: 'มะละกอ', northern: 'บะก้วยเต๊ด', isan: 'บักหุ่ง', southern: 'ลอกอ' },
  { central: 'สับปะรด', northern: 'บะขะนัด', isan: 'บักนัด', southern: 'ยานัด' },
  { central: 'ฝรั่ง', northern: 'บะแก๋ว', isan: 'บักสีดา', southern: 'ชมพู่' },
  { central: 'ลดราคา', northern: 'ลดราคาจ้าดนัก', isan: 'ลดราคาคักหลาย', southern: 'ลดราคาอย่างแรง' },
];

// Pre-compile sorted dictionary once for fast O(N) single-pass execution
const SORTED_DICTIONARY = [...DIALECT_DICTIONARY].sort(
  (a, b) => b.central.length - a.central.length
);

const ESCAPED_PATTERNS = SORTED_DICTIONARY.map((entry) =>
  entry.central.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
);
const COMBINED_DICT_REGEX = new RegExp(ESCAPED_PATTERNS.join('|'), 'g');

const DICT_LOOKUP: Record<Exclude<RegionType, 'central'>, Map<string, string>> = {
  northern: new Map(SORTED_DICTIONARY.map((e) => [e.central, e.northern])),
  isan: new Map(SORTED_DICTIONARY.map((e) => [e.central, e.isan])),
  southern: new Map(SORTED_DICTIONARY.map((e) => [e.central, e.southern])),
};

/**
 * Translates standard Central Thai text into authentic regional dialect + gender-matched particles.
 */
export function translateCentralToDialect(
  sourceText: string,
  targetRegion: RegionType,
  gender: 'female' | 'male' | 'neutral' = 'female'
): {
  translatedText: string;
  replacedWordsCount: number;
  highlightedText: string;
  sourceText: string;
} {
  if (!sourceText || !sourceText.trim()) {
    return {
      translatedText: sourceText,
      replacedWordsCount: 0,
      highlightedText: sourceText,
      sourceText,
    };
  }

  // 1. Central Thai: harmonize gender pronouns & polite ending particles cleanly
  if (targetRegion === 'central') {
    let centralText = sourceText;
    if (gender === 'female') {
      centralText = centralText
        .replace(/ครับผม/g, 'ค่ะ')
        .replace(/นะครับ/g, 'นะคะ')
        .replace(/ครับ/g, 'ค่ะ');
    } else if (gender === 'male') {
      centralText = centralText
        .replace(/นะคะ/g, 'นะครับ')
        .replace(/นะจ๊ะ/g, 'นะครับ')
        .replace(/ค่ะ/g, 'ครับ')
        .replace(/คะ(?=\s|[!?.]|$)/g, 'ครับ');
    }
    return {
      translatedText: centralText,
      replacedWordsCount: centralText !== sourceText ? 1 : 0,
      highlightedText: centralText,
      sourceText,
    };
  }

  let text = sourceText;
  let count = 0;

  // 1.5 Pre-normalize Central Thai greetings & polite particles to match target speaker gender
  // so switching Male <-> Female on an existing script never leaves opposite-gender greetings
  if (gender === 'female') {
    text = text
      .replace(/สวัสดีครับ/g, 'สวัสดีค่ะ')
      .replace(/ขอบคุณครับ/g, 'ขอบคุณค่ะ')
      .replace(/นะครับ/g, 'นะคะ')
      .replace(/ครับผม/g, 'ค่ะ')
      .replace(/ครับ/g, 'ค่ะ');
  } else if (gender === 'male') {
    text = text
      .replace(/สวัสดีค่ะ|สวัสดีคะ/g, 'สวัสดีครับ')
      .replace(/ขอบคุณค่ะ|ขอบคุณคะ/g, 'ขอบคุณครับ')
      .replace(/นะคะ/g, 'นะครับ')
      .replace(/นะจ๊ะ/g, 'นะครับ')
      .replace(/ค่ะ/g, 'ครับ')
      .replace(/คะ(?=\s|[!?.]|$)/g, 'ครับ');
  }

  // 2. Single-pass longest-phrase replacement from dictionary
  const regionMap = DICT_LOOKUP[targetRegion];
  text = text.replace(COMBINED_DICT_REGEX, (matched) => {
    const replacement = regionMap.get(matched);
    if (replacement !== undefined) {
      if (replacement !== matched) count++;
      return replacement;
    }
    return matched;
  });

  // 3. Contextual grammar & pronoun refinements per region + gender
  if (targetRegion === 'northern') {
    text = text
      .replace(/ผม(?=\s|จะ|ขอ|อยาก|มา|พา)/g, gender === 'male' ? 'อ้าย' : 'ข้าเจ้า')
      .replace(/หนู(?=\s|จะ|ขอ|อยาก|มา|พา)/g, gender === 'male' ? 'อ้าย' : 'น้อง')
      .replace(/ให้(?=[ก-๙])/g, 'ฮื้อ')
      .replace(/ไม่(?!กี่)(?=[ก-ฮ])/g, 'บ่');

    if (gender === 'female') {
      text = text
        .replace(/สุมาเต๊อะกั๊บ/g, 'สวัสดีเจ้า')
        .replace(/เน้อกั๊บ|เน้อครับ/g, 'เน้อเจ้า')
        .replace(/นะคะ|นะครับ/g, 'เน้อเจ้า')
        .replace(/กั๊บ|ครับผม|ครับ|ค่ะ|คะ/g, 'เจ้า')
        .replace(/เลยนะ/g, 'เลยเน้อเจ้า')
        .replace(/นะจ๊ะ|จ๊ะ|จ้ะ/g, 'เจ้า');
      if (!/เจ้า|เน้อเจ้า|เจ๊า|เน่อ/.test(text.trim())) {
        text = `${text.trim()} เน้อเจ้า`;
        count++;
      }
    } else {
      text = text
        .replace(/สวัสดีเจ้า/g, 'สุมาเต๊อะกั๊บ')
        .replace(/เน้อเจ้า/g, 'เน้อกั๊บ')
        .replace(/นะคะ|ค่ะ|คะ/g, 'กั๊บ')
        .replace(/(?<!สู|ข้า|พระ|เป็น|ของ)เจ้า(?=\s|[!?.]|$)/g, 'กั๊บ')
        .replace(/นะครับ/g, 'เน้อกั๊บ')
        .replace(/ครับผม|ครับ/g, 'กั๊บ')
        .replace(/เลยนะ/g, 'เลยเน้อกั๊บ');
      if (!/กั๊บ|เน้อครับ|เน้อ/.test(text.trim())) {
        text = `${text.trim()} เน้อกั๊บ`;
        count++;
      }
    }
  } else if (targetRegion === 'isan') {
    text = text
      .replace(/ผม(?=\s|จะ|สิ|ขอ|อยาก|มา|พา)/g, gender === 'male' ? 'อ้าย' : 'ข้อย')
      .replace(/หนู(?=\s|จะ|สิ|ขอ|อยาก|มา|พา)/g, gender === 'male' ? 'อ้าย' : 'น้อง')
      .replace(/จะ(?=ไป|มา|พา|ได้|บอก|เว้า|เฮ็ด|ทำ|กิน|ซื้อ|ลด|ลอง|ชวน|ซวน)/g, 'สิ')
      .replace(/ไม่(?!กี่)(?=[ก-ฮ])/g, 'บ่');

    if (gender === 'female') {
      text = text
        .replace(/เด้อครับพี่น้อง/g, 'เด้อจ้าพี่น้อง')
        .replace(/เด้อครับ/g, 'เด้อจ้า')
        .replace(/นะคะ|นะครับ/g, 'เด้อจ้า')
        .replace(/ครับผม|ครับ|ค่ะ|คะ/g, 'จ้า')
        .replace(/เลยนะ/g, 'โลดเด้อจ้า')
        .replace(/นะจ๊ะ|จ๊ะ|จ้ะ/g, 'เด้อจ้า');
      if (!/เด้อจ้า|จ้า|เด้อ/.test(text.trim())) {
        text = `${text.trim()} เด้อจ้า`;
        count++;
      }
    } else {
      text = text
        .replace(/เด้อจ้าพี่น้อง/g, 'เด้อครับพี่น้อง')
        .replace(/เด้อจ้า|แหน่จ้า/g, 'เด้อครับ')
        .replace(/นะคะ|ค่ะ|คะ|จ้า/g, 'เด้อครับ')
        .replace(/นะครับ/g, 'เด้อครับพี่น้อง')
        .replace(/ครับผม|ครับ/g, 'เด้อครับ')
        .replace(/เลยนะ/g, 'โลดเด้อครับ');
      if (!/เด้อครับ|เด้อ/.test(text.trim())) {
        text = `${text.trim()} เด้อครับพี่น้อง`;
        count++;
      }
    }
  } else if (targetRegion === 'southern') {
    text = text
      .replace(/ผม(?=\s|จะ|ขอ|อยาก|มา|พา)/g, gender === 'male' ? 'พี่บ่าว' : 'น้องนุ้ย')
      .replace(/หนู(?=\s|จะ|ขอ|อยาก|มา|พา)/g, gender === 'male' ? 'พี่บ่าว' : 'น้องนุ้ย')
      .replace(/แลตะด้วยกัน/g, 'แลด้วยกัน')
      .replace(/(?<=ลอง|ชิม|แล|มา|ไป|สั่ง)สิ(?=\s|[!?.]|$)/g, 'ตะ');

    if (gender === 'female') {
      text = text
        .replace(/หวัดดีคับพี่น้อง/g, 'หวัดดีค่ะพี่น้องเหอ')
        .replace(/คับพี่น้อง|ตะพี่น้อง/g, 'ตะน้องเหอ')
        .replace(/นะคะ|นะครับ/g, 'ตะน้องเหอ')
        .replace(/(?<!นิ)ค่ะ(?!พี่น้อง)/g, 'นิค่ะ')
        .replace(/ครับผม|ครับ|คับ/g, 'นิค่ะ')
        .replace(/เลยนะ/g, 'เลยตะน้องเหอ')
        .replace(/นะจ๊ะ|จ๊ะ|จ้ะ/g, 'นิค่ะ');
      if (!/นิ|จังหู้|เหอ|ตะ/.test(text.trim())) {
        text = `${text.trim()} หรอยจังหู้นิค่ะ`;
        count++;
      }
    } else {
      text = text
        .replace(/หวัดดีค่ะพี่น้องเหอ/g, 'หวัดดีคับพี่น้อง')
        .replace(/พี่น้องเหอ|ตะน้องเหอ|น้องเหอ/g, 'ตะพี่น้อง')
        .replace(/นิค่ะ|นะคะ|ค่ะ|คะ/g, 'คับพี่น้อง')
        .replace(/นะครับ/g, 'ตะพี่น้อง')
        .replace(/ครับผม|ครับ/g, 'คับพี่น้อง')
        .replace(/เลยนะ/g, 'เลยตะพี่น้อง');
      if (!/คับพี่น้อง|นิ|ตะ|จังหู้/.test(text.trim())) {
        text = `${text.trim()} หรอยอย่างแรงคับพี่น้อง`;
        count++;
      }
    }
  }

  // 4. Deduplicate repeated regional particles cleanly
  const cleaned = text
    .replace(/ตะด้วยกันตะ/g, 'ด้วยกันตะ')
    .replace(/ตะ\s*ตะ/g, 'ตะ')
    .replace(/เน้อ\s*เน้อ/g, 'เน้อ')
    .replace(/เจ้า\s*เจ้า/g, 'เจ้า')
    .replace(/กั๊บ\s*กั๊บ/g, 'กั๊บ')
    .replace(/เด้อ\s*เด้อ/g, 'เด้อ')
    .replace(/จ้า\s*จ้า/g, 'จ้า')
    .replace(/นิ\s*นิ/g, 'นิ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    translatedText: cleaned,
    replacedWordsCount: count,
    highlightedText: cleaned,
    sourceText,
  };
}

export interface DialectDemoPhrase {
  id: string;
  central: string;
  northern: string;
  isan: string;
  southern: string;
  category: string;
}

export const DIALECT_DEMO_PHRASES: DialectDemoPhrase[] = [
  {
    id: 'demo-food',
    category: 'รีวิวอาหาร',
    central: 'สวัสดีค่ะ วันนี้อาหารร้านนี้อร่อยมาก รสชาติกลมกล่อม ราคาไม่แพง อยากชวนทุกคนมาลองชิมด้วยกันนะคะ',
    northern: 'สวัสดีเจ้า วันนี้อาหารฮ้านนี้ลำขนาด รสชาติกลมกล่อมลำขนาด ราคาบ่แปง อยากจวนสูเจ้ามาลองจิมผ่อโตยกั๋นเน้อเจ้า',
    isan: 'สะบายดีเด้อจ้าพี่น้อง มื้อนี้อาหารฮ้านนี้แซ่บหลาย รสชาติกลมกล่อมนัวคัก ราคาบ่แพง อยากซวนพี่น้องมาลองชิมเบิ่งนำกันเด้อจ้า',
    southern: 'หวัดดีค่ะพี่น้องเหอ วันนี้อาหารร้านนี้นิหรอยจังหู้ รสชาติกลมกล่อมหรอยได้ใจ ราคาไม่แพงนิ อยากชวนพี่น้องมาลองชิมแลตะน้องเหอ',
  },
  {
    id: 'demo-promo',
    category: 'โปรโมชั่นลดราคา',
    central: 'โปรโมชั่นพิเศษวันนี้ ลดราคาคุ้มค่าที่สุด สินค้ามีจำนวนจำกัด รีบสั่งซื้อกันเลยนะคะ',
    northern: 'โปรโมชั่นพิเศษวันนี้ดีขนาด ลดราคาจ้าดนักคุ้มค่าแต้ๆ ของมีจ๋ำนวนจ๋ำกัดเน้อ ฟั่งสั่งซื้อกั๋นเลยเน้อเจ้า',
    isan: 'โปรพิเศษมื้อนี้คักอีหลี ลดราคาคักหลายคุ้มคักอีหลี ของมีจำกัดเด้อพี่น้อง ฟ้าวสั่งซื้อนำกันโลดเด้อจ้า',
    southern: 'โปรเด็ดอย่างแรงวันนี้นิพี่น้อง ลดราคาอย่างแรงคุ้มอย่างแรงนิ ของมีไม่มากแล้วนิ รีบสั่งซื้อกันเลยตะน้องเหอ',
  },
  {
    id: 'demo-travel',
    category: 'ชวนเที่ยวพักผ่อน',
    central: 'สวัสดีครับ วันนี้จะพาไปเที่ยวชมบรรยากาศสวยมาก คิดถึงเพื่อนๆ ทุกคน มาดูกันเลยครับ',
    northern: 'สุมาเต๊อะกั๊บ วันนี้จะปาไปแอ่วผ่อบรรยากาศงามขนาด กึดเติงหาเปื้อนๆ สูเจ้าตึงหลาย มาผ่อกั๋นเลยกั๊บ',
    isan: 'สะบายดีเด้อครับพี่น้อง มื้อนี้สิพาไปเลาะเบิ่งบรรยากาศงามหลาย คึดฮอดหมู่เสี่ยวพี่น้องสู่สุคน มาเบิ่งนำกันโลดเด้อครับ',
    southern: 'หวัดดีคับพี่น้อง วันนี้พาไปเที่ยวแลบรรยากาศงามจังหู้ หวังเหวิดเพื่อนเกลอพี่น้องทุกคนนิ มาแลกันเลยตะพี่น้อง',
  },
];
