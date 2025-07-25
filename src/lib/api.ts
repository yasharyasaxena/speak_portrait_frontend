import { User } from "firebase/auth";
import { TTSOptions } from "@/types/types";

const ngrokUrl = process.env.NEXT_PUBLIC_NGROK_URL;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getActiveProject = async (user: User) => {
  try {
    const response = await fetch(`${API_URL}/projects/active`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch active project", {
        cause: response.statusText,
      });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching active project:", error);
    throw error;
  }
};

export const deleteObjectsInProject = async (
  user: User,
  projectId: string,
  fieldname: "image" | "audio" | "video"
) => {
  try {
    const response = await fetch(`${API_URL}/projects/bucket/${projectId}`, {
      method: "DELETE",
      body: JSON.stringify({ fieldname: fieldname }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to delete objects in project", {
        cause: response.statusText,
      });
    }
    return true;
  } catch (error) {
    console.error("Error deleting objects in project:", error);
    throw error;
  }
};

export const getObjectsInProject = async (user: User, projectId: string) => {
  try {
    const response = await fetch(`${API_URL}/projects/bucket/${projectId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch objects in project", {
        cause: response.statusText,
      });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching objects in project:", error);
    throw error;
  }
};

export const handleSingleUpload = async (
  file: File,
  user: User,
  projectId?: string
) => {
  const formData = new FormData();
  formData.append(file.type.split("/")[0], file);
  if (projectId) {
    formData.append("projectId", projectId);
  }
  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
    });
    if (!response.ok) {
      throw Error("Failed to upload file.", {
        cause: response.statusText,
      });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

export const handleUpload = async (files: File[], user: User) => {
  const formData = new FormData();
  if (files.length !== 3) {
    throw new Error("Please upload all required files.");
  }
  files.forEach((file) => {
    formData.append(file.type.split("/")[0], file);
  });
  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to upload files", {
        cause: response.statusText,
      });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

export const createProject = async (
  user: User,
  projectId: string,
  projectName?: string
) => {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
      body: JSON.stringify({ id: projectId, name: projectName }),
    });
    if (!response.ok) {
      throw new Error("Failed to create project", {
        cause: response.statusText,
      });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const handleOnTTSWebSocket = async ({
  TTSOptions: { text, speed, language, pitch, emotion },
  onStatusUpdate,
}: {
  TTSOptions: TTSOptions;
  onStatusUpdate: (data: any) => void;
}) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://${ngrokUrl}/ws/tts`);
    let isCompleted = false;

    const connectionTimeout = setTimeout(() => {
      if (!isCompleted) {
        ws.close();
        reject(new Error("WebSocket connection timeout"));
      }
    }, 60000); // 60 seconds timeout

    ws.onopen = () => {
      const emotionValues: number[] = Object.values(emotion);
      const request = {
        text: text.toString(),
        speed: Math.floor(speed),
        language: language.toString(),
        pitch: Math.floor(pitch),
        emotion: emotionValues.map((val) => Number(val.toFixed(6))),
      };
      ws.send(JSON.stringify(request));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onStatusUpdate(data);

      if (data.status === "completed") {
        isCompleted = true;
        clearTimeout(connectionTimeout);
        resolve(data);
        setTimeout(() => ws.close(), 1000);
      } else if (data.status === "error") {
        isCompleted = true;
        clearTimeout(connectionTimeout);
        reject(new Error(data.message || "TTS generation failed"));
        ws.close();
      }
    };

    ws.onerror = (error) => {
      isCompleted = true;
      clearTimeout(connectionTimeout);
      reject(new Error("WebSocket connection failed"));
    };

    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      if (!isCompleted && event.code !== 1000) {
        reject(
          new Error(
            `WebSocket connection closed unexpectedly: ${event.code} ${event.reason}`
          )
        );
      }
    };
  });
};
