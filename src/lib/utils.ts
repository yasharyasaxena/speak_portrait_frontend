import { TTSOptions, ttsStatus, videoStatus } from "@/types/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { User } from "firebase/auth";
import {
  handleCopyToKey,
  handleDeleteFromKey,
  handleProjectComplete,
} from "./api";

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

export const getVideoStatusIcon = (videoStatus: videoStatus) => {
  switch (videoStatus) {
    case "processing":
    case "generating":
      return "🎬";
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

/**
 * Handles the complete video post-processing workflow:
 * 1. Copies the generated video to user-specific S3 location
 * 2. Deletes the temporary video file
 * 3. Marks the project as complete
 *
 * @param user - The authenticated user
 * @param projectId - The project ID
 * @param videoResponse - The video generation response containing the video name
 * @returns The final video URL or throws an error
 */
export const handleVideoPostProcessing = async (
  user: User,
  projectId: string,
  videoResponse: { name: string }
) => {
  try {
    // Copy video to user-specific location
    const copyResponse = await handleCopyToKey(
      user,
      videoResponse.name,
      `${user.uid}/${projectId}/video/${videoResponse.name}`
    );

    // Delete temporary video file
    const deleteResponse = await handleDeleteFromKey(videoResponse.name, user);

    // Construct the final video URL
    const finalVideoUrl = `https://speak-portrait.s3.ap-south-1.amazonaws.com/${user.uid}/${projectId}/video/${videoResponse.name}`;

    console.log("Final video URL:", finalVideoUrl);

    // Mark project as complete
    await handleProjectComplete(
      user,
      projectId,
      finalVideoUrl,
      videoResponse.name
    );

    return finalVideoUrl;
  } catch (error) {
    console.error("Error in video post-processing:", error);
    throw new Error("Failed to complete video post-processing workflow");
  }
};

/**
 * Generates the S3 URL for a video file
 *
 * @param userId - The user ID
 * @param projectId - The project ID
 * @param videoName - The video file name
 * @returns The S3 URL for the video
 */
export const generateVideoS3Url = (
  userId: string,
  projectId: string,
  videoName: string
): string => {
  return `https://speak-portrait.s3.ap-south-1.amazonaws.com/${userId}/${projectId}/video/${videoName}`;
};
