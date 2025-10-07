export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  parameters: ImageParameters;
  createdAt: Date;
  isActive: boolean;
  views?: MultiViewImages;
}

export interface MultiViewImages {
  front?: string;
  back?: string;
  left?: string;
  right?: string;
  top?: string;
  angled?: string;
}

export interface ReferenceImage {
  id: string;
  url: string;
  name: string;
  isActive: boolean;
  uploadedAt: Date;
}

export interface ImageParameters {
  type: CreatureType;
  style: string;
  description: string;
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3';
}

export type CreatureType = 
  | 'marine-creature'
  | 'winged-snake'
  | 'fantasy-beast'
  | 'abstract-form'
  | 'botanical-form'
  | 'ceramic-model'
  | 'geometric-sculpture'
  | 'organic-vessel'
  | 'custom';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface GenerationRequest {
  prompt: string;
  parameters: ImageParameters;
  referenceImages?: string[];
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}