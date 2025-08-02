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

export const handleVideoGeneration = async ({
  user,
  projectId,
  imageUrl,
  audioUrl,
}: {
  user: User;
  projectId: string;
  imageUrl: string;
  audioUrl: string;
}) => {
  try {
    const url = new URL("https://42d49aace839.ngrok-free.app/generate-video");
    url.searchParams.append("image_url", imageUrl);
    url.searchParams.append("audio_url", audioUrl);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to generate video", {
        cause: response.statusText,
      });
    }

    const data = await response.json();
    console.log("Video generation response:", data);
    return data;
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
};

export const handleCopyToKey = async (
  user: User,
  sourceKey: string,
  destinationKey: string
) => {
  try {
    const response = await fetch(`${API_URL}/projects/copy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
      body: JSON.stringify({ sourceKey, destinationKey }),
    });
    if (!response.ok) {
      throw new Error("Failed to copy to key", {
        cause: response.statusText,
      });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error copying to key:", error);
    throw error;
  }
};

export const handleDeleteFromKey = async (key: string, user: User) => {
  try {
    const response = await fetch(`${API_URL}/projects/object/${key}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to delete from key", {
        cause: response.statusText,
      });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting from key:", error);
    throw error;
  }
};

export const handleGetVideoUrl = async (user: User, projectId: string) => {
  try {
    const response = await fetch(`${API_URL}/projects/bucket/${projectId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
      body: JSON.stringify({ fieldname: "video" }),
    });
    if (!response.ok) {
      throw new Error("Failed to get video URL", {
        cause: response.statusText,
      });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting video URL:", error);
    throw error;
  }
};

export const handleProjectComplete = async (
  user: User,
  projectId: string,
  video_url: string,
  fileName: string
) => {
  try {
    const response = await fetch(`${API_URL}/projects/${projectId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
      body: JSON.stringify({ video_url, fileName }),
    });
    if (!response.ok) {
      throw new Error("Failed to complete project", {
        cause: response.statusText,
      });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error completing project:", error);
    throw error;
  }
};

export const handleGetCompletedProjects = async (user: User) => {
  try {
    const response = await fetch(`${API_URL}/projects/completed`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch completed projects", {
        cause: response.statusText,
      });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching completed projects:", error);
    throw error;
  }
};

// Test function to check if the age transformation server is accessible
export const testAgeTransformationConnection = async () => {
  try {
    console.log("🔍 Testing age transformation WebSocket endpoint...");

    // Test WebSocket connection directly
    return new Promise((resolve, reject) => {
      const testClientId = `test_${Date.now()}`;
      const testWs = new WebSocket(
        `wss://b922cb9c3588.ngrok-free.app/ws/${testClientId}`
      );

      const timeout = setTimeout(() => {
        testWs.close();
        reject(new Error("WebSocket test connection timeout"));
      }, 10000); // 10 second timeout for test

      testWs.onopen = () => {
        console.log("✅ WebSocket connection test successful");
        clearTimeout(timeout);
        testWs.close();
        resolve(true);
      };

      testWs.onerror = (error) => {
        console.error("❌ WebSocket test failed:", error);
        clearTimeout(timeout);
        reject(new Error("WebSocket endpoint not accessible"));
      };

      testWs.onclose = () => {
        clearTimeout(timeout);
      };
    });
  } catch (error) {
    console.error("❌ WebSocket test failed:", error);
    throw new Error("Age transformation WebSocket server is not accessible");
  }
};

export const handleAgeTransformationWebSocket = async ({
  imageUrl,
  targetAge,
  onStatusUpdate,
}: {
  imageUrl: string;
  targetAge: number;
  onStatusUpdate: (data: any) => void;
}) => {
  return new Promise((resolve, reject) => {
    // Generate a unique client ID for this connection
    const clientId = `client_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const wsUrl = `wss://73a17ed8d43d.ngrok-free.app/ws/${clientId}`;
    console.log("🔗 Attempting to connect to:", wsUrl);

    // Alternative URLs to try if the main one fails
    const alternativeUrls = [
      `ws://73a17ed8d43d.ngrok-free.app/ws/${clientId}`,
      `wss://73a17ed8d43d.ngrok-free.app/ws`,
      `wss://73a17ed8d43d.ngrok-free.app/websocket/${clientId}`,
    ];

    // Connect to plain WebSocket server with client ID
    const ws = new WebSocket(wsUrl);
    let isCompleted = false;

    const connectionTimeout = setTimeout(() => {
      if (!isCompleted) {
        console.log("⏰ Connection timeout after 2 minutes");
        ws.close();
        reject(new Error("Age transformation timeout - please try again"));
      }
    }, 120000); // 2 minutes timeout

    ws.onopen = () => {
      console.log("🤝 Connected to age transformation server");
      console.log("📤 Sending image processing request...");

      // Send the process_image message with the correct format
      const message = {
        type: "process_image",
        data: {
          image_url: imageUrl,
          target_age: targetAge,
        },
      };

      console.log("📋 Sending message:", message);
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const messageType = message.type;
        const messageData = message.data || {};

        console.log("📩 Received message:", message);

        if (messageType === "status") {
          onStatusUpdate({
            status: "processing",
            message: messageData.message || "Processing image...",
          });
        } else if (messageType === "result") {
          console.log("✅ Age transformation completed:", messageData);
          isCompleted = true;
          clearTimeout(connectionTimeout);

          resolve({
            status: "completed",
            finalUrl: messageData.final_url,
          });

          setTimeout(() => ws.close(), 1000);
        } else if (messageType === "error") {
          console.error("❌ Age transformation error:", messageData);
          isCompleted = true;
          clearTimeout(connectionTimeout);
          reject(new Error(messageData.message || "Age transformation failed"));
          ws.close();
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
        isCompleted = true;
        clearTimeout(connectionTimeout);
        reject(new Error("Invalid response from server"));
        ws.close();
      }
    };

    ws.onerror = (error) => {
      console.error("🔥 WebSocket connection error:", error);
      console.error("🔍 Connection details:", {
        url: wsUrl,
        readyState: ws.readyState,
        protocol: ws.protocol,
      });
      isCompleted = true;
      clearTimeout(connectionTimeout);
      reject(
        new Error(
          "Failed to connect to age transformation server. Please check if the server is running."
        )
      );
    };

    ws.onclose = (event) => {
      console.log(
        "👋 Disconnected from age transformation server:",
        event.code,
        event.reason
      );
      console.log("🔍 Close event details:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      clearTimeout(connectionTimeout);
      if (!isCompleted && event.code !== 1000) {
        const errorMessage =
          event.code === 1006
            ? "Server connection failed - please check if the age transformation server is running"
            : `Connection closed unexpectedly: ${event.code} ${event.reason}`;
        reject(new Error(errorMessage));
      }
    };
  });
};

export const handleBackgroundReplacementWebSocket = async ({
  foregroundUrl,
  backgroundUrl,
  onStatusUpdate,
}: {
  foregroundUrl: string;
  backgroundUrl: string;
  onStatusUpdate: (data: any) => void;
}) => {
  return new Promise((resolve, reject) => {
    // Use the ngrok URL for background replacement service
    const wsUrl = `wss://859e9537b404.ngrok-free.app/ws`;
    console.log(
      "🔗 Attempting to connect to background replacement service:",
      wsUrl
    );

    const ws = new WebSocket(wsUrl);
    let isCompleted = false;

    const connectionTimeout = setTimeout(() => {
      if (!isCompleted) {
        console.log("⏰ Background replacement timeout after 2 minutes");
        ws.close();
        reject(new Error("Background replacement timeout - please try again"));
      }
    }, 120000); // 2 minutes timeout

    ws.onopen = () => {
      console.log("🤝 Connected to background replacement server");
      console.log("📤 Sending background replacement request...");

      // Send the message in the format expected by your FastAPI server
      const message = {
        foreground_url: foregroundUrl,
        background_url: backgroundUrl,
      };

      console.log("📋 Sending message:", message);
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const messageType = message.type;
        const messageData = message;

        console.log("📩 Received message:", message);

        if (messageType === "status") {
          onStatusUpdate({
            status: "processing",
            message:
              messageData.message || "Processing background replacement...",
          });
        } else if (messageType === "result") {
          console.log("✅ Background replacement completed:", messageData);
          isCompleted = true;
          clearTimeout(connectionTimeout);

          resolve({
            status: "completed",
            finalUrl: messageData.result_url,
          });

          setTimeout(() => ws.close(), 1000);
        } else if (messageType === "error") {
          console.error("❌ Background replacement error:", messageData);
          isCompleted = true;
          clearTimeout(connectionTimeout);
          reject(
            new Error(messageData.message || "Background replacement failed")
          );
          ws.close();
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
        isCompleted = true;
        clearTimeout(connectionTimeout);
        reject(new Error("Invalid response from server"));
        ws.close();
      }
    };

    ws.onerror = (error) => {
      console.error("🔥 WebSocket connection error:", error);
      console.error("🔍 Connection details:", {
        url: wsUrl,
        readyState: ws.readyState,
        protocol: ws.protocol,
      });
      isCompleted = true;
      clearTimeout(connectionTimeout);
      reject(
        new Error(
          "Failed to connect to background replacement server. Please check if the server is running."
        )
      );
    };

    ws.onclose = (event) => {
      console.log(
        "👋 Disconnected from background replacement server:",
        event.code,
        event.reason
      );
      console.log("🔍 Close event details:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      clearTimeout(connectionTimeout);
      if (!isCompleted && event.code !== 1000) {
        const errorMessage =
          event.code === 1006
            ? "Server connection failed - please check if the background replacement server is running"
            : `Connection closed unexpectedly: ${event.code} ${event.reason}`;
        reject(new Error(errorMessage));
      }
    };
  });
};
