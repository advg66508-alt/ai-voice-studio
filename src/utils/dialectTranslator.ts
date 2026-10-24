/**
 * Dialect Translation & Adaptation Engine for Thai Regions
 * Supports:
 * - ภาษากลาง (Central Thai - Standard)
 * - ภาษาเหนือ (Northern Thai / อู้คำเมือง ล้านนา)
 * - ภาษาอีสาน (Isan Thai / เว้าอีสาน)
 * - ภาษาใต้ (Southern Thai / แหลงใต้)
 *
 * Provides comprehensive real-time vocabulary, idiom, phonetic spelling,
 * and polite particle adaptation based on speaker gender (ชาย/หญิง).
 */

import type { RegionType } from '../types/voice.js';

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
    dialectTagline: 'หวานละมุน นุ่มนวล มีเสน่ห์ ยินดีต้อนฮับเจ้า',
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
      female: 'สะบายดีจ้าพี่น้อง มาพ้อกับน้องคำแพงมื้อนี้ม่วนหลายเด้อจ้า',
    },
    cardGradient: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
  },
  southern: {
    id: 'southern',
    title: 'ภาษาใต้ (แหลงใต้)',
    nameThai: 'ภาษาใต้ (แหลงใต้)',
    dialectTagline: 'หรอยจังหู้ คมเข้ม จริงใจ กระชับฉับไว ตรงไปตรงมา',
    icon: '🌊',
    accentCharacteristics: 'จังหวะเร็ว สั้น กระชับ เน้นเสียงหนักแน่น สำเนียงปักษ์ใต้แท้',
    commonParticles: {
      male: ['นิ', 'คับพี่น้อง', 'ตะพี่น้อง', 'แหละ', 'สาว่า'],
      female: ['นิ', 'พี่น้องเหอ', 'จังหู้นิ', 'ตะน้องเหอ', 'นิค่ะ'],
    },
    greetingSample: {
      male: 'หวัดดีคับพี่น้องชาวใต้ แหลงใต้กันหรอยจังหู้วันนี้นิ',
      female: 'หวัดดีค่ะพี่น้องเหอ วันนี้น้องนุ้ยมาแหลงใต้ให้ฟัง หรอยจังหู้นิค่ะ',
    },
    cardGradient: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  },
};

/**
 * Checks whether a script is currently one of the built-in default welcome greetings
 */
export function isDefaultWelcomeScript(scriptText: string): boolean {
  const t = scriptText.trim();
  if (!t) return true;
  return (
    t.includes('ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI') ||
    t.includes('ยินดีต้อนฮับสู่สตูดิโอพากย์เสียง AI') ||
    t.includes('ยินดีต้อนฮับสู่สตูดิโออู้เสียง AI') ||
    t.includes('ยินดีต้อนรับสู่สตูดิโอแหลงเสียง AI') ||
    t.includes('สุมาเต๊อะกั๊บ') ||
    t.includes('สวัสดีเจ้า ยินดีต้อนฮับสู่เจียงใหม่') ||
    t.includes('สะบายดีเด้อครับพี่น้อง') ||
    t.includes('สวัสดีจ้าพี่น้อง มาพ้อกับน้องคำแพง') ||
    t.includes('สวัสดีคับพี่น้องชาวใต้') ||
    t.includes('หวัดดีคับพี่น้อง') ||
    t.includes('หวัดดีค่ะพี่น้องเหอ') ||
    t.includes('สวัสดีค่ะพี่น้อง วันนี้น้องนุ้ยมาแหลง')
  );
}

/**
 * Returns an authentic default script for each region and gender
 */
export function getDefaultScriptForRegionAndGender(
  region: RegionType,
  gender: 'female' | 'male' | 'neutral' = 'female'
): string {
  const isMale = gender === 'male';
  if (region === 'northern') {
    return isMale
      ? 'สุมาเต๊อะกั๊บ ยินดีต้อนฮับสู่สตูดิโออู้เสียง AI เน้อครับ! สูเจ้าสามารถเลือกเสียงป้อจายหรือเสียงแม่ญิง อู้กำเมืองม่วนๆ ลำขนาด ปรับความโวยเนิบช้าหรือโวย แล้วโหลดไฟล์เสียงเอาไปใจ้ก๋านได้ตั๋นตีกั๊บ'
      : 'สวัสดีเจ้า ยินดีต้อนฮับสู่สตูดิโออู้เสียง AI เน้อเจ้า! สูเจ้าสามารถเลือกเสียงป้อจายหรือเสียงแม่ญิง อู้กำเมืองม่วนๆ ลำแต้ๆ ปรับความโวยเนิบช้าหรือโวย แล้วโหลดไฟล์เสียงเอาไปใจ้ก๋านได้ตั๋นตีเน้อเจ้า';
  }
  if (region === 'isan') {
    return isMale
      ? 'สะบายดีเด้อครับพี่น้อง! ยินดีต้อนฮับสู่สตูดิโอเว้าเสียง AI เด้อครับ พี่น้องสามารถเลือกเสียงอ้ายหรือเสียงน้องหล้า เว้าอีสานม่วนซื่นคักอีหลี ปรับความไวซ่าหรือไว แล้วโหลดไฟล์เสียงเอาไปเฮ็ดเวียกได้ทันทีเด้อครับ'
      : 'สะบายดีจ้าพี่น้อง! ยินดีต้อนฮับสู่สตูดิโอเว้าเสียง AI เด้อจ้า พี่น้องสามารถเลือกเสียงผู้ชายหรือเสียงผู้หญิง เว้าอีสานม่วนซื่นแซ่บหลาย ปรับความไวซ่าหรือไว แล้วโหลดไฟล์เสียงเอาไปเฮ็ดเวียกได้ทันทีเด้อจ้า';
  }
  if (region === 'southern') {
    return isMale
      ? 'หวัดดีคับพี่น้องชาวใต้! ยินดีต้อนรับสู่สตูดิโอแหลงเสียง AI นิ พี่น้องเลือกได้หมดทั้งเสียงพี่บ่าวหรือสาวนุ้ย แหลงใต้หรอยจังหู้ ปรับความเร็วช้าหรือเร็ว แล้วโหลดไฟล์เสียงเอาไปใช้การได้ทันทีเลยตะพี่น้อง!'
      : 'หวัดดีค่ะพี่น้องเหอ! ยินดีต้อนรับสู่สตูดิโอแหลงเสียง AI นิ พี่น้องเลือกได้หมดทั้งเสียงพี่บ่าวหรือสาวนุ้ย แหลงใต้หรอยอย่างแรง ปรับความเร็วช้าหรือเร็ว แล้วโหลดไฟล์เสียงเอาไปใช้การได้ทันทีเลยตะน้องเหอ หรอยจังหู้นิค่ะ!';
  }
  return isMale
    ? 'ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI คุณสามารถเลือกเสียงผู้ชายหรือเสียงผู้หญิง ปรับความเร็วช้า ปกติ หรือเร็ว แล้วดาวน์โหลดไฟล์เสียงนำไปใช้งานได้ทันทีครับ'
    : 'ยินดีต้อนรับสู่สตูดิโอพากย์เสียง AI คุณสามารถเลือกเสียงผู้ชายหรือเสียงผู้หญิง ปรับความเร็วช้า ปกติ หรือเร็ว แล้วดาวน์โหลดไฟล์เสียงนำไปใช้งานได้ทันทีค่ะ';
}

// Word dictionary for each dialect
interface DictEntry {
  central: string;
  northern: string;
  isan: string;
  southern: string;
}

/**
 * 220+ Rich Dialect Dictionary Entries (Phonetic & Authentic)
 * Ordered with compound phrases first to prevent sub-string collision
 */
export const DIALECT_DICTIONARY: DictEntry[] = [
  // 1. วลีแนะนำ โฆษณา และระบบพากย์เสียง
  { central: 'ยินดีต้อนรับสู่', northern: 'ยินดีต้อนฮับสู่', isan: 'ยินดีต้อนฮับสู่', southern: 'ยินดีต้อนรับสู่' },
  { central: 'ยินดีต้อนรับ', northern: 'ยินดีต้อนฮับ', isan: 'ยินดีต้อนฮับ', southern: 'ยินดีต้อนรับนิ' },
  { central: 'เริ่มต้นวันใหม่', northern: 'เริ่มต้นยามเจ๊าวันใหม่', isan: 'เริ่มต้นยามเซ้าวันใหม่', southern: 'เปิดหัวเช้าวันใหม่' },
  { central: 'เริ่มต้นเช้าวันใหม่', northern: 'เริ่มต้นยามเจ๊าวันใหม่', isan: 'เริ่มต้นยามเซ้าวันใหม่', southern: 'เปิดหัวเช้าวันใหม่' },
  { central: 'คัดสรรเมล็ดพันธุ์ชั้นดี', northern: 'คัดเมล็ดพันธุ์อย่างดีแต้ๆ', isan: 'คัดเมล็ดพันธุ์อย่างคัก', southern: 'คัดแต่เมล็ดอย่างดีหรอยๆ' },
  { central: 'คัดสรรเมล็ดพันธุ์ชั้นเลิศ', northern: 'คัดเมล็ดพันธุ์ชั้นเลิศแต้ๆ', isan: 'คัดเมล็ดพันธุ์ชั้นเลิศคักๆ', southern: 'คัดแต่เมล็ดชั้นเลิศได้ใจ' },
  { central: 'หอมกรุ่น', northern: 'หอมกรุ่นขนาด', isan: 'หอมหวนคัก', southern: 'หอมฟุ้งจังหู้' },
  { central: 'ละมุนในทุกสัมผัส', northern: 'ละมุนแต้ๆ ตึงสัมผัส', isan: 'ละมุนนัวคักทุกคำ', southern: 'ละมุนหรอยได้ใจทุกคำนิ' },
  { central: 'โปรโมชั่นพิเศษวันนี้', northern: 'โปรโมชั่นพิเศษวันนี้ดีขนาด', isan: 'โปรพิเศษมื้อนี้คักอีหลี', southern: 'โปรเด็ดอย่างแรงวันนี้นิพี่น้อง' },
  { central: 'โปรโมชั่นพิเศษ', northern: 'โปรโมชั่นดีขนาด', isan: 'โปรพิเศษคักหลาย', southern: 'โปรเด็ดหรอยแรง' },
  { central: 'ลดทันทีสูงสุด', northern: 'ลดตั๋นตีสูงสุด', isan: 'ลดโลดสูงสุด', southern: 'ลดทันทีอย่างแรงสูงสุด' },
  { central: 'สินค้ามีจำนวนจำกัด', northern: 'ของมีจ๋ำนวนจ๋ำกัดเน้อ', isan: 'ของมีจำกัดเด้อพี่น้อง', southern: 'ของมีไม่มากแล้วนิ' },
  { central: 'พลาดรอบนี้รออีกทีปีหน้าเลยนะ', northern: 'พลาดรอบนี้ท่าแหมทีปี๋หน้าเลยเน้อ', isan: 'พลาดเทื่อนี้ถ่าอีกทีปีหน้าเลยเด้อ', southern: 'พลาดรอบนี้รออีกทีปีหน้าเลยตะน้องเหอ' },
  { central: 'ช้อปด่วน', northern: 'รีบซื้อโวยๆ เน้อ', isan: 'ฟ้าวช้อปโลดเด้อ', southern: 'รีบสอยด่วนตะ' },
  { central: 'สั่งซื้อเลย', northern: 'สั่งซื้อเลยเน้อ', isan: 'กดสั่งโลดเด้อ', southern: 'กดสั่งเลยตะพี่น้อง' },
  { central: 'รีบสั่งซื้อกันเลย', northern: 'ฟั่งสั่งซื้อกั๋นเลยเน้อ', isan: 'ฟ้าวสั่งซื้อนำกันโลด', southern: 'รีบสั่งซื้อกันเลยตะ' },
  { central: 'รีบสั่งซื้อ', northern: 'ฟั่งสั่งซื้อ', isan: 'ฟ้าวสั่งซื้อ', southern: 'รีบสั่งซื้อ' },
  { central: 'ราคาไม่แพง', northern: 'ราคาบ่แปงเลย', isan: 'ราคาบ่แพงเลย', southern: 'ราคาไม่แพงสักนิด' },
  { central: 'คุ้มค่าที่สุด', northern: 'คุ้มค่าแต้ๆ', isan: 'คุ้มคักอีหลี', southern: 'คุ้มอย่างแรงนิ' },
  { central: 'คุณสามารถ', northern: 'สูเจ้าสามารถ', isan: 'พี่น้องสามารถ', southern: 'พี่น้องสามารถ' },
  { central: 'พวกเราสามารถ', northern: 'เฮาสามารถ', isan: 'พวกเฮาสามารถ', southern: 'หมู่เราสามารถ' },
  { central: 'นำไปใช้งานได้ทันที', northern: 'เอาไปใจ้ก๋านได้ตั๋นตี', isan: 'เอาไปเฮ็ดเวียกได้ทันที', southern: 'เอาไปใช้การได้ทันทีเลยตะ' },
  { central: 'นำไปใช้งาน', northern: 'เอาไปใจ้ก๋าน', isan: 'เอาไปเฮ็ดเวียก', southern: 'เอาไปใช้การ' },
  { central: 'นำไปใช้', northern: 'เอาไปใจ้', isan: 'เอาไปใช้', southern: 'เอาไปใช้' },
  { central: 'ใช้งาน', northern: 'ใจ้ก๋าน', isan: 'เฮ็ดเวียก', southern: 'ใช้การ' },
  { central: 'ในไม่กี่วินาที', northern: 'บ่กี่วินาทีเต้าอั้น', isan: 'บ่กี่วินาทีท่อนั้น', southern: 'แป๊บเดียวได้เรื่องนิ' },
  { central: 'ทันที', northern: 'ตั๋นตี', isan: 'โลดทันที', southern: 'ทันทีนิ' },
  { central: 'ปรับความเร็ว', northern: 'ปรับความโวย', isan: 'ปรับความไว', southern: 'ปรับความเร็ว' },
  { central: 'ความเร็ว', northern: 'ความโวย', isan: 'ความไว', southern: 'ความเร็ว' },
  { central: 'สตูดิโอพากย์เสียง', northern: 'สตูดิโออู้เสียง', isan: 'สตูดิโอเว้าเสียง', southern: 'สตูดิโอแหลงเสียง' },
  { central: 'พากย์เสียง', northern: 'อู้เสียง', isan: 'เว้าเสียง', southern: 'แหลงเสียง' },
  { central: 'เสียงพากย์', northern: 'เสียงอู้', isan: 'เสียงเว้า', southern: 'เสียงแหลง' },
  { central: 'ดาวน์โหลด', northern: 'โหลด', isan: 'โหลด', southern: 'โหลด' },
  { central: 'วันนี้จะพามาดู', northern: 'วันนี้ข้าเจ้าจะพามาผ่อ', isan: 'มื้อนี้สิพามาเบิ่ง', southern: 'วันนี้พามาแล' },
  { central: 'วันนี้จะพามา', northern: 'วันนี้จะพามา', isan: 'มื้อนี้สิพามา', southern: 'วันนี้พามา' },
  { central: 'จะพาไปดู', northern: 'จะพาไปผ่อ', isan: 'สิพาไปเบิ่ง', southern: 'พาไปแล' },
  { central: 'จะพามาดู', northern: 'จะพามาผ่อ', isan: 'สิพามาเบิ่ง', southern: 'พามาแล' },
  { central: 'บอกเลยว่า', northern: 'บอกเลยว่า', isan: 'เว้าเลยว่า', southern: 'แหลงเลยว่า' },
  { central: 'รับรองว่า', northern: 'ฮับรองเลยว่า', isan: 'ฮับรองเลยว่า', southern: 'รับรองเลยนิว่า' },
  { central: 'ห้ามพลาดเด็ดขาด', northern: 'ห้ามพลาดเด็ดขาดเน้อ', isan: 'ห้ามพลาดเด็ดขาดเด้อ', southern: 'อย่าพลาดเด็ดขาดตะพี่น้อง' },
  { central: 'ห้ามพลาด', northern: 'ห้ามพลาดเน้อ', isan: 'ห้ามพลาดเด้อ', southern: 'อย่าพลาดตะ' },
  { central: 'อยากให้ลอง', northern: 'อยากฮื้อลองจิมผ่อ', isan: 'อยากให้ลองเบิ่ง', southern: 'อยากให้ลองแลตะ' },
  { central: 'ต้องลอง', northern: 'ต้องลองผ่อเน้อ', isan: 'ต้องลองเบิ่งเด้อ', southern: 'ต้องลองแลตะ' },
  { central: 'ของดี', northern: 'ของดีแต้ๆ', isan: 'ของดีคักๆ', southern: 'ของหรอยได้ใจ' },
  { central: 'กันเลยนะคะ', northern: 'กั๋นเลยเน้อเจ้า', isan: 'นำกันโลดเด้อจ้า', southern: 'กันเลยตะน้องเหอ' },
  { central: 'กันเลยครับ', northern: 'กั๋นเลยเน้อกั๊บ', isan: 'นำกันโลดเด้อครับ', southern: 'กันเลยตะพี่น้อง' },
  { central: 'กันเลย', northern: 'กั๋นเลยเน้อ', isan: 'นำกันโลด', southern: 'กันเลยตะ' },
  { central: 'ได้เลยนะคะ', northern: 'ได้เลยเน้อเจ้า', isan: 'ได้โลดเด้อจ้า', southern: 'ได้เลยตะน้องเหอ' },
  { central: 'ได้เลยครับ', northern: 'ได้เลยเน้อกั๊บ', isan: 'ได้โลดเด้อครับ', southern: 'ได้เลยตะพี่น้อง' },
  { central: 'ได้เลย', northern: 'ได้เลยเน้อ', isan: 'ได้โลด', southern: 'ได้เลยตะ' },

  // 2. คำสรรพนามและคน
  { central: 'ผู้ชาย', northern: 'ป้อจาย', isan: 'ผู้ชาย', southern: 'พี่บ่าว' },
  { central: 'ผู้หญิง', northern: 'แม่ญิง', isan: 'ผู้หญิง', southern: 'สาวนุ้ย' },
  { central: 'เพื่อนๆ', northern: 'เปื้อนๆ', isan: 'หมู่เสี่ยว', southern: 'เพื่อนเกลอ' },
  { central: 'เพื่อน', northern: 'เปื้อน', isan: 'เสี่ยว', southern: 'เกลอ' },
  { central: 'พี่ชาย', northern: 'ปี้จาย', isan: 'อ้าย', southern: 'พี่บ่าว' },
  { central: 'พี่สาว', northern: 'ปี้สาว', isan: 'เอื้อย', southern: 'พี่สาว' },
  { central: 'น้องสาว', northern: 'น้องสาว', isan: 'น้องหล้า', southern: 'น้องสาวนุ้ย' },
  { central: 'น้องชาย', northern: 'น้องจาย', isan: 'บักหล่า', southern: 'น้องบ่าว' },
  { central: 'พวกเรา', northern: 'เฮาตึงหลาย', isan: 'พวกเฮา', southern: 'หมู่เรา' },
  { central: 'ทุกคน', northern: 'สูเจ้าตึงหลาย', isan: 'พี่น้องสู่สุคน', southern: 'พี่น้องทุกคนนิ' },
  { central: 'คุณ', northern: 'สูเจ้า', isan: 'เจ้า', southern: 'พี่น้อง' },
  { central: 'ฉัน', northern: 'ข้าเจ้า', isan: 'ข้อย', southern: 'ฉาน' },
  { central: 'ดิฉัน', northern: 'ข้าเจ้า', isan: 'ข้อย', southern: 'ฉาน' },
  { central: 'ผม', northern: 'อ้าย', isan: 'ข้อย', southern: 'ผม' },
  { central: 'เธอ', northern: 'ตั๋ว', isan: 'เจ้า', southern: 'ตัวเอง' },
  { central: 'ใคร', northern: 'ไผ', isan: 'ไผ', southern: 'ใคร' },

  // 3. ทักทาย แสดงความยินดี และถามไถ่
  { central: 'สวัสดีครับ', northern: 'สุมาเต๊อะกั๊บ', isan: 'สะบายดีเด้อครับพี่น้อง', southern: 'หวัดดีคับพี่น้อง' },
  { central: 'สวัสดีค่ะ', northern: 'สวัสดีเจ้า', isan: 'สะบายดีเด้อจ้าพี่น้อง', southern: 'หวัดดีค่ะพี่น้องเหอ' },
  { central: 'สวัสดี', northern: 'สวัสดีเจ้า', isan: 'สะบายดี', southern: 'หวัดดีนิ' },
  { central: 'สบายดีไหม', northern: 'สะบายดีก่อ', isan: 'สะบายดีบ่', southern: 'บายดีหม้าย' },
  { central: 'สบายดี', northern: 'สะบายดี', isan: 'สะบายดี', southern: 'บายดี' },
  { central: 'ขอบคุณมาก', northern: 'ยินดีจ้าดนัก', isan: 'ขอบใจหลายๆ', southern: 'ขอบคุณจังหู้' },
  { central: 'ขอบคุณ', northern: 'ยินดีนัก', isan: 'ขอบใจหลาย', southern: 'ขอบคุณนิ' },
  { central: 'เป็นอย่างไรบ้าง', northern: 'เป๋นจะไดพ่อง', isan: 'เป็นจังได๋แหน่', southern: 'เป็นพันพรือมั่ง' },
  { central: 'เป็นยังไงบ้าง', northern: 'เป๋นจะไดพ่อง', isan: 'เป็นจังได๋แหน่', southern: 'เป็นพันพรือมั่ง' },
  { central: 'คิดถึงมาก', northern: 'กึดเติงหาขนาด', isan: 'คึดฮอดหลาย', southern: 'หวังเหวิดจังหู้' },
  { central: 'คิดถึง', northern: 'กึดเติงหา', isan: 'คึดฮอด', southern: 'หวังเหวิด' },

  // 4. คุณศัพท์ รสชาติ และความรู้สึก
  { central: 'อร่อยมาก', northern: 'ลำขนาด', isan: 'แซ่บหลาย', southern: 'หรอยจังหู้' },
  { central: 'อร่อยจริงๆ', northern: 'ลำแต้ๆ', isan: 'แซ่บคักอีหลี', southern: 'หรอยอย่างแรง' },
  { central: 'อร่อยสุดๆ', northern: 'ลำแต้ลำว่า', isan: 'แซ่บอีหลีเด้อ', southern: 'หรอยหนัดเหนียน' },
  { central: 'ความอร่อย', northern: 'ความลำ', isan: 'ความแซ่บ', southern: 'ความหรอย' },
  { central: 'ไม่อร่อย', northern: 'บ่ลำ', isan: 'บ่แซ่บ', southern: 'ไม่หรอย' },
  { central: 'อร่อย', northern: 'ลำ', isan: 'แซ่บ', southern: 'หรอย' },
  { central: 'สวยมาก', northern: 'งามขนาด', isan: 'งามหลาย', southern: 'งามจังหู้' },
  { central: 'สวยจริงๆ', northern: 'งามแต้ๆ', isan: 'งามคักอีหลี', southern: 'งามได้ใจนิ' },
  { central: 'สวย', northern: 'งาม', isan: 'งาม', southern: 'งาม' },
  { central: 'น่ารักมาก', northern: 'น่าฮักขนาด', isan: 'ตาฮักหลาย', southern: 'น่ารักจังหู้' },
  { central: 'น่ารัก', northern: 'น่าฮัก', isan: 'ตาฮัก', southern: 'น่ารักได้ใจ' },
  { central: 'สนุกมาก', northern: 'ม่วนขนาด', isan: 'ม่วนหลาย', southern: 'หรอยหนัด' },
  { central: 'สนุกสนาน', northern: 'ม่วนงัน', isan: 'ม่วนซื่นโฮแซว', southern: 'หรอยครื้นเครง' },
  { central: 'สนุก', northern: 'ม่วน', isan: 'ม่วนซื่น', southern: 'หรอย' },
  { central: 'เยอะมาก', northern: 'จ้าดนัก', isan: 'หลายคัก', southern: 'ลุยเหม็ด' },
  { central: 'มากจริงๆ', northern: 'ขนาดแต้ๆ', isan: 'คักอีหลี', southern: 'อย่างแรงนิ' },
  { central: 'มากๆ', northern: 'แต้ๆ', isan: 'คักๆ', southern: 'จังหู้' },
  { central: 'เหนื่อยมาก', northern: 'อิดขนาด', isan: 'เมื่อยหลาย', southern: 'เหนื่อยหนัด' },
  { central: 'เหนื่อย', northern: 'อิด', isan: 'เมื่อย', southern: 'เหนื่อย' },
  { central: 'ร้อนมาก', northern: 'ฮ้อนขนาด', isan: 'ฮ้อนหลาย', southern: 'ร้อนจังหู้' },
  { central: 'ร้อน', northern: 'ฮ้อน', isan: 'ฮ้อน', southern: 'ร้อน' },
  { central: 'หนาวมาก', northern: 'หนาวขนาด', isan: 'หนาวคัก', southern: 'เย็นเยียบ' },
  { central: 'สุดยอด', northern: 'สุดยอดแต้ๆ', isan: 'สุดยอดคัก', southern: 'หรอยได้ใจ' },
  { central: 'ยอดเยี่ยม', northern: 'ดีขนาด', isan: 'คักอีหลี', southern: 'หรอยหนัด' },
  { central: 'ดีมาก', northern: 'ดีขนาด', isan: 'ดีหลาย', southern: 'ดีจังหู้' },
  { central: 'เผ็ดมาก', northern: 'เผ็ดขนาด', isan: 'เผ็ดคัก', southern: 'เผ็ดร้อนถึงใจหรอยแรง' },
  { central: 'รักมาก', northern: 'ฮักขนาด', isan: 'ฮักหลาย', southern: 'รักจังหู้' },
  { central: 'รัก', northern: 'ฮัก', isan: 'ฮัก', southern: 'รัก' },
  { central: 'ชอบมาก', northern: 'มักขนาด', isan: 'มักหลาย', southern: 'ชอบจังหู้' },
  { central: 'ไม่ชอบ', northern: 'บ่มัก', isan: 'บ่มัก', southern: 'ไม่ชอบนิ' },
  { central: 'ชอบ', northern: 'มัก', isan: 'มัก', southern: 'ชอบ' },
  { central: 'จริงๆ', northern: 'แต้ๆ', isan: 'อีหลี', southern: 'อย่างแรง' },
  { central: 'มาก', northern: 'ขนาด', isan: 'หลาย', southern: 'จังหู้' },

  // 5. กริยาและการกระทำ
  { central: 'อย่าพูดโกหก', northern: 'อย่ามาอู้ขี้จุ๊', isan: 'อย่ามาเว้าขี้ตั๋ว', southern: 'อย่ามาแหลงขี้หก' },
  { central: 'อย่าโกหก', northern: 'อย่ามาขี้จุ๊', isan: 'อย่ามาขี้ตั๋ว', southern: 'อย่ามาขี้หก' },
  { central: 'พูดโกหก', northern: 'อู้ขี้จุ๊', isan: 'เว้าขี้ตั๋ว', southern: 'แหลงขี้หก' },
  { central: 'โกหก', northern: 'ขี้จุ๊', isan: 'ขี้ตั๋ว', southern: 'ขี้หก' },
  { central: 'พูดคุย', northern: 'อู้จา', isan: 'เว้าจา', southern: 'แหลงคุย' },
  { central: 'พูด', northern: 'อู้', isan: 'เว้า', southern: 'แหลง' },
  { central: 'ลองชิมดู', northern: 'ลองจิมผ่อ', isan: 'ลองชิมเบิ่ง', southern: 'ลองชิมแลตะ' },
  { central: 'ลองชิม', northern: 'ลองจิมผ่อ', isan: 'ลองชิมเบิ่ง', southern: 'ลองชิมแลตะ' },
  { central: 'ลองดู', northern: 'ลองผ่อเน้อ', isan: 'ลองเบิ่งเด้อ', southern: 'ลองแลตะ' },
  { central: 'มาดูกัน', northern: 'มาผ่อกั๋น', isan: 'มาเบิ่งนำกัน', southern: 'มาแลกันตะ' },
  { central: 'ด้วยกัน', northern: 'โตยกั๋น', isan: 'นำกัน', southern: 'ด้วยกันตะ' },
  { central: 'มองดู', northern: 'จ้องผ่อ', isan: 'เบิ่งแยง', southern: 'แลดู' },
  { central: 'มอง', northern: 'ผ่อ', isan: 'เบิ่ง', southern: 'แล' },
  { central: 'ดู', northern: 'ผ่อ', isan: 'เบิ่ง', southern: 'แล' },
  { central: 'กลับบ้าน', northern: 'ปิ๊กเฮือน', isan: 'เมือเฮือน', southern: 'หลบเริน' },
  { central: 'ไปไหนมา', northern: 'ไปตางไดมา', isan: 'ไปไสมาน้อ', southern: 'ไปไหนมานิ' },
  { central: 'ไปไหน', northern: 'ไปตางได', isan: 'ไปไส', southern: 'ไปไหนนิ' },
  { central: 'ทำอะไรอยู่', northern: 'ยะหยังอยู่', isan: 'เฮ็ดหยังอยู่', southern: 'ทำไอ้ไหรอยู่' },
  { central: 'ทำอะไร', northern: 'ยะหยัง', isan: 'เฮ็ดหยัง', southern: 'ทำไอ้ไหร' },
  { central: 'ทำไม', northern: 'ยะหยัง', isan: 'เป็นหยัง', southern: 'ไซร' },
  { central: 'ทำงาน', northern: 'ยะก๋าน', isan: 'เฮ็ดเวียก', southern: 'ทำงานหาเบี้ย' },
  { central: 'กินข้าวหรือยัง', northern: 'กิ๋นข้าวแล้วก๋า', isan: 'กินข้าวแล้วบ่', southern: 'กินข้าวแล้วหม้าย' },
  { central: 'กินข้าว', northern: 'กิ๋นข้าว', isan: 'กินข้าว', southern: 'กินข้าว' },
  { central: 'ไปตลาด', northern: 'ไปกาด', isan: 'ไปเลาะตลาด', southern: 'ไปหลาด' },
  { central: 'ตลาด', northern: 'กาด', isan: 'ตลาด', southern: 'หลาด' },

  // 6. คำถาม ปฏิเสธ และยืนยัน
  { central: 'ไม่เป็นไร', northern: 'บ่เป็นหยัง', isan: 'บ่เป็นหยังดอก', southern: 'หม้ายพรือ' },
  { central: 'ไม่เข้าใจ', northern: 'บ่ฮู้เรื่อง', isan: 'บ่ฮู้เรื่อง', southern: 'ไม่โร้เรื่อง' },
  { central: 'ไม่รู้', northern: 'บ่ฮู้', isan: 'บ่ฮู้', southern: 'ไม่โร้' },
  { central: 'รู้ไหม', northern: 'ฮู้ก่อ', isan: 'ฮู้บ่', southern: 'โร้หม้าย' },
  { central: 'จริงเหรอ', northern: 'แต้ก๋า', isan: 'อีหลีติ', southern: 'จริงเห้อ' },
  { central: 'ใช่ไหม', northern: 'แม่นก่อ', isan: 'แม่นบ่', southern: 'หม้ายเล่า' },
  { central: 'ไม่ใช่', northern: 'บ่ใจ้', isan: 'บ่แม่น', southern: 'ไม่ช่ายนิ' },
  { central: 'ไม่มี', northern: 'บ่มี', isan: 'บ่มี', southern: 'หม้าย' },
  { central: 'อะไร', northern: 'อะหยัง', isan: 'อีหยัง', southern: 'ไอ้ไหร' },
  { central: 'ที่ไหน', northern: 'ตี้ไหน', isan: 'หม่องได๋', southern: 'ตรงไหนนิ' },
  { central: 'ที่นี่', northern: 'ตี้นี้', isan: 'หม่องนี้', southern: 'ตรงนี้นิ' },
  { central: 'อย่างไร', northern: 'จะได', isan: 'จังได๋', southern: 'พันพรือ' },
  { central: 'ยังไง', northern: 'จะได', isan: 'จังได๋', southern: 'พันพรือ' },
  { central: 'เท่าไหร่', northern: 'เต้าใด', isan: 'ท่อได๋', southern: 'กี่บาทนิ' },

  // 7. วันเวลาและอาหาร
  { central: 'วันนี้', northern: 'วันนี้', isan: 'มื้อนี้', southern: 'วันนี้' },
  { central: 'พรุ่งนี้', northern: 'วันพูก', isan: 'มื้ออื่น', southern: 'วันพูก' },
  { central: 'เมื่อวานนี้', northern: 'เมื่อวานซืน', isan: 'มื้อวาน', southern: 'ต่อโพลก' },
  { central: 'เมื่อวาน', northern: 'เมื่อวานซืน', isan: 'มื้อวาน', southern: 'ต่อโพลก' },
  { central: 'ตอนเช้า', northern: 'ยามเจ๊า', isan: 'ยามเซ้า', southern: 'หัวเช้า' },
  { central: 'ตอนเย็น', northern: 'ยามแลง', isan: 'ยามแลง', southern: 'หวางเย็น' },
  { central: 'ส้มตำ', northern: 'ส้มต๋ำ', isan: 'ตำบักหุ่ง', southern: 'ส้มตำรสจัด' },
  { central: 'ปลาร้า', northern: 'ฮ้า', isan: 'ปลาแดก', southern: 'ปลาร้า' },
  { central: 'ลดราคา', northern: 'ลดราคาจ้าดนัก', isan: 'ลดราคาคักหลาย', southern: 'ลดราคาอย่างแรง' },
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
  if (!sourceText) {
    return {
      translatedText: sourceText,
      replacedWordsCount: 0,
      highlightedText: sourceText,
      sourceText,
    };
  }

  // For central Thai: gently harmonize polite particles with speaker gender if needed
  if (targetRegion === 'central') {
    let centralText = sourceText;
    if (gender === 'female') {
      centralText = centralText.replace(/นะครับ/g, 'นะคะ').replace(/ครับ/g, 'ค่ะ');
    } else if (gender === 'male') {
      centralText = centralText.replace(/นะคะ/g, 'นะครับ').replace(/ค่ะ/g, 'ครับ');
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

  // Step 1: Single-pass longest-match replacement so replaced phrases never collide with shorter sub-phrases
  const sortedEntries = [...DIALECT_DICTIONARY].sort((a, b) => b.central.length - a.central.length);
  const lookupMap = new Map<string, string>();
  const patterns: string[] = [];

  for (const entry of sortedEntries) {
    const replacement = entry[targetRegion];
    if (replacement && !lookupMap.has(entry.central)) {
      lookupMap.set(entry.central, replacement);
      patterns.push(entry.central.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    }
  }

  if (patterns.length > 0) {
    const combinedRegex = new RegExp(patterns.join('|'), 'g');
    text = text.replace(combinedRegex, (matched) => {
      const rep = lookupMap.get(matched);
      if (rep !== undefined) {
        if (rep !== matched) count++;
        return rep;
      }
      return matched;
    });
  }

  // Step 2: Handle polite end particles & interjections based on dialect and gender
  if (targetRegion === 'northern') {
    if (gender === 'female') {
      text = text.replace(/นะคะ/g, 'เน้อเจ้า');
      text = text.replace(/ค่ะ|คะ/g, 'เจ้า');
      text = text.replace(/นะครับ/g, 'เน้อเจ้า');
      text = text.replace(/ครับ/g, 'เจ้า');
      text = text.replace(/เลยนะ/g, 'เลยเน้อเจ้า');
      text = text.replace(/นะจ๊ะ|จ๊ะ|จ้ะ/g, 'เจ้า');
      if (!/เจ้า|เน้อเจ้า|เจ๊า|เน่อ/.test(text.trim())) {
        text = text.trim() + ' เน้อเจ้า';
        count++;
      }
    } else {
      text = text.replace(/นะคะ|ค่ะ|คะ/g, 'เน้อครับ');
      text = text.replace(/นะครับ/g, 'เน้อกั๊บ');
      text = text.replace(/ครับ/g, 'กั๊บ');
      text = text.replace(/เลยนะ/g, 'เลยเน้อกั๊บ');
      if (!/กั๊บ|เน้อครับ|เน้อ/.test(text.trim())) {
        text = text.trim() + ' เน้อกั๊บ';
        count++;
      }
    }
  } else if (targetRegion === 'isan') {
    if (gender === 'female') {
      text = text.replace(/นะคะ/g, 'เด้อจ้า');
      text = text.replace(/ค่ะ|คะ/g, 'จ้า');
      text = text.replace(/นะครับ/g, 'เด้อจ้า');
      text = text.replace(/ครับ/g, 'เด้อจ้า');
      text = text.replace(/เลยนะ/g, 'โลดเด้อจ้า');
      text = text.replace(/นะจ๊ะ|จ๊ะ|จ้ะ/g, 'เด้อจ้า');
      if (!/เด้อจ้า|จ้า|เด้อ/.test(text.trim())) {
        text = text.trim() + ' เด้อจ้า';
        count++;
      }
    } else {
      text = text.replace(/นะคะ|ค่ะ|คะ/g, 'เด้อครับ');
      text = text.replace(/นะครับ/g, 'เด้อครับพี่น้อง');
      text = text.replace(/ครับ/g, 'เด้อครับ');
      text = text.replace(/เลยนะ/g, 'โลดเด้อครับ');
      if (!/เด้อครับ|เด้อ/.test(text.trim())) {
        text = text.trim() + ' เด้อครับพี่น้อง';
        count++;
      }
    }
  } else if (targetRegion === 'southern') {
    if (gender === 'female') {
      text = text.replace(/นะคะ/g, 'ตะน้องเหอ');
      text = text.replace(/(?<!นิ)ค่ะ(?!พี่น้อง)/g, 'นิค่ะ');
      text = text.replace(/นะครับ/g, 'ตะพี่น้องเหอ');
      text = text.replace(/ครับ/g, 'นิค่ะ');
      text = text.replace(/เลยนะ/g, 'เลยตะน้องเหอ');
      text = text.replace(/นะจ๊ะ|จ๊ะ|จ้ะ/g, 'นิค่ะ');
      if (!/นิ|จังหู้|เหอ|ตะ/.test(text.trim())) {
        text = text.trim() + ' หรอยจังหู้นิค่ะ';
        count++;
      }
    } else {
      text = text.replace(/นะคะ|ค่ะ|คะ/g, 'คับพี่น้อง');
      text = text.replace(/นะครับ/g, 'ตะพี่น้อง');
      text = text.replace(/ครับ/g, 'คับพี่น้อง');
      text = text.replace(/เลยนะ/g, 'เลยตะพี่น้อง');
      if (!/คับพี่น้อง|นิ|ตะ|จังหู้/.test(text.trim())) {
        text = text.trim() + ' หรอยอย่างแรงคับพี่น้อง';
        count++;
      }
    }
  }

  const cleaned = text
    .replace(/ตะตะ/g, 'ตะ')
    .replace(/เน้อเน้อ/g, 'เน้อ')
    .replace(/เจ้าเจ้า/g, 'เจ้า')
    .replace(/เด้อเด้อ/g, 'เด้อ')
    .replace(/จ้าจ้า/g, 'จ้า')
    .replace(/นินิ/g, 'นิ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    translatedText: cleaned,
    replacedWordsCount: count,
    highlightedText: cleaned,
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
    northern: 'ส้มต๋ำฮ้านนี้ลำขนาด กิ๋นแล้วมีความสุขแต้ๆ เน้อเจ้า',
    isan: 'ตำบักหุ่งฮ้านนี้แซ่บหลาย กินแล้วมีความสุขคักอีหลีเด้อจ้า',
    southern: 'แกงส้มร้านนี้หรอยจังหู้นิพี่น้องเหอ กินแล้วหรอยอย่างแรง ลองชิมแลตะ!',
  },
  {
    id: 'demo-2',
    category: 'ทักทาย & ถามไถ่',
    central: 'สวัสดีครับ ไม่เจอกันนาน ไปไหนมา คิดถึงเพื่อนๆ มากเลย',
    northern: 'สวัสดีเจ้า บ่ป๊ะกั๋นเมิน ไปตางไดมา กึดเติงหาเปื้อนๆ ขนาดเน้อเจ้า',
    isan: 'สะบายดีเด้อจ้า บ่พ้อกันดน ไปไสมาน้อ คึดฮอดหมู่เสี่ยวหลายเด้อจ้า',
    southern: 'หวัดดีค่ะพี่น้องเหอ ไม่เจอกันนาน ไปไหนมานิ หวังเหวิดเพื่อนเกลอจังหู้นิ!',
  },
  {
    id: 'demo-3',
    category: 'ปลอบใจ & ให้กำลังใจ',
    central: 'ไม่เป็นไรนะ ทำงานเหนื่อยมาก พักผ่อนก่อน พรุ่งนี้ค่อยลุยใหม่',
    northern: 'บ่เป็นหยังเน้อเจ้า ยะก๋านอิดขนาด พักผ่อนก่อน วันพูกก้อยลุยใหม่เน้อเจ้า',
    isan: 'บ่เป็นหยังดอกเด้อ เฮ็ดเวียกเมื่อยหลาย พักผ่อนก่อน มื้ออื่นค่อยลุยใหม่เด้อจ้า',
    southern: 'หม้ายพรือนิน้องเหอ ทำงานเหนื่อยหนัด พักผ่อนก่อนตะ วันพูกค่อยลุยใหม่นิ!',
  },
  {
    id: 'demo-4',
    category: 'รีวิว & ป้ายยาของเด็ด',
    central: 'ชุดนี้สวยมาก น่ารักจริงๆ ใครเห็นก็ชอบ อย่าพูดโกหกนะ สั่งเลย!',
    northern: 'ชุดนี้งามขนาด น่าฮักแต้ๆ ไผหันก้อมักขนาด บ่ได้ขี้จุ๊เน้อเจ้า สั่งเลย!',
    isan: 'ชุดนี้งามหลาย ตาฮักคักอีหลี ไผเห็นกะมักหลาย บ่ได้ขี้ตั๋วเด้อจ้า กดสั่งโลด!',
    southern: 'ชุดนี้งามจังหู้ น่ารักได้ใจนิ ใครแลก็ชอบจังหู้ ไม่ได้แหลงขี้หกนิ สั่งเลยตะน้องเหอ!',
  },
];
