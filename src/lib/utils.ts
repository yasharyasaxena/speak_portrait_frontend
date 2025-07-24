import { TTSOptions, ttsStatus } from "@/types/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileType(file: File): string {
  const fileType = file.type.split("/")[0];
  return fileType;
}

export const defaultTTSOptions: TTSOptions = {
  text: "",
  speed: 15.0,
  language: "en-us",
  pitch: 20.0,
  emotion: {
    happiness: 0.3077,
    sadness: 0.0256,
    disgust: 0.0256,
    fear: 0.0256,
    surprise: 0.0256,
    anger: 0.0256,
    other: 0.2564,
    neutral: 0.3077,
  },
};

export const getTTSStatusIcon = (ttsStatus: ttsStatus) => {
  switch (ttsStatus) {
    case "processing":
    case "generating":
      return "🎤";
    case "uploading":
      return "📤";
    case "completed":
      return "✅";
    case "error":
      return "❌";
    default:
      return "⏳";
  }
};
