export type VoiceName =
  | 'Kore'
  | 'Mira'
  | 'Elena'
  | 'Puck'
  | 'Charon'
  | 'Fenrir'
  | 'Zephyr'
  | 'Lanna_Female'
  | 'Lanna_Male'
  | 'Isan_Female'
  | 'Isan_Male'
  | 'Southern_Female'
  | 'Southern_Male';

export type RegionType = 'central' | 'northern' | 'isan' | 'southern';

export type SpeedPreset = 'slow' | 'normal' | 'fast';

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
  voiceName: VoiceName;
  speed: SpeedPreset;
  speedRate: number;
  style: string;
  audioUrl: string;
  audioBase64?: string;
  createdAt: number;
  duration?: number;
  modelUsed?: string;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  voiceName: VoiceName;
  text: string;
  style?: string;
}
