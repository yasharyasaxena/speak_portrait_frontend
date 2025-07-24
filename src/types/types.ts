export interface TTSOptions {
  text: string;
  speed: number;
  language: string;
  pitch: number;
  emotion: Emotion;
}

export type Emotion = {
  happiness: number;
  sadness: number;
  disgust: number;
  fear: number;
  surprise: number;
  anger: number;
  other: number;
  neutral: number;
};

export type AudioInput = "File" | "TTS" | "Record";

export interface FileUpload {
  file: File;
  userId: string;
  jobId?: string;
}

export type ttsStatus =
  | "processing"
  | "generating"
  | "uploading"
  | "completed"
  | "error"
  | "idle"
  | null;
