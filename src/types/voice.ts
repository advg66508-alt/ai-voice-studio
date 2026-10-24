export type VoiceName =
  | 'Kore'
  | 'Mira'
  | 'Elena'
  | 'Pimry'
  | 'Pimdao'
  | 'Yada'
  | 'Puck'
  | 'Charon'
  | 'Fenrir'
  | 'Thanwa'
  | 'Kan'
  | 'Akin'
  | 'Zephyr'
  | 'Lanna_Female'
  | 'Lanna_Male'
  | 'Isan_Female'
  | 'Isan_Male'
  | 'Southern_Female'
  | 'Southern_Male';

export type RegionType = 'central' | 'northern' | 'isan' | 'southern';

export type GenderType = 'female' | 'male';

export type SpeedPreset = 'slow' | 'normal' | 'fast';

export type VocalEqProfile = 'warm' | 'bright' | 'deep' | 'crisp' | 'neutral';

export interface StudioCharacter {
  id: VoiceName;
  name: string;
  roleLabel: string;
  region: RegionType;
  gender: GenderType;
  toneSummary: string;
  webSpeechPitch: number;
  webSpeechRate: number;
  fallbackPitch: number;
  fallbackCadence: number;
  eqProfile: VocalEqProfile;
  sampleText: string;
}

export interface VoiceOption {
  id: VoiceName;
  name: string;
  thaiName: string;
  gender: 'female' | 'male' | 'neutral';
  tone: string;
  bestFor: string;
  avatarColor: string;
  avatarEmoji?: string;
  personaDescription?: string;
  sampleAudioPitch?: number;
  region?: RegionType;
  dialectBadge?: string;
}

export interface StylePreset {
  id: string;
  title: string;
  icon: string;
  description: string;
  promptInstruction: string;
  category?: 'female' | 'general';
  badge?: string;
}

export interface SampleScript {
  id: string;
  title: string;
  category: string;
  categoryGroup?: 'commercial' | 'cinema' | 'business' | 'relax' | 'dialogue' | 'dialect';
  text: string;
  recommendedVoice: VoiceName;
  recommendedStyle: string;
  recommendedSpeed: SpeedPreset;
  recommendedAmbient?: 'none' | 'cafe' | 'nature' | 'ocean' | 'lofi' | 'cinematic';
  tags?: string[];
  isMultiSpeaker?: boolean;
  sampleDialogues?: DialogueLine[];
}

export interface GeneratedClip {
  id: string;
  title: string;
  text: string;
  spokenText?: string;
  dialectLabel?: string;
  region?: RegionType;
  gender?: GenderType;
  voiceName: VoiceName;
  speed: SpeedPreset;
  speedRate: number;
  pitchRate?: number;
  style: string;
  audioUrl: string;
  audioBase64?: string;
  createdAt: number;
  duration?: number;
  modelUsed?: string;
  isFallback?: boolean;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  voiceName: VoiceName;
  text: string;
  style?: string;
}
