"use client";
import { Button } from "@/components/ui/button";
import { CiImageOn } from "react-icons/ci";
import { LuAudioLines } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import { IoMdDocument } from "react-icons/io";
import { useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { useWavesurfer } from "@wavesurfer/react";
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/app/loading";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const ngrok_url =
  process.env.NEXT_PUBLIC_NGROK_URL || "http://localhost:3000/api";

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type AudioInput = "File" | "TTS" | "Record";

const handleOnTTS = async ({
  text,
  speed,
  language,
  pitch,
  emotion,
}: {
  text: string;
  speed: number;
  language: string;
  pitch: number;
  emotion: {
    happiness: number;
    sadness: number;
    disgust: number;
    fear: number;
    surprise: number;
    anger: number;
    other: number;
    neutral: number;
  };
}) => {
  const emotionValues: number[] = Object.values(emotion);
  const response = await fetch(`${ngrok_url}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      speed,
      language,
      pitch,
      emotion: emotionValues,
    }),
  });

  if (!response.ok) {
    throw new Error("TTS request failed");
  }

  const data = await response.json();
  return data;
};

const handleImagePreview = (
  file: File,
  setPreviewUrl: (url: string) => void
) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target && e.target.result) {
      console.log("Image preview URL:", e.target.result);
      setPreviewUrl(e.target.result as string);
    }
  };
  reader.readAsDataURL(file);
};

const handleAudioPreview = (
  file: File,
  setPreviewUrl: (url: string) => void
) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target && e.target.result) {
      console.log("Audio preview URL:", e.target.result);
      setPreviewUrl(e.target.result as string);
    }
  };
  reader.readAsDataURL(file);
};

const handleImageUpload = async (
  file: File,
  userId: string,
  jobId?: string
) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("userId", userId);
  if (jobId) {
    formData.append("jobId", jobId);
  }

  try {
    const response = await fetch(`${backendUrl}/api/upload/image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Image upload failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

const handleAudioUpload = async (
  file: File,
  userId: string,
  jobId?: string
) => {
  const formData = new FormData();
  formData.append("audio", file);
  formData.append("userId", userId);
  if (jobId) {
    formData.append("jobId", jobId);
  }

  try {
    const response = await fetch(`${backendUrl}/api/upload/audio`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Audio upload failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw error;
  }
};

export default function GeneratePage() {
  const [audio, setAudio] = useState<AudioInput>("File");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const containerRef = useRef(null);
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [jobId, setJobId] = useState<string | undefined>(undefined);

  const [ttsConfig, setTtsConfig] = useState({
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
  });

  if (loading)
    return (
      <div>
        <Loading />
      </div>
    );

  const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    height: 100,
    waveColor: "rgb(200, 0, 200)",
    progressColor: "rgb(100, 0, 100)",
    url: audioPreviewUrl ? audioPreviewUrl : undefined,
    plugins: useMemo(() => [Timeline.create()], []),
  });

  const onPlayPause = useCallback(() => {
    wavesurfer && wavesurfer.playPause();
  }, [wavesurfer]);

  const handleAudioReset = () => {
    setAudioPreviewUrl(null);
    setAudioFileName(null);
    setAudioFile(null);
    const fileInput = document.getElementById(
      "audio-upload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold mb-4">Generate AI Portrait</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <div className="flex flex-col space-y-4 p-4 border border-gray-300 rounded">
            <p>Input Image</p>
            <div className="relative max-h-[50vh] aspect-[1.2/1]">
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center h-full cursor-pointer bg-gray-200 border border-gray-300 rounded hover:bg-gray-300 transition-colors duration-200 ${
                  imagePreviewUrl ? "hidden" : "flex"
                }`}
              >
                <CiImageOn className="text-6xl text-gray-500 mb-2" />
                <span className="text-gray-500">
                  Upload a Portrait by clicking here
                </span>
              </label>
              {imagePreviewUrl && (
                <div
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  className="absolute inset-0 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={imagePreviewUrl}
                    alt="Image Preview"
                    fill
                    className="object-contain rounded"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 hover:opacity-30 transition-opacity flex items-center justify-center">
                    <span className="text-white">Click to change image</span>
                  </div>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    handleImagePreview(file, setImagePreviewUrl);
                    setImageFile(file);
                  }
                }}
              />
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded
            hover:bg-blue-600 hover:opacity-90 transition-opacity hover:cursor-pointer"
              onClick={async () => {
                if (imageFile) {
                  try {
                    const response = await handleImageUpload(
                      imageFile,
                      currentUser!.uid,
                      jobId
                    );
                    if (response.jobId) {
                      setJobId(response.jobId);
                    }
                    setImageUrl(response.imageUrl);
                    console.log("Image uploaded successfully:", response);
                  } catch (error) {
                    console.error("Error uploading image:", error);
                  }
                } else {
                  alert("Please select an image to upload.");
                }
              }}
            >
              Upload Image
            </button>
          </div>
        </div>
        <div className="flex flex-col h-fit space-y-4 p-4 border border-gray-300 rounded">
          <div className="flex justify-between">
            <p>Audio Input</p>
            <div className="flex space-x-2">
              <Button
                variant={audio === "TTS" ? "default" : "outline"}
                className="text-sm"
                onClick={() => setAudio("TTS")}
              >
                <span className="text-xs">Use TTS</span>
              </Button>
              <Button
                variant={
                  audio === "Record" || audio === "File" ? "default" : "outline"
                }
                className="text-sm"
                onClick={() => setAudio("Record")}
              >
                <span className="text-xs">Record/Upload Audio</span>
              </Button>
            </div>
          </div>
          <div
            className={
              audio === "Record" || audio === "File" ? "block" : "hidden"
            }
          >
            <div className="flex flex-col space-y-4">
              <label
                htmlFor="audio-upload"
                className="flex flex-col items-center justify-center h-32 cursor-pointer bg-gray-200 border border-gray-300 rounded hover:bg-gray-300 transition-colors duration-200 relative"
              >
                {audioPreviewUrl ? (
                  <div className="flex items-center space-x-2">
                    <IoMdDocument className="text-4xl text-gray-500" />
                    <span className="text-gray-700 font-medium">
                      {audioFileName}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAudioReset();
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors hover:cursor-pointer"
                    >
                      <IoClose className="text-gray-700" />
                    </button>
                  </div>
                ) : (
                  <>
                    <LuAudioLines className="text-6xl text-gray-500 mb-2" />
                    <span className="text-gray-500">Upload an Audio File</span>
                  </>
                )}
              </label>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    handleAudioPreview(file, setAudioPreviewUrl);
                    setAudioFileName(file.name);
                    setAudioFile(file);
                  }
                }}
              />
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 hover:opacity-90 transition-opacity hover:cursor-pointer"
                onClick={async () => {
                  if (audioFile) {
                    try {
                      const response = await handleAudioUpload(
                        audioFile,
                        currentUser!.uid,
                        jobId
                      );
                      if (response.jobId) {
                        setJobId(response.jobId);
                      }
                      setAudioUrl(response.audioUrl);
                      console.log("Audio uploaded successfully:", response);
                    } catch (error) {
                      console.error("Error uploading audio:", error);
                    }
                  } else {
                    alert("Please select an audio file to upload.");
                  }
                }}
              >
                Upload Audio
              </button>
              {audioPreviewUrl && (
                <div className="flex flex-col space-y-2">
                  <div className="relative">
                    <div
                      ref={containerRef}
                      className="w-full h-24 bg-gray-100 rounded"
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span>{isPlaying ? "Playing" : "Paused"}</span>
                    <span>{currentTime.toFixed(2)}s</span>
                  </div>
                  <button
                    onClick={onPlayPause}
                    className="self-center flex bg-white p-1 rounded shadow hover:bg-gray-200 mt-2 hover:cursor-pointer"
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className={audio === "TTS" ? "block" : "hidden"}>
            <input
              type="text"
              placeholder="Enter your sentence here"
              value={ttsConfig.text && ttsConfig.text}
              onChange={(e) =>
                setTtsConfig({ ...ttsConfig, text: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex flex-col space-y-4">
              <Label
                htmlFor="speed-slider"
                className="text-sm mb-2 flex justify-between"
              >
                <span>Speed</span>
                <span className="font-mono">{ttsConfig.speed}</span>
              </Label>
              <Slider
                id="speed-slider"
                defaultValue={[15]}
                max={40}
                step={1}
                className="mb-4 border border-gray-300 rounded"
                onValueChange={(value) =>
                  setTtsConfig({ ...ttsConfig, speed: value[0] })
                }
                value={[ttsConfig.speed]}
              />
              <Label
                htmlFor="pitch-slider"
                className="text-sm mb-2 flex justify-between"
              >
                <span>Pitch</span>
                <span>
                  {ttsConfig.pitch <= 45 && ttsConfig.pitch >= 20
                    ? "Normal"
                    : ttsConfig.pitch < 150
                    ? "Expressive"
                    : "Crazy"}
                </span>
                <span className="font-mono">{ttsConfig.pitch}</span>
              </Label>
              <Slider
                id="pitch-slider"
                defaultValue={[20]}
                max={400}
                step={1}
                className="mb-4 border border-gray-300 rounded"
                onValueChange={(value) =>
                  setTtsConfig({ ...ttsConfig, pitch: value[0] })
                }
                value={[ttsConfig.pitch]}
              />
              <Label
                htmlFor="language-select"
                className="text-sm mb-2 flex justify-between"
              >
                <span>Language</span>
                <span className="font-mono">{ttsConfig.language}</span>
              </Label>
              <select
                id="language-select"
                value={ttsConfig.language}
                onChange={(e) =>
                  setTtsConfig({ ...ttsConfig, language: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded mb-4"
              >
                <option value="en-us">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
              <Label className="text-sm mb-2">Emotion</Label>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {Object.entries(ttsConfig.emotion).map(([emotion, value]) => (
                  <div key={emotion} className="flex flex-col">
                    <span className="text-xs text-gray-600 capitalize mb-1">
                      {emotion}
                    </span>
                    <span className="text-xs text-gray-600 mb-2">
                      {value.toFixed(4)}
                    </span>
                    <Slider
                      defaultValue={[value * 100]}
                      max={100}
                      step={1}
                      className="border border-gray-300 rounded"
                      onValueChange={(val) =>
                        setTtsConfig({
                          ...ttsConfig,
                          emotion: {
                            ...ttsConfig.emotion,
                            [emotion]: val[0] / 100,
                          },
                        })
                      }
                      value={[value * 100]}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 hover:opacity-90 transition-opacity hover:cursor-pointer"
                onClick={async () => {
                  try {
                    const ttsResponse = await handleOnTTS(ttsConfig);
                    setAudioPreviewUrl(ttsResponse.audioUrl);
                    setAudioFileName("Generated Audio");
                    setAudioFile(null);
                    console.log("TTS generated successfully:", ttsResponse);
                  } catch (error) {
                    console.error("Error generating TTS:", error);
                  }
                }}
              >
                Generate Audio
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 hover:opacity-90 transition-opacity hover:cursor-pointer mt-2"
                onClick={() => {
                  setTtsConfig({
                    text: "",
                    speed: 15.0,
                    language: "en-US",
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
                  });
                }}
              >
                Reset TTS Config
              </button>
            </div>
            {audioPreviewUrl && (
              <div className="flex flex-col space-y-2">
                <div className="relative">
                  <div
                    ref={containerRef}
                    className="w-full h-24 bg-gray-100 rounded"
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                  <span>{isPlaying ? "Playing" : "Paused"}</span>
                  <span>{currentTime.toFixed(2)}s</span>
                </div>
                <button
                  onClick={onPlayPause}
                  className="self-center flex bg-white p-1 rounded shadow hover:bg-gray-200 mt-2 hover:cursor-pointer"
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
