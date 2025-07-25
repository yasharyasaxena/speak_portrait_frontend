"use client";
import { Button } from "@/components/ui/button";
import { CiImageOn } from "react-icons/ci";
import { LuAudioLines } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import { IoMdDocument } from "react-icons/io";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useWavesurfer } from "@wavesurfer/react";
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/app/loading";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { TTSOptions, AudioInput, ttsStatus } from "@/types/types";
import { defaultTTSOptions, getTTSStatusIcon } from "@/lib/utils";
import {
  handleSingleUpload,
  handleOnTTSWebSocket,
  getActiveProject,
  getObjectsInProject,
  deleteObjectsInProject,
} from "@/lib/api";

export default function GeneratePage() {
  //User
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [projectId, setProjectId] = useState<string>();
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
  const [processingTime, setProcessingTime] = useState<any>(null);
  const [ttsConfig, setTtsConfig] = useState<TTSOptions>(defaultTTSOptions);

  if (loading)
    return (
      <div>
        <Loading />
      </div>
    );

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
    uploadWavesurfer && uploadWavesurfer.playPause();
  }, [uploadWavesurfer]);

  const onTtsPlayPause = useCallback(() => {
    ttsWavesurfer && ttsWavesurfer.playPause();
  }, [ttsWavesurfer]);

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

  const handleTTSStatusUpdate = (data: any) => {
    setTtsStatus(data.status);
    setTtsMessage(data.message || "");

    if (data.processingTime) {
      setProcessingTime(data.processingTime);
    }
    if (data.generationTime) {
      setProcessingTime((prev: any) => ({
        ...prev,
        generation: data.generationTime,
      }));
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (currentUser) {
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
              }
            }
          }
          setProjectId(project?.id);
        } catch (error) {
          console.error("Error fetching active project:", error);
        }
      }
    };
    fetchProject();
  }, [currentUser]);

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
                    <span>{uploadCurrentTime.toFixed(2)}s</span>
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
                    {processingTime.generation && (
                      <div className="text-center">
                        <div className="font-bold text-blue-600">
                          {processingTime.generation.toFixed(2)}s
                        </div>
                        <div className="text-gray-600">Generation</div>
                      </div>
                    )}
                    {processingTime.upload && (
                      <div className="text-center">
                        <div className="font-bold text-yellow-600">
                          {processingTime.upload.toFixed(2)}s
                        </div>
                        <div className="text-gray-600">Upload</div>
                      </div>
                    )}
                    {processingTime.total && (
                      <div className="text-center">
                        <div className="font-bold text-green-600">
                          {processingTime.total.toFixed(2)}s
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
                  <span>{ttsCurrentTime.toFixed(2)}s</span>
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
    </div>
  );
}
