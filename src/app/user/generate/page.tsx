"use client";
import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { CiImageOn } from "react-icons/ci";
import { LuAudioLines } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import { IoMdDocument } from "react-icons/io";
import Image from "next/image";
import { useWavesurfer } from "@wavesurfer/react";
import { CustomAudioRecorder } from "@/components/CustomAudioRecorder";
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/app/loading";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { TTSOptions, AudioInput, ttsStatus, videoStatus } from "@/types/types";

// Add these type definitions at the top after imports
interface ProcessingTime {
  generation?: number;
  upload?: number;
  total?: number;
}

interface TTSStatusData {
  status: ttsStatus;
  message?: string;
  processingTime?: {
    generation?: number;
    upload?: number;
    total?: number;
  };
}
import {
  defaultTTSOptions,
  getTTSStatusIcon,
  getVideoStatusIcon,
  handleVideoPostProcessing,
} from "@/lib/utils";
import {
  handleSingleUpload,
  handleOnTTSWebSocket,
  handleVideoGeneration,
  getActiveProject,
  deleteObjectsInProject,
} from "@/lib/api";
import AgeTransformation from "@/components/AgeTransformation";
import BackgroundReplacement from "@/components/BackgroundReplacement";

export default function GeneratePage() {
  //User
  const { currentUser, loading } = useAuth();
  const [projectId, setProjectId] = useState<string>();
  const [projectLoading, setProjectLoading] = useState<boolean>(false);
  const uploadContainerRef = useRef(null);

  //Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState<boolean>(false);

  //Audio
  const [audio, setAudio] = useState<AudioInput>("File");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioUploading, setAudioUploading] = useState<boolean>(false);

  //TTS
  const ttsContainerRef = useRef(null);
  const [ttsStatus, setTtsStatus] = useState<ttsStatus>("idle");
  const [ttsMessage, setTtsMessage] = useState<string>("");
  const [processingTime, setProcessingTime] = useState<ProcessingTime | null>(
    null
  );
  const [ttsConfig, setTtsConfig] = useState<TTSOptions>(defaultTTSOptions);

  //Video
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<videoStatus>("idle");
  const [videoMessage, setVideoMessage] = useState<string>("");
  const [videoStartTime, setVideoStartTime] = useState<number | null>(null);
  const [videoElapsedTime, setVideoElapsedTime] = useState<number>(0);
  const videoTimerRef = useRef<NodeJS.Timeout | null>(null);

  //Age Transformation
  const [showAgeTransformation, setShowAgeTransformation] =
    useState<boolean>(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  //Background Replacement
  const [showBackgroundReplacement, setShowBackgroundReplacement] =
    useState<boolean>(false);

  const {
    wavesurfer: uploadWavesurfer,
    isPlaying: uploadIsPlaying,
    currentTime: uploadCurrentTime,
  } = useWavesurfer({
    container: uploadContainerRef,
    height: 80,
    waveColor: "#3b82f6",
    progressColor: "#1d4ed8",
    url: audioUrl && audioFile ? audioUrl : undefined,
    plugins: useMemo(() => [Timeline.create()], []),
  });

  const {
    wavesurfer: ttsWavesurfer,
    isPlaying: ttsIsPlaying,
    currentTime: ttsCurrentTime,
  } = useWavesurfer({
    container: ttsContainerRef,
    height: 80,
    waveColor: "#10b981",
    progressColor: "#059669",
    url: audioUrl && !audioFile ? audioUrl : undefined,
    plugins: useMemo(() => [Timeline.create()], []),
  });

  const onUploadPlayPause = useCallback(() => {
    if (uploadWavesurfer) {
      uploadWavesurfer.playPause();
    }
  }, [uploadWavesurfer]);

  const onTtsPlayPause = useCallback(() => {
    if (ttsWavesurfer) {
      ttsWavesurfer.playPause();
    }
  }, [ttsWavesurfer]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      if (currentUser && !loading) {
        setProjectLoading(true);
        try {
          const project =
            (await getActiveProject(currentUser)) instanceof Array
              ? (await getActiveProject(currentUser))[0]
              : await getActiveProject(currentUser);
          console.log("Active project:", project);
          if (project) {
            const media = project.media;
            for (const item of media) {
              if (item.fileType === "IMAGE") {
                setImageUrl(item.url);
                setImageFile(new File([], item.fileName));
              } else if (item.fileType === "AUDIO") {
                setAudioUrl(item.url);
                setAudioFile(new File([], item.fileName));
                setAudio("File");
              } else if (item.fileType === "VIDEO") {
                setVideoUrl(item.url);
              }
            }
          }
          setProjectId(project?.id);
        } catch (error) {
          console.error("Error fetching active project:", error);
        } finally {
          setProjectLoading(false);
        }
      }
    };
    fetchProject();
  }, [currentUser, loading]);

  if (loading || projectLoading)
    return (
      <div>
        <Loading />
      </div>
    );

  const handleAudioReset = async () => {
    setAudioUrl(null);
    setAudioFile(null);
    if (projectId) {
      await deleteObjectsInProject(currentUser!, projectId, "audio");
    }
    setProcessingTime(null);
    setTtsStatus("idle");
    setTtsMessage("");
    const fileInput = document.getElementById(
      "audio-upload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleTTSStatusUpdate = (data: TTSStatusData) => {
    console.log("TTS Status Update:", data);
    setTtsStatus(data.status);
    setTtsMessage(data.message || "");

    if (data.processingTime?.total) {
      setProcessingTime({
        total:
          typeof data.processingTime?.total === "number"
            ? data.processingTime.total
            : 0,
      });
    }
    if (data.processingTime?.generation) {
      setProcessingTime((prev: ProcessingTime | null) => ({
        ...prev,
        generation:
          typeof data.processingTime?.generation === "number"
            ? data.processingTime.generation
            : 0,
      }));
    }
  };

  const startVideoTimer = () => {
    const startTime = Date.now();
    setVideoStartTime(startTime);
    setVideoElapsedTime(0);

    videoTimerRef.current = setInterval(() => {
      setVideoElapsedTime((Date.now() - startTime) / 1000);
    }, 100); // Update every 100ms for smooth decimal display
  };

  const stopVideoTimer = () => {
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
  };

  // Age Transformation handlers
  const handleAgeTransformationComplete = (transformedImageUrl: string) => {
    setImageUrl(transformedImageUrl);
    setShowAgeTransformation(false);
  };

  const handleShowAgeTransformation = () => {
    if (imageUrl) {
      setOriginalImageUrl(imageUrl);
      setShowAgeTransformation(true);
    }
  };

  // Background Replacement handlers
  const handleBackgroundReplacementComplete = (transformedImageUrl: string) => {
    setImageUrl(transformedImageUrl);
    setShowBackgroundReplacement(false);
  };

  const handleShowBackgroundReplacement = () => {
    if (imageUrl) {
      setOriginalImageUrl(imageUrl);
      setShowBackgroundReplacement(true);
    }
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
                  imageUrl ? "hidden" : "flex"
                } ${audioUploading ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {imageUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mb-2"></div>
                    <span className="text-gray-500">Uploading image...</span>
                  </div>
                ) : audioUploading ? (
                  <div className="flex flex-col items-center">
                    <CiImageOn className="text-6xl text-gray-400 mb-2" />
                    <span className="text-gray-400">
                      Please wait, audio is uploading...
                    </span>
                  </div>
                ) : (
                  <>
                    <CiImageOn className="text-6xl text-gray-500 mb-2" />
                    <span className="text-gray-500">
                      Upload a Portrait by clicking here
                    </span>
                  </>
                )}
              </label>
              {imageUrl && (
                <div
                  onClick={() =>
                    !imageUploading &&
                    !audioUploading &&
                    document.getElementById("file-upload")?.click()
                  }
                  className={`absolute inset-0 transition-opacity ${
                    imageUploading || audioUploading
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:opacity-90"
                  }`}
                >
                  <Image
                    src={imageUrl}
                    alt="Image Preview"
                    fill
                    className="object-contain rounded"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 hover:opacity-30 transition-opacity flex items-center justify-center">
                    <span className="text-white">
                      {imageUploading
                        ? "Uploading..."
                        : audioUploading
                        ? "Audio uploading, please wait..."
                        : "Click to change image"}
                    </span>
                  </div>
                  {(imageUploading || audioUploading) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                        <span className="text-white">
                          {imageUploading
                            ? "Uploading..."
                            : "Audio uploading, please wait..."}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={imageUploading || audioUploading}
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setImageUploading(true);
                    try {
                      if (projectId) {
                        await deleteObjectsInProject(
                          currentUser!,
                          projectId,
                          "image"
                        );
                      }
                      const data = await handleSingleUpload(
                        file,
                        currentUser!,
                        projectId ? projectId : undefined
                      );
                      setImageUrl(data.files[0].url);
                      setImageFile(file);
                      setProjectId(data.projectId);
                    } catch (error) {
                      console.error("Error uploading image:", error);
                    } finally {
                      setImageUploading(false);
                    }
                  }
                }}
              />
            </div>
            {/* AI Enhancement Buttons */}
            {imageUrl && !imageUploading && !audioUploading && (
              <div className="mt-4 flex justify-center space-x-3">
                <Button
                  onClick={handleShowAgeTransformation}
                  variant="outline"
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  🎭 Transform Age (Optional)
                </Button>
                <Button
                  onClick={handleShowBackgroundReplacement}
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  🖼️ Replace Background (Optional)
                </Button>
              </div>
            )}
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
                variant={audio === "Record" ? "default" : "outline"}
                className="text-sm"
                onClick={() => setAudio("Record")}
              >
                <span className="text-xs">Record Audio</span>
              </Button>
              <Button
                variant={
                  audio === "Upload" || audio === "File" ? "default" : "outline"
                }
                className="text-sm"
                onClick={() => setAudio("Upload")}
              >
                <span className="text-xs">Upload Audio</span>
              </Button>
            </div>
          </div>
          <div className={audio === "Record" ? "block" : "hidden"}>
            <CustomAudioRecorder
              onRecordingComplete={(audioBlob: Blob) => {
                console.log("Recording complete");
                // Convert blob to file and upload
                const file = new File(
                  [audioBlob],
                  `recorded-audio-${Date.now()}.webm`,
                  {
                    type: "audio/webm",
                  }
                );
                // Handle the recorded audio file similar to uploaded files
                setAudioUploading(true);
                setAudio("Upload");
                handleSingleUpload(
                  file,
                  currentUser!,
                  projectId ? projectId : undefined
                )
                  .then((data) => {
                    setAudioUrl(data.files[0].url);
                    setAudioFile(file);
                    setProjectId(data.projectId);
                  })
                  .catch((error) => {
                    console.error("Error uploading recorded audio:", error);
                  })
                  .finally(() => {
                    setAudioUploading(false);
                  });
              }}
              onNotAllowedOrFound={(err: Error) => console.table(err)}
            />
          </div>
          <div
            className={
              audio === "Upload" || audio === "File" ? "block" : "hidden"
            }
          >
            <div className="flex flex-col space-y-4">
              <label
                htmlFor="audio-upload"
                className={`flex flex-col items-center justify-center h-32 bg-gray-200 border border-gray-300 rounded hover:bg-gray-300 transition-colors duration-200 relative ${
                  audioUploading || imageUploading
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
              >
                {audioUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mb-2"></div>
                    <span className="text-gray-500">Uploading audio...</span>
                  </div>
                ) : imageUploading ? (
                  <div className="flex flex-col items-center">
                    <LuAudioLines className="text-6xl text-gray-400 mb-2" />
                    <span className="text-gray-400">
                      Please wait, image is uploading...
                    </span>
                  </div>
                ) : audioUrl ? (
                  <div className="flex items-center space-x-2">
                    <IoMdDocument className="text-4xl text-gray-500" />
                    <span className="text-gray-700 font-medium">
                      {audioFile?.name}
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
                disabled={audioUploading || imageUploading}
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setAudioUploading(true);
                    try {
                      if (projectId) {
                        await deleteObjectsInProject(
                          currentUser!,
                          projectId,
                          "audio"
                        );
                      }
                      const data = await handleSingleUpload(
                        file,
                        currentUser!,
                        projectId ? projectId : undefined
                      );
                      setAudioUrl(data.files[0].url);
                      setAudioFile(file);
                      setProjectId(data.projectId);
                    } catch (error) {
                      console.error("Error uploading audio:", error);
                    } finally {
                      setAudioUploading(false);
                    }
                  }
                }}
              />
              {audioUrl && audioFile && !audioUploading && (
                <div className="flex flex-col space-y-2">
                  <div className="relative">
                    <div
                      ref={uploadContainerRef}
                      className="w-full h-24 bg-gray-100 rounded"
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span>{uploadIsPlaying ? "Playing" : "Paused"}</span>
                    <span>{Number(uploadCurrentTime || 0).toFixed(2)}s</span>
                  </div>
                  <button
                    onClick={onUploadPlayPause}
                    className="self-center flex bg-white p-1 rounded shadow hover:bg-gray-200 mt-2 hover:cursor-pointer"
                  >
                    {uploadIsPlaying ? "Pause" : "Play"}
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
            {ttsStatus !== "idle" && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getTTSStatusIcon(ttsStatus)}</span>
                  <span className="font-medium text-blue-800 capitalize">
                    {ttsStatus}
                  </span>
                </div>
                {ttsMessage && (
                  <p className="text-sm text-blue-600 mb-2">{ttsMessage}</p>
                )}
                {processingTime && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {processingTime.generation &&
                      typeof processingTime.generation === "number" && (
                        <div className="text-center">
                          <div className="font-bold text-blue-600">
                            {Number(processingTime.generation || 0).toFixed(2)}s
                          </div>
                          <div className="text-gray-600">Generation</div>
                        </div>
                      )}
                    {processingTime.upload &&
                      typeof processingTime.upload === "number" && (
                        <div className="text-center">
                          <div className="font-bold text-yellow-600">
                            {Number(processingTime.upload || 0).toFixed(2)}s
                          </div>
                          <div className="text-gray-600">Upload</div>
                        </div>
                      )}
                    {processingTime.total &&
                      typeof processingTime.total === "number" && (
                        <div className="text-center">
                          <div className="font-bold text-green-600">
                            {Number(processingTime.total || 0).toFixed(2)}s
                          </div>
                          <div className="text-gray-600">Total</div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
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
                      {Number(value || 0).toFixed(4)}
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
                className={`px-4 py-2 rounded transition-opacity ${
                  ttsStatus === "idle"
                    ? "bg-blue-500 hover:bg-blue-600 text-white hover:cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={ttsStatus !== "idle"}
                onClick={async () => {
                  try {
                    setProcessingTime(null);
                    setTtsStatus("processing");
                    setTtsMessage("Starting TTS generation...");

                    const ttsResponse = await handleOnTTSWebSocket({
                      TTSOptions: ttsConfig,
                      onStatusUpdate: handleTTSStatusUpdate,
                    });
                    const typedTtsResponse = ttsResponse as {
                      audioUrl: string;
                    };
                    setAudioUrl(typedTtsResponse.audioUrl);
                    setAudioFile(null);
                    console.log(
                      "TTS generated successfully:",
                      typedTtsResponse
                    );
                  } catch (error) {
                    setTtsStatus("error");
                    setTtsMessage("TTS generation failed");
                    console.error("Error generating TTS:", error);
                  }
                }}
              >
                {ttsStatus === "idle"
                  ? "Generate Audio"
                  : ttsStatus === "processing"
                  ? "Starting..."
                  : ttsStatus === "generating"
                  ? "Generating..."
                  : ttsStatus === "uploading"
                  ? "Uploading..."
                  : "Generate Audio"}
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 hover:opacity-90 transition-opacity hover:cursor-pointer mt-2"
                onClick={() => {
                  setTtsConfig(defaultTTSOptions);
                  setProcessingTime(null);
                  setTtsStatus("idle");
                  setTtsMessage("");
                }}
              >
                Reset TTS Config
              </button>
            </div>
            {audioUrl && !audioFile && (
              <div className="flex flex-col space-y-2">
                <div className="relative">
                  <div
                    ref={ttsContainerRef}
                    className="w-full h-24 bg-gray-100 rounded"
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                  <span>{ttsIsPlaying ? "Playing" : "Paused"}</span>
                  <span>{Number(ttsCurrentTime || 0).toFixed(2)}s</span>
                </div>
                <button
                  onClick={onTtsPlayPause}
                  className="self-center flex bg-white p-1 rounded shadow hover:bg-gray-200 mt-2 hover:cursor-pointer"
                >
                  {ttsIsPlaying ? "Pause" : "Play"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-col space-y-4 p-4 border border-gray-300 rounded">
          <h2 className="text-xl font-bold">Generate AI Portrait Video</h2>

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">Prerequisites:</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div
                className={`flex items-center ${
                  imageUrl ? "text-green-600" : "text-red-600"
                }`}
              >
                <span className="mr-1">{imageUrl ? "✅" : "❌"}</span>
                Portrait Image
              </div>
              <div
                className={`flex items-center ${
                  audioUrl ? "text-green-600" : "text-red-600"
                }`}
              >
                <span className="mr-1">{audioUrl ? "✅" : "❌"}</span>
                Audio Source
              </div>
            </div>
            {(!imageUrl || !audioUrl) && (
              <p className="text-red-600 text-sm mt-2">
                Please upload both a portrait image and audio before generating
                the video.
              </p>
            )}
          </div>

          {videoStatus !== "idle" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {getVideoStatusIcon(videoStatus)}
                </span>
                <span className="font-medium text-blue-800 capitalize">
                  {videoStatus}
                </span>
                {videoStatus === "processing" && (
                  <div className="ml-auto flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-mono text-blue-700">
                      {Number(videoElapsedTime || 0).toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>
              {videoMessage && (
                <p className="text-sm text-blue-600">{videoMessage}</p>
              )}
              {videoStatus === "processing" && (
                <div className="mt-3">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full animate-pulse"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-500 mt-1 text-center">
                    Processing your request... Please wait
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center">
            <button
              className={`px-8 py-3 rounded-lg font-medium transition-all ${
                videoStatus === "idle" && imageUrl && audioUrl && projectId
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={
                videoStatus !== "idle" || !imageUrl || !audioUrl || !projectId
              }
              onClick={async () => {
                if (!projectId || !imageUrl || !audioUrl) {
                  console.error("Missing required data:", {
                    projectId,
                    imageUrl,
                    audioUrl,
                  });
                  return;
                }

                try {
                  setVideoStatus("processing");
                  setVideoMessage("Generating video...");
                  const startTime = performance.now();
                  startVideoTimer();

                  const videoResponse = await handleVideoGeneration({
                    user: currentUser!,
                    projectId,
                    imageUrl,
                    audioUrl,
                  });

                  console.log("Video generation response:", videoResponse);

                  const finalVideoUrl = await handleVideoPostProcessing(
                    currentUser!,
                    projectId,
                    videoResponse
                  );

                  const stopTime = performance.now();
                  stopVideoTimer();
                  const finalElapsedTime = (stopTime - startTime) / 1000;
                  if (videoResponse.name) {
                    setVideoUrl(finalVideoUrl);
                    setVideoStatus("completed");
                    setVideoMessage(
                      `Video generated successfully in ${Number(
                        finalElapsedTime || 0
                      ).toFixed(1)}s!`
                    );
                  } else {
                    throw new Error("No video file name returned from API");
                  }

                  console.log("Video generated successfully:", videoResponse);
                } catch (error) {
                  const finalElapsedTime = videoElapsedTime;
                  stopVideoTimer();
                  setVideoStatus("error");
                  setVideoMessage(
                    `Video generation failed after ${Number(
                      finalElapsedTime || 0
                    ).toFixed(1)}s`
                  );
                  console.error("Error generating video:", error);
                }
              }}
            >
              {videoStatus === "idle"
                ? "🎬 Generate AI Portrait Video"
                : videoStatus === "processing"
                ? "🎬 Generating Video..."
                : videoStatus === "completed"
                ? "✅ Video Generated!"
                : videoStatus === "error"
                ? "❌ Generation Failed"
                : "🎬 Generate AI Portrait Video"}
            </button>
          </div>

          {videoUrl && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-4 text-center">Generated Video</h3>
              <div className="flex justify-center">
                <video
                  src={videoUrl}
                  controls
                  className="max-w-full max-h-96 rounded-lg shadow-lg"
                  style={{ maxWidth: "600px" }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="flex justify-center mt-4 space-x-4">
                <a
                  href={videoUrl}
                  download="generated-portrait-video.mp4"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  📥 Download Video
                </a>
                <button
                  onClick={() => {
                    setVideoUrl(null);
                    setVideoStatus("idle");
                    setVideoMessage("");
                    setVideoElapsedTime(0);
                    setVideoStartTime(null);
                    stopVideoTimer();
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  🆕 New Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Age Transformation Modal */}
      {showAgeTransformation && originalImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AgeTransformation
              originalImageUrl={originalImageUrl}
              projectId={projectId}
              onTransformationComplete={handleAgeTransformationComplete}
              onClose={() => setShowAgeTransformation(false)}
            />
          </div>
        </div>
      )}

      {/* Background Replacement Modal */}
      {showBackgroundReplacement && originalImageUrl && (
        <BackgroundReplacement
          originalImageUrl={originalImageUrl}
          projectId={projectId}
          onTransformationComplete={handleBackgroundReplacementComplete}
          onClose={() => setShowBackgroundReplacement(false)}
        />
      )}
    </div>
  );
}
