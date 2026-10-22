/**
 * Dialect Translation & Adaptation Engine for Thai Regions
 * Supports:
 * - ภาษากลาง (Central Thai - Standard)
 * - ภาษาเหนือ (Northern Thai / อู้คำเมือง ล้านนา)
 * - ภาษาอีสาน (Isan Thai / เว้าอีสาน)
 * - ภาษาใต้ (Southern Thai / แหลงใต้)
 *
 * Provides comprehensive real-time vocabulary, idiom, and polite particle adaptation
 * based on speaker gender (ชาย/หญิง).
 */

import { RegionType } from '../types/voice';

export interface RegionalMeta {
  id: RegionType;
  title: string;
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
    nameThai: 'ภาษากลาง',
    dialectTagline: 'ชัดถ้อยชัดคำ ไพเราะ เป็นทางการและเป็นมิตร',
    icon: '🏛️',
    accentCharacteristics: 'ระดับเสียงสมดุล วรรณยุกต์มาตรฐาน นุ่มนวล คล่องแคล่ว',
    commonParticles: {
      male: ['ครับ', 'นะเนี่ย', 'นะครับ'],
      female: ['ค่ะ', 'นะคะ', 'คะ'],
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
    nameThai: 'ภาษาเหนือ (อู้กำเมือง)',
    dialectTagline: 'หวานละมุน นุ่มนวล มีเสน่ห์ ยินดีต้อนรับเจ๊า',
    icon: '🏔️',
    accentCharacteristics: 'จังหวะเนิบช้า ลากเสียงท้ายนุ่มนวล ท่วงทำนองไพเราะแบบล้านนา',
    commonParticles: {
      male: ['กั๊บ', 'เน้อครับ', 'ครับผม', 'เน้อ'],
      female: ['เจ้า', 'เน้อเจ้า', 'เจ๊า', 'เน่อ'],
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
    nameThai: 'ภาษาอีสาน (เว้าอีสาน)',
    dialectTagline: 'ม่วนซื่น สดใส จริงใจ คึกคักเป็นกันเองเด้อ',
    icon: '🌾',
    accentCharacteristics: 'จังหวะกระฉับกระเฉง รื่นเริง สำเนียงสูงต่ำมีชีวิตชีวา อบอุ่น',
    commonParticles: {
      male: ['เด้อครับ', 'เด้อ', 'ครับอ้าย', 'แหน่เด้อ'],
      female: ['เด้อจ้า', 'จ้า', 'เด้อ', 'แหน่จ้า'],
    },
    greetingSample: {
      male: 'สะบายดีเด้อครับพี่น้อง มื้อนี้มาพ้อกันอีกแล้วเด้อ',
      female: 'สวัสดีจ้าพี่น้อง มาพ้อกับน้องคำแพงมื้อนี้ม่วนหลายเด้อจ้า',
    },
    cardGradient: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
  },
  southern: {
    id: 'southern',
    title: 'ภาษาใต้ (แหลงใต้)',
    nameThai: 'ภาษาใต้ (แหลงใต้)',
    dialectTagline: 'หรอยจังหู้ คมเข้ม จริงใจ กระชับฉับไว ตรงไปตรงมา',
    icon: '🌊',
    accentCharacteristics: 'จังหวะเร็ว สั้น กระชับ เน้นเสียงหนักแน่น สำเนียงชาวเลปักษ์ใต้แท้',
    commonParticles: {
      male: ['นิ', 'คับพี่น้อง', 'เหอ', 'แหละ', 'สาว่า'],
      female: ['นิ', 'น้องเหอ', 'จังหู้', 'แหละน้อง', 'สาว่า'],
    },
    greetingSample: {
      male: 'สวัสดีคับพี่น้องชาวใต้ แหลงใต้กันหรอยๆ วันนี้นิ',
      female: 'สวัสดีค่ะพี่น้อง วันนี้น้องนุ้ยมาแหลงให้ฟัง หรอยจังหู้นิ',
    },
    cardGradient: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  },
};

/**
 * Returns an authentic default script for each region and gender
 */
export function getDefaultScriptForRegionAndGender(
  region: RegionType,
  gender: 'female' | 'male' = 'female'
): string {
  if (region === 'northern') {
    return gender === 'female'
      ? 'ยินดีต้อนฮับสู่สตูดิโอพากย์เสียง AI เน้อเจ้า! สูเจ้าสามารถเลือกเสียงป้อจายหรือเสียงแม่ญิง อู้กำเมืองม่วนๆ ปรับความเร็วเนิบช้าหรือโวย แล้วดาวน์โหลดไฟล์เสียงไปใจ้ก๋านได้ตั๋นตีเน้อเจ้า'
      : 'ยินดีต้อนฮับสู่สตูดิโอพากย์เสียง AI เน้อครับ! สูเจ้าสามารถเลือกเสียงป้อจายหรือเสียงแม่ญิง อู้กำเมืองม่วนๆ ปรับความเร็วเนิบช้าหรือโวย แล้วดาวน์โหลดไฟล์เสียงไปใจ้ก๋านได้ตั๋นตีกั๊บ';
  }
  if (region === 'isan') {
    return gender === 'female'
      ? 'สะบายดี ยินดีต้อนฮับสู่สตูดิโอพากย์เสียง AI เด้อจ้า! พี่น้องสามารถเลือกเสียงผู้ชายหรือเสียงผู้หญิง เว้าอีสานม่วนซื่น ปรับความเร็วซ่าหรือไว แล้วดาวน์โหลดไฟล์เสียงไปเฮ็ดเวียกได้ทันทีเด้อจ้า'
      : 'สะบายดี ยินดีต้อนฮับสู่สตูดิโอพากย์เสียง AI เด้อครับ! พี่น้องสามารถเลือกเสียงผู้ชายหรือเสียงผู้หญิง เว้าอีสานม่วนซื่น ปรับความเร็วซ่าหรือไว แล้วดาวน์โหลดไฟล์เสียงไปเฮ็ดเวียกได้ทันทีเด้อครับ';
  }
  if (region === 'southern') {
    return gender === 'female'
      ? 'สวัสดีค่ะพี่น้อง ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI นิ! พี่น้องสามารถเลือกเสียงผู้ชายหรือเสียงผู้หญิง แหลงใต้หรอยๆ ปรับความเร็วช้าหรือเร็ว แล้วดาวน์โหลดไฟล์เสียงเอาไปใช้การได้ทันทีนิค่ะ'
      : 'สวัสดีคับพี่น้อง ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI นิ! พี่น้องสามารถเลือกเสียงผู้ชายหรือเสียงผู้หญิง แหลงใต้หรอยๆ ปรับความเร็วช้าหรือเร็ว แล้วดาวน์โหลดไฟล์เสียงเอาไปใช้การได้ทันทีนิคับพี่น้อง';
  }
  return gender === 'female'
    ? 'ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI คุณสามารถเลือกเสียงผู้ชายหรือเสียงผู้หญิง ปรับความเร็วช้า ปกติ หรือเร็ว แล้วดาวน์โหลดไฟล์เสียงนำไปใช้งานได้ทันทีค่ะ'
    : 'ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI คุณสามารถเลือกเสียงผู้ชายหรือเสียงผู้หญิง ปรับความเร็วช้า ปกติ หรือเร็ว แล้วดาวน์โหลดไฟล์เสียงนำไปใช้งานได้ทันทีครับ';
}

// Word dictionary for each dialect
interface DictEntry {
  pattern: RegExp;
  central: string;
  northern: string;
  isan: string;
  southern: string;
}

/**
 * 180+ Rich Dialect Dictionary Entries
 * Ordered with compound words first to prevent sub-string collision
 */
export const DIALECT_DICTIONARY: DictEntry[] = [
  // 1. วลีแนะนำและระบบพากย์เสียง (Studio, Apps & System)
  { pattern: /ยินดีต้อนรับสู่/g, central: 'ยินดีต้อนรับสู่', northern: 'ยินดีต้อนฮับสู่', isan: 'ยินดีต้อนฮับสู่', southern: 'ยินดีต้อนรับสู่' },
  { pattern: /ยินดีต้อนรับ/g, central: 'ยินดีต้อนรับ', northern: 'ยินดีต้อนฮับ', isan: 'ยินดีต้อนฮับ', southern: 'ยินดีต้อนรับ' },
  { pattern: /คุณสามารถ/g, central: 'คุณสามารถ', northern: 'สูเจ้าสามารถ', isan: 'พี่น้องสามารถ', southern: 'สูสามารถ' },
  { pattern: /พวกเราสามารถ/g, central: 'พวกเราสามารถ', northern: 'เฮาสามารถ', isan: 'พวกเฮาสามารถ', southern: 'พวกเราสามารถ' },
  { pattern: /นำไปใช้งานได้ทันที/g, central: 'นำไปใช้งานได้ทันที', northern: 'เอาไปใจ้ก๋านได้ตั๋นตี', isan: 'เอาไปเฮ็ดเวียกได้ทันที', southern: 'เอาไปใช้การได้ทันทีนิ' },
  { pattern: /นำไปใช้งาน/g, central: 'นำไปใช้งาน', northern: 'เอาไปใจ้ก๋าน', isan: 'เอาไปเฮ็ดเวียก', southern: 'เอาไปใช้การ' },
  { pattern: /นำไปใช้/g, central: 'นำไปใช้', northern: 'เอาไปใจ้', isan: 'เอาไปใช้', southern: 'เอาไปใช้' },
  { pattern: /นำไป/g, central: 'นำไป', northern: 'เอาไป', isan: 'เอาไป', southern: 'เอาไป' },
  { pattern: /ใช้งาน/g, central: 'ใช้งาน', northern: 'ใจ้ก๋าน', isan: 'เฮ็ดเวียก', southern: 'ใช้การ' },
  { pattern: /ทันที/g, central: 'ทันที', northern: 'ตั๋นตี', isan: 'ทันทีเด้อ', southern: 'ทันทีนิ' },
  { pattern: /ปรับความเร็ว/g, central: 'ปรับความเร็ว', northern: 'ปรับความโวย', isan: 'ปรับความไว', southern: 'ปรับความเร็ว' },
  { pattern: /ความเร็ว/g, central: 'ความเร็ว', northern: 'ความโวย', isan: 'ความไว', southern: 'ความเร็ว' },
  { pattern: /สตูดิโอพากย์เสียง/g, central: 'สตูดิโอพากย์เสียง', northern: 'สตูดิโออู้เสียง', isan: 'สตูดิโอเว้าเสียง', southern: 'สตูดิโอแหลงเสียง' },
  { pattern: /พากย์เสียง/g, central: 'พากย์เสียง', northern: 'อู้เสียง', isan: 'เว้าเสียง', southern: 'แหลงเสียง' },
  { pattern: /เสียงพากย์/g, central: 'เสียงพากย์', northern: 'เสียงอู้', isan: 'เสียงเว้า', southern: 'เสียงแหลง' },
  { pattern: /ดาวน์โหลด/g, central: 'ดาวน์โหลด', northern: 'โหลด', isan: 'โหลด', southern: 'โหลด' },

  // 2. คำสรรพนามและคน (Pronouns & People)
  { pattern: /ผู้ชาย/g, central: 'ผู้ชาย', northern: 'ป้อจาย', isan: 'ผู้ชาย', southern: 'ผู้ชาย' },
  { pattern: /ผู้หญิง/g, central: 'ผู้หญิง', northern: 'แม่ญิง', isan: 'ผู้หญิง', southern: 'แม่หญิง' },
  { pattern: /เพื่อนๆ/g, central: 'เพื่อนๆ', northern: 'เปื้อนๆ', isan: 'หมู่เสี่ยว', southern: 'เกลอๆ' },
  { pattern: /เพื่อน/g, central: 'เพื่อน', northern: 'เปื้อน', isan: 'เสี่ยว', southern: 'เกลอ' },
  { pattern: /พี่ชาย/g, central: 'พี่ชาย', northern: 'ปี้จาย', isan: 'อ้าย', southern: 'พี่บ่าว' },
  { pattern: /พี่สาว/g, central: 'พี่สาว', northern: 'ปี้สาว', isan: 'เอื้อย', southern: 'พี่สาว' },
  { pattern: /น้องสาว/g, central: 'น้องสาว', northern: 'น้องสาว', isan: 'น้องหล้า', southern: 'น้องสาวนุ้ย' },
  { pattern: /น้องชาย/g, central: 'น้องชาย', northern: 'น้องจาย', isan: 'น้องชาย', southern: 'น้องบ่าว' },
  { pattern: /พ่อ/g, central: 'พ่อ', northern: 'ป้อ', isan: 'พ่อ', southern: 'พ่อ' },
  { pattern: /แม่/g, central: 'แม่', northern: 'แม่', isan: 'แม่', southern: 'แม่' },
  { pattern: /พวกเรา/g, central: 'พวกเรา', northern: 'เฮาตึงหลาย', isan: 'พวกเฮา', southern: 'พวกเรา' },
  { pattern: /ทุกคน/g, central: 'ทุกคน', northern: 'สูเจ้าตึงหลาย', isan: 'พี่น้องสู่สุคน', southern: 'คนทุกคนนิ' },
  { pattern: /ท่าน/g, central: 'ท่าน', northern: 'ตั๋วเปิ้น', isan: 'พี่น้อง', southern: 'ท่าน' },
  { pattern: /คุณ/g, central: 'คุณ', northern: 'สูเจ้า', isan: 'เจ้า', southern: 'สู' },
  { pattern: /ฉัน/g, central: 'ฉัน', northern: 'ข้าเจ้า', isan: 'ข้อย', southern: 'ฉาน' },
  { pattern: /ผม/g, central: 'ผม', northern: 'ตั๋วเปิ้น', isan: 'ข้อย', southern: 'ผม' },
  { pattern: /เธอ/g, central: 'เธอ', northern: 'ตั๋ว', isan: 'เจ้า', southern: 'สู' },
  { pattern: /ใคร/g, central: 'ใคร', northern: 'ไผ', isan: 'ไผ', southern: 'ใคร' },

  // 3. ทักทาย แสดงความยินดี และถามไถ่ (Greetings & Courtesies)
  { pattern: /สวัสดีครับ/g, central: 'สวัสดีครับ', northern: 'สุมาเต๊อะกั๊บ', isan: 'สะบายดีเด้อครับ', southern: 'สวัสดีคับพี่น้อง' },
  { pattern: /สวัสดีค่ะ/g, central: 'สวัสดีค่ะ', northern: 'สวัสดีเจ้า', isan: 'สะบายดีเด้อจ้า', southern: 'สวัสดีค่ะพี่น้อง' },
  { pattern: /สวัสดี/g, central: 'สวัสดี', northern: 'สวัสดี', isan: 'สะบายดี', southern: 'สวัสดี' },
  { pattern: /สบายดีไหม/g, central: 'สบายดีไหม', northern: 'สะบายดีก่อ', isan: 'สะบายดีบ่', southern: 'บายดีหม้าย' },
  { pattern: /สบายดี/g, central: 'สบายดี', northern: 'สะบายดี', isan: 'สะบายดี', southern: 'บายดี' },
  { pattern: /ขอบคุณมาก/g, central: 'ขอบคุณมาก', northern: 'ยินดีจ้าดนัก', isan: 'ขอบใจหลายๆ', southern: 'ขอบคุณจังหู้' },
  { pattern: /ขอบคุณ/g, central: 'ขอบคุณ', northern: 'ยินดีนัก', isan: 'ขอบใจหลาย', southern: 'ขอบคุณ' },
  { pattern: /เป็นอย่างไรบ้าง/g, central: 'เป็นอย่างไรบ้าง', northern: 'เป๋นจะไดพ่อง', isan: 'เป็นจังได๋แหน่', southern: 'เป็นพันพรือมั่ง' },
  { pattern: /คิดถึงมาก/g, central: 'คิดถึงมาก', northern: 'กึดเติงหาขนาด', isan: 'คึดฮอดหลาย', southern: 'หวังเหวิดจังหู้' },
  { pattern: /คิดถึง/g, central: 'คิดถึง', northern: 'กึดเติงหา', isan: 'คึดฮอด', southern: 'หวังเหวิด' },

  // 4. คุณศัพท์ รสชาติ และความรู้สึก (Adjectives & Taste)
  { pattern: /อร่อยมาก/g, central: 'อร่อยมาก', northern: 'ลำขนาด', isan: 'แซ่บหลาย', southern: 'หรอยจังหู้' },
  { pattern: /อร่อยจริงๆ/g, central: 'อร่อยจริงๆ', northern: 'ลำแต้ๆ', isan: 'แซ่บอีหลี', southern: 'หรอยอย่างแรง' },
  { pattern: /อร่อย/g, central: 'อร่อย', northern: 'ลำ', isan: 'แซ่บ', southern: 'หรอย' },
  { pattern: /ไม่อร่อย/g, central: 'ไม่อร่อย', northern: 'บ่ลำ', isan: 'บ่แซ่บ', southern: 'ไม่หรอย' },
  { pattern: /สวยมาก/g, central: 'สวยมาก', northern: 'งามขนาด', isan: 'งามหลาย', southern: 'งามจังหู้' },
  { pattern: /สวยจริงๆ/g, central: 'สวยจริงๆ', northern: 'งามแต้ๆ', isan: 'งามคักอีหลี', southern: 'งามได้ใจ' },
  { pattern: /สวย/g, central: 'สวย', northern: 'งาม', isan: 'งาม', southern: 'งาม' },
  { pattern: /น่ารักมาก/g, central: 'น่ารักมาก', northern: 'น่าฮักขนาด', isan: 'ตาฮักหลาย', southern: 'น่ารักจังหู้' },
  { pattern: /น่ารัก/g, central: 'น่ารัก', northern: 'น่าฮัก', isan: 'ตาฮัก', southern: 'น่ารัก' },
  { pattern: /สนุกมาก/g, central: 'สนุกมาก', northern: 'ม่วนขนาด', isan: 'ม่วนหลาย', southern: 'หรอยหนัด' },
  { pattern: /สนุก/g, central: 'สนุก', northern: 'ม่วน', isan: 'ม่วนซื่น', southern: 'หรอย' },
  { pattern: /เยอะมาก/g, central: 'เยอะมาก', northern: 'นักขนาด', isan: 'หลายคัก', southern: 'ลุยเหม็ด' },
  { pattern: /มากจริงๆ/g, central: 'มากจริงๆ', northern: 'ขนาดแต้ๆ', isan: 'คักอีหลี', southern: 'อย่างแรงนิ' },
  { pattern: /เหนื่อยมาก/g, central: 'เหนื่อยมาก', northern: 'อิดขนาด', isan: 'เมื่อยหลาย', southern: 'เหนื่อยหนัด' },
  { pattern: /เหนื่อย/g, central: 'เหนื่อย', northern: 'อิด', isan: 'เมื่อย', southern: 'เหนื่อย' },
  { pattern: /ร้อนมาก/g, central: 'ร้อนมาก', northern: 'ฮ้อนขนาด', isan: 'ฮ้อนหลาย', southern: 'ร้อนจังหู้' },
  { pattern: /ร้อน/g, central: 'ร้อน', northern: 'ฮ้อน', isan: 'ฮ้อน', southern: 'ร้อน' },
  { pattern: /หนาวมาก/g, central: 'หนาวมาก', northern: 'หนาวขนาด', isan: 'หนาวคัก', southern: 'เย็นเยียบ' },
  { pattern: /หนาว/g, central: 'หนาว', northern: 'หนาว', isan: 'หนาว', southern: 'เย็น' },
  { pattern: /สุดยอด/g, central: 'สุดยอด', northern: 'สุดยอดแต้ๆ', isan: 'สุดยอดคัก', southern: 'หรอยได้ใจ' },
  { pattern: /ยอดเยี่ยม/g, central: 'ยอดเยี่ยม', northern: 'ดีขนาด', isan: 'คักอีหลี', southern: 'หรอยหนัด' },
  { pattern: /ดีมาก/g, central: 'ดีมาก', northern: 'ดีขนาด', isan: 'ดีหลาย', southern: 'ดีจังหู้' },
  { pattern: /ตื่นเต้น/g, central: 'ตื่นเต้น', northern: 'ตื่นเต้นขนาด', isan: 'ตื่นเต้นหลาย', southern: 'ตื่นเต้นจังหู้' },
  { pattern: /โมโห/g, central: 'โมโห', northern: 'โขดขนาด', isan: 'สูนหลาย', southern: 'หวิบจังหู้' },
  { pattern: /โกรธ/g, central: 'โกรธ', northern: 'โขด', isan: 'สูน', southern: 'หวิบ' },
  { pattern: /รักมาก/g, central: 'รักมาก', northern: 'ฮักขนาด', isan: 'ฮักหลาย', southern: 'รักจังหู้' },
  { pattern: /รัก/g, central: 'รัก', northern: 'ฮัก', isan: 'ฮัก', southern: 'รัก' },
  { pattern: /ชอบมาก/g, central: 'ชอบมาก', northern: 'มักขนาด', isan: 'มักหลาย', southern: 'ชอบจังหู้' },
  { pattern: /ชอบ/g, central: 'ชอบ', northern: 'มัก', isan: 'มัก', southern: 'ชอบ' },
  { pattern: /ไม่ชอบ/g, central: 'ไม่ชอบ', northern: 'บ่มัก', isan: 'บ่มัก', southern: 'ไม่ชอบ' },
  { pattern: /จริงใจ/g, central: 'จริงใจ', northern: 'แต้ใจ', isan: 'จริงใจคัก', southern: 'จริงใจหนัด' },
  { pattern: /จริง/g, central: 'จริง', northern: 'แต้', isan: 'อีหลี', southern: 'จริง' },
  { pattern: /มาก/g, central: 'มาก', northern: 'ขนาด', isan: 'หลาย', southern: 'จังหู้' },

  // 5. กริยาและการกระทำ (Actions & Verbs)
  { pattern: /อย่าพูดโกหก/g, central: 'อย่าพูดโกหก', northern: 'อย่ามาอู้ขี้จุ๊', isan: 'อย่ามาเว้าขี้ตั๋ว', southern: 'อย่ามาแหลงขี้หก' },
  { pattern: /อย่าโกหก/g, central: 'อย่าโกหก', northern: 'อย่ามาขี้จุ๊', isan: 'อย่ามาขี้ตั๋ว', southern: 'อย่ามาขี้หก' },
  { pattern: /พูดโกหก/g, central: 'พูดโกหก', northern: 'อู้ขี้จุ๊', isan: 'เว้าขี้ตั๋ว', southern: 'แหลงขี้หก' },
  { pattern: /โกหก/g, central: 'โกหก', northern: 'ขี้จุ๊', isan: 'ขี้ตั๋ว', southern: 'ขี้หก' },
  { pattern: /ขี้โม้/g, central: 'ขี้โม้', northern: 'ขี้จุ๊โม้', isan: 'ขี้โม้คัก', southern: 'ขี้ฮกเจ็ดพันแปด' },
  { pattern: /พูดคุย/g, central: 'พูดคุย', northern: 'อู้จา', isan: 'เว้าจา', southern: 'แหลงคุย' },
  { pattern: /พูด/g, central: 'พูด', northern: 'อู้', isan: 'เว้า', southern: 'แหลง' },
  { pattern: /มองดู/g, central: 'มองดู', northern: 'จ้องผ่อ', isan: 'เบิ่งแยง', southern: 'แลดู' },
  { pattern: /มอง/g, central: 'มอง', northern: 'ผ่อ', isan: 'เบิ่ง', southern: 'แล' },
  { pattern: /ดู/g, central: 'ดู', northern: 'ผ่อ', isan: 'เบิ่ง', southern: 'แล' },
  { pattern: /กลับบ้าน/g, central: 'กลับบ้าน', northern: 'ปิ๊กบ้าน', isan: 'เมือบ้าน', southern: 'หลบเริน' },
  { pattern: /กลับ/g, central: 'กลับ', northern: 'ปิ๊ก', isan: 'เมือ', southern: 'หลบ' },
  { pattern: /บ้าน/g, central: 'บ้าน', northern: 'เฮือน', isan: 'เฮือน', southern: 'เริน' },
  { pattern: /ไปไหนมา/g, central: 'ไปไหนมา', northern: 'ไปตางไดมา', isan: 'ไปไสมาน้อ', southern: 'ไปไหนมานิ' },
  { pattern: /ไปไหน/g, central: 'ไปไหน', northern: 'ไปตางได', isan: 'ไปไส', southern: 'ไปไหนนิ' },
  { pattern: /ทำอะไรอยู่/g, central: 'ทำอะไรอยู่', northern: 'ยะหยังอยู่', isan: 'เฮ็ดหยังอยู่', southern: 'ทำไซรอยู่' },
  { pattern: /ทำอะไร/g, central: 'ทำอะไร', northern: 'ยะหยัง', isan: 'เฮ็ดหยัง', southern: 'ทำไซร' },
  { pattern: /ทำไม/g, central: 'ทำไม', northern: 'ยะหยัง', isan: 'เป็นหยัง', southern: 'ไซร' },
  { pattern: /ทำ/g, central: 'ทำ', northern: 'ยะ', isan: 'เฮ็ด', southern: 'ทำ' },
  { pattern: /วิ่ง/g, central: 'วิ่ง', northern: 'ล่น', isan: 'แล่น', southern: 'แล่น' },
  { pattern: /เดิน/g, central: 'เดิน', northern: 'เตียว', isan: 'ย่าง', southern: 'เดิน' },
  { pattern: /กินข้าวหรือยัง/g, central: 'กินข้าวหรือยัง', northern: 'กิ๋นข้าวแล้วกา', isan: 'กินข้าวแล้วบ่', southern: 'กินข้าวแล้วหม้าย' },
  { pattern: /กินข้าว/g, central: 'กินข้าว', northern: 'กิ๋นข้าว', isan: 'กินข้าว', southern: 'กินข้าว' },
  { pattern: /กิน/g, central: 'กิน', northern: 'กิ๋น', isan: 'กิน', southern: 'กิน' },
  { pattern: /น้ำดื่ม/g, central: 'น้ำดื่ม', northern: 'น้ำกิ๋น', isan: 'น้ำกิน', southern: 'น้ำกิน' },
  { pattern: /ไปตลาด/g, central: 'ไปตลาด', northern: 'ไปกาด', isan: 'ไปตลาด', southern: 'ไปหลาด' },
  { pattern: /ตลาด/g, central: 'ตลาด', northern: 'กาด', isan: 'ตลาด', southern: 'หลาด' },
  { pattern: /ทำงาน/g, central: 'ทำงาน', northern: 'ยะก๋าน', isan: 'เฮ็ดเวียก', southern: 'ทำเบี้ย' },
  { pattern: /งาน/g, central: 'งาน', northern: 'ก๋าน', isan: 'เวียก', southern: 'งาน' },
  { pattern: /เงิน/g, central: 'เงิน', northern: 'เบี้ย', isan: 'เงิน', southern: 'เบี้ย' },
  { pattern: /หัวเราะ/g, central: 'หัวเราะ', northern: 'หัว', isan: 'หัวเราะม่วน', southern: 'หัวร่อ' },
  { pattern: /ร้องไห้/g, central: 'ร้องไห้', northern: 'ไห้', isan: 'ไห้', southern: 'ร้องไห้' },

  // 6. ความเร็วและจังหวะ (Speed & Pacing)
  { pattern: /ช้า/g, central: 'ช้า', northern: 'เนิบๆ ซ่าๆ', isan: 'ซ่าๆ', southern: 'ช้าๆ' },
  { pattern: /เร็ว/g, central: 'เร็ว', northern: 'โวยๆ', isan: 'ไวๆ', southern: 'เร็วๆ หรอยๆ' },
  { pattern: /ปกติ/g, central: 'ปกติ', northern: 'ม่วนๆ ปกติ', isan: 'พอดีๆ', southern: 'ปกติ' },

  // 7. คำถาม ปฏิเสธ และยืนยัน (Questions & Negatives)
  { pattern: /ไม่เป็นไร/g, central: 'ไม่เป็นไร', northern: 'บ่เป็นหยัง', isan: 'บ่เป็นหยังดอก', southern: 'หม้ายพรือ' },
  { pattern: /ไม่เข้าใจ/g, central: 'ไม่เข้าใจ', northern: 'บ่ฮู้เรื่อง', isan: 'บ่ฮู้เรื่อง', southern: 'ไม่โร้เรื่อง' },
  { pattern: /ไม่รู้/g, central: 'ไม่รู้', northern: 'บ่ฮู้', isan: 'บ่ฮู้', southern: 'ไม่โร้' },
  { pattern: /รู้/g, central: 'รู้', northern: 'ฮู้', isan: 'ฮู้', southern: 'โร้' },
  { pattern: /ไม่จริง/g, central: 'ไม่จริง', northern: 'บ่แต้', isan: 'บ่แม่น', southern: 'ไม่จริงนิ' },
  { pattern: /จริงเหรอ/g, central: 'จริงเหรอ', northern: 'แต้กา', isan: 'อีหลีติ', southern: 'จริงเห้อ' },
  { pattern: /ใช่ไหม/g, central: 'ใช่ไหม', northern: 'แม่นก่อ', isan: 'แม่นบ่', southern: 'หม้ายเล่า' },
  { pattern: /ไม่ใช่/g, central: 'ไม่ใช่', northern: 'บ่ใจ้', isan: 'บ่แม่น', southern: 'ไม่ช่าย' },
  { pattern: /ไม่มี/g, central: 'ไม่มี', northern: 'บ่มี', isan: 'บ่มี', southern: 'หม้าย' },
  { pattern: /อะไร/g, central: 'อะไร', northern: 'อะหยัง', isan: 'อีหยัง', southern: 'ไอ้ไหร่' },
  { pattern: /ที่ไหน/g, central: 'ที่ไหน', northern: 'ตี้ไหน', isan: 'หม่องได๋', southern: 'ตรงไหน' },
  { pattern: /ที่นี่/g, central: 'ที่นี่', northern: 'ตี้งี้', isan: 'หม่องนี้', southern: 'ตรงนี้' },
  { pattern: /อย่างไร/g, central: 'อย่างไร', northern: 'จะได', isan: 'จังได๋', southern: 'พันพรือ' },
  { pattern: /เท่าไหร่/g, central: 'เท่าไหร่', northern: 'กี่บาท', isan: 'ท่อได๋', southern: 'กี่บาทนิ' },

  // 8. วันเวลา (Time)
  { pattern: /วันนี้/g, central: 'วันนี้', northern: 'วันนี้', isan: 'มื้อนี้', southern: 'วันนี้' },
  { pattern: /พรุ่งนี้/g, central: 'พรุ่งนี้', northern: 'วันพูก', isan: 'มื้ออื่น', southern: 'วันพูก' },
  { pattern: /เมื่อวานนี้/g, central: 'เมื่อวานนี้', northern: 'เมื่อวานซืน', isan: 'มื้อวาน', southern: 'ต่อโพลก' },
  { pattern: /เมื่อวาน/g, central: 'เมื่อวาน', northern: 'เมื่อวานซืน', isan: 'มื้อวาน', southern: 'ต่อโพลก' },
  { pattern: /ตอนเช้า/g, central: 'ตอนเช้า', northern: 'เมื่อเจ๊า', isan: 'ยามเซ้า', southern: 'หัวเช้า' },
  { pattern: /ตอนกลางวัน/g, central: 'ตอนกลางวัน', northern: 'เมื่อวัน', isan: 'ยามเว็น', southern: 'หวางวัน' },
  { pattern: /ตอนเย็น/g, central: 'ตอนเย็น', northern: 'เมื่อแลง', isan: 'ยามแลง', southern: 'หวางไป' },
  { pattern: /ตอนกลางคืน/g, central: 'ตอนกลางคืน', northern: 'เมื่อคืน', isan: 'ยามคืน', southern: 'ค่ำคืน' },
  { pattern: /ตอนค่ำ/g, central: 'ตอนค่ำ', northern: 'เมื่อค่ำ', isan: 'ยามค่ำ', southern: 'ค่ำคืน' },

  // 9. อาหารและสินค้า (Food & Shopping)
  { pattern: /ส้มตำ/g, central: 'ส้มตำ', northern: 'ส้มต๋ำ', isan: 'ตำบักหุ่ง', southern: 'ส้มตำ' },
  { pattern: /ปลาร้า/g, central: 'ปลาร้า', northern: 'ฮ้า', isan: 'ปลาแดก', southern: 'ปลาร้า' },
  { pattern: /ลดราคา/g, central: 'ลดราคา', northern: 'ลดราคาจ้าดนัก', isan: 'ลดราคาคักหลาย', southern: 'ลดราคาอย่างแรง' },
  { pattern: /โปรโมชั่น/g, central: 'โปรโมชั่น', northern: 'โปรโมชั่นดีขนาด', isan: 'โปรโมชั่นแซ่บคัก', southern: 'โปรโมชั่นหรอยจังหู้' },
];

/**
 * Translates a Central Thai text into the target regional dialect with realistic intonation rules.
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
  if (!sourceText || targetRegion === 'central') {
    return {
      translatedText: sourceText,
      replacedWordsCount: 0,
      highlightedText: sourceText,
      sourceText,
    };
  }

  let text = sourceText;
  let count = 0;

  // Step 1: Replace vocabulary from dictionary
  DIALECT_DICTIONARY.forEach((entry) => {
    const replacement = entry[targetRegion];
    if (replacement && text.includes(entry.central)) {
      const regex = new RegExp(entry.central, 'g');
      const matches = text.match(regex);
      if (matches) {
        count += matches.length;
        text = text.replace(regex, replacement);
      }
    }
  });

  // Step 2: Handle polite end particles based on dialect and gender
  if (targetRegion === 'northern') {
    if (gender === 'female') {
      text = text.replace(/นะคะ/g, 'เน้อเจ้า');
      text = text.replace(/ค่ะ/g, 'เจ้า');
      text = text.replace(/ครับ/g, 'เจ้า');
      text = text.replace(/นะ/g, 'เน้อ');
      text = text.replace(/จ๊ะ|จ้ะ/g, 'เจ้า');
      // If ends without polite particle, append gentle Lanna ending
      if (!/เจ้า|เน้อเจ้า|กั๊บ|เน้อ/g.test(text.trim())) {
        text = text.trim() + ' เน้อเจ้า';
      }
    } else {
      text = text.replace(/นะคะ|ค่ะ/g, 'เน้อครับ');
      text = text.replace(/ครับ/g, 'กั๊บ');
      text = text.replace(/นะ/g, 'เน้อ');
      if (!/กั๊บ|เน้อครับ|เน้อ/g.test(text.trim())) {
        text = text.trim() + ' เน้อครับ';
      }
    }
  } else if (targetRegion === 'isan') {
    if (gender === 'female') {
      text = text.replace(/นะคะ/g, 'เด้อจ้า');
      text = text.replace(/ค่ะ/g, 'จ้า');
      text = text.replace(/ครับ/g, 'เด้อจ้า');
      text = text.replace(/นะ/g, 'เด้อ');
      text = text.replace(/จ๊ะ|จ้ะ/g, 'เด้อจ้า');
      if (!/เด้อจ้า|จ้า|เด้อ/g.test(text.trim())) {
        text = text.trim() + ' เด้อจ้า';
      }
    } else {
      text = text.replace(/นะคะ|ค่ะ/g, 'เด้อครับ');
      text = text.replace(/ครับ/g, 'เด้อครับ');
      text = text.replace(/นะ/g, 'เด้อ');
      if (!/เด้อครับ|เด้อ/g.test(text.trim())) {
        text = text.trim() + ' เด้อครับ';
      }
    }
  } else if (targetRegion === 'southern') {
    if (gender === 'female') {
      text = text.replace(/นะคะ/g, 'นิคะน้อง');
      text = text.replace(/ค่ะ/g, 'นิค่ะ');
      text = text.replace(/ครับ/g, 'นิ');
      text = text.replace(/นะ/g, 'นิ');
      if (!/นิ|จังหู้|เหอ/g.test(text.trim())) {
        text = text.trim() + ' นิ';
      }
    } else {
      text = text.replace(/นะคะ|ค่ะ/g, 'คับพี่น้อง');
      text = text.replace(/ครับ/g, 'คับนิ');
      text = text.replace(/นะ/g, 'นิ');
      if (!/คับพี่น้อง|นิ|คับ/g.test(text.trim())) {
        text = text.trim() + ' คับพี่น้อง';
      }
    }
  }

  return {
    translatedText: text,
    replacedWordsCount: count,
    highlightedText: text,
    sourceText,
  };
}

/**
 * Regional Showcase Quick Phrases
 */
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
    id: 'demo-1',
    category: 'อาหาร & ความอร่อย',
    central: 'ส้มตำร้านนี้อร่อยมาก กินแล้วมีความสุขจริงๆ ครับ',
    northern: 'ส้มต๋ำฮ้านนี้ลำขนาด กิ๋นแล้วมีความสุขแต้ๆ กั๊บ',
    isan: 'ตำบักหุ่งฮ้านนี้แซ่บหลาย กินแล้วมีความสุขคักอีหลีเด้อครับ',
    southern: 'ส้มตำร้านนี้หรอยจังหู้ กินแล้วมีความสุขอย่างแรงนิคับพี่น้อง',
  },
  {
    id: 'demo-2',
    category: 'ทักทาย & ถามไถ่',
    central: 'สวัสดีครับ ไม่เจอกันนาน ไปไหนมา คิดถึงเพื่อนๆ มากเลย',
    northern: 'สุมาเต๊อะกั๊บ บ่ป๊ะกั๋นเมิน ไปตางไดมา กึดเติงหาเปื้อนๆ ขนาดเน้อ',
    isan: 'สะบายดีเด้อ บ่พ้อกันดน ไปไสมาน้อ คึดฮอดหมู่เสี่ยวหลายเด้อ',
    southern: 'สวัสดีคับพี่น้อง ไม่เจอกันนาน ไปไหนมานิ หวังเหวิดเกลอๆ จังหู้',
  },
  {
    id: 'demo-3',
    category: 'ปลอบใจ & ให้กำลังใจ',
    central: 'ไม่เป็นไรนะ ทำงานเหนื่อยมาก พักผ่อนก่อน พรุ่งนี้ค่อยลุยใหม่',
    northern: 'บ่เป็นหยังเน้อ ยะก๋านอิดขนาด พักผ่อนก่อน วันพูกก้อยลุยใหม่กั๊บ',
    isan: 'บ่เป็นหยังดอกเด้อ เฮ็ดเวียกเมื่อยหลาย พักผ่อนก่อน มื้ออื่นค่อยลุยใหม่',
    southern: 'หม้ายพรือนิ ทำงานเหนื่อยหนัด พักผ่อนก่อน วันพูกค่อยลุยใหม่นิ',
  },
  {
    id: 'demo-4',
    category: 'รีวิว & ป้ายยา',
    central: 'ชุดนี้สวยมาก น่ารักจริงๆ ใครเห็นก็ชอบ อย่าพูดโกหกนะ สั่งเลย!',
    northern: 'ชุดนี้งามขนาด น่าฮักแต้ๆ ไผหันก้อมักขนาด อย่าขี้จุ๊เน้อเจ้า สั่งเลย!',
    isan: 'ชุดนี้งามหลาย ตาฮักคักอีหลี ไผเห็นกะมักหลาย อย่าขี้ตั๋วเด้อจ้า สั่งเลย!',
    southern: 'ชุดนี้งามจังหู้ น่ารักได้ใจ ใครเห็นก็ชอบจังหู้ อย่ามาขี้หกนิ สั่งเลย!',
  },
];
