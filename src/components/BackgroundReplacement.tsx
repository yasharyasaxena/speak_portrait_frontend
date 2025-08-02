"use client";
import React, { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  handleBackgroundReplacementWebSocket,
  handleSingleUpload,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User } from "firebase/auth";
import {
  MdAutoAwesome,
  MdClose,
  MdRefresh,
  MdDownload,
  MdCompareArrows,
  MdCloudUpload,
  MdImage,
} from "react-icons/md";
import Image from "next/image";

interface BackgroundReplacementProps {
  originalImageUrl: string;
  projectId?: string;
  onTransformationComplete?: (transformedImageUrl: string) => void;
  onClose?: () => void;
}

interface TransformationStatus {
  status: "idle" | "processing" | "completed" | "error";
  message: string;
}

const BackgroundReplacement: React.FC<BackgroundReplacementProps> = ({
  originalImageUrl,
  projectId,
  onTransformationComplete,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>("");
  const [replacedImageUrl, setReplacedImageUrl] = useState<string>("");
  const [transformationStatus, setTransformationStatus] =
    useState<TransformationStatus>({
      status: "idle",
      message: "Upload a background image to get started",
    });
  const [isComparing, setIsComparing] = useState(false);

  const handleStatusUpdate = (data: any) => {
    setTransformationStatus({
      status: data.status || "processing",
      message: data.message || "Processing...",
    });
  };

  const handleBackgroundUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setTransformationStatus({
          status: "error",
          message: "Please upload a valid image file",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setTransformationStatus({
          status: "error",
          message: "Image size should be less than 10MB",
        });
        return;
      }

      setBackgroundImage(file);
      const url = URL.createObjectURL(file);
      setBackgroundImageUrl(url);
      setTransformationStatus({
        status: "idle",
        message:
          "Background image uploaded. Click 'Replace Background' to process.",
      });
    }
  };

  const handleReplacement = async () => {
    if (!currentUser || !originalImageUrl || !backgroundImage) return;

    try {
      setTransformationStatus({
        status: "processing",
        message: "Uploading background image...",
      });

      // First upload the background image to get a public URL
      const backgroundUploadData = await handleSingleUpload(
        backgroundImage,
        currentUser
      );
      const publicBackgroundUrl = backgroundUploadData.files[0].url;

      setTransformationStatus({
        status: "processing",
        message: "Connecting to background replacement service...",
      });

      const result = await handleBackgroundReplacementWebSocket({
        foregroundUrl: originalImageUrl,
        backgroundUrl: publicBackgroundUrl,
        onStatusUpdate: handleStatusUpdate,
      });

      const typedResult = result as { finalUrl: string };

      setTransformationStatus({
        status: "processing",
        message: "Uploading final result...",
      });

      // Upload the final result to your S3 bucket
      const response = await fetch(typedResult.finalUrl);
      const blob = await response.blob();
      const file = new File([blob], `background-replaced-${Date.now()}.png`, {
        type: "image/png",
      });

      const uploadData = await handleSingleUpload(file, currentUser, projectId);

      const finalReplacedUrl = uploadData.files[0].url;
      setReplacedImageUrl(finalReplacedUrl);
      setTransformationStatus({
        status: "completed",
        message: "Background replacement completed successfully!",
      });

      if (onTransformationComplete) {
        onTransformationComplete(finalReplacedUrl);
      }
    } catch (error) {
      console.error("Background replacement error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Background replacement failed. Please try again.";
      setTransformationStatus({
        status: "error",
        message: errorMessage,
      });
    }
  };

  const handleUseReplaced = () => {
    if (replacedImageUrl && onTransformationComplete) {
      onTransformationComplete(replacedImageUrl);
    }
  };

  const handleReset = () => {
    setBackgroundImage(null);
    setBackgroundImageUrl("");
    setReplacedImageUrl("");
    setTransformationStatus({
      status: "idle",
      message: "Upload a background image to get started",
    });
    setIsComparing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async () => {
    if (!replacedImageUrl) return;

    try {
      const response = await fetch(replacedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `background-replaced-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const getStatusColor = () => {
    switch (transformationStatus.status) {
      case "processing":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <MdImage className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Background Replacement
              </h2>
              <p className="text-sm text-gray-600">
                Replace the background of your image with AI
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <MdClose className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4">
          {/* Status */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {transformationStatus.status === "processing" && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {transformationStatus.message}
              </span>
            </div>
          </div>

          {/* Background Upload Section */}
          <div className="mb-4">
            <Label className="text-base font-semibold mb-2 block">
              Upload Background Image
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="hidden"
                id="background-upload"
              />
              <label
                htmlFor="background-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <div className="p-2 bg-blue-100 rounded-full">
                  <MdCloudUpload className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {backgroundImage
                      ? backgroundImage.name
                      : "Choose background image"}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                </div>
              </label>
            </div>
          </div>

          {/* Image Preview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Original Image */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">
                Original Image
              </Label>
              <div className="relative aspect-square w-full border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <Image
                  src={originalImageUrl}
                  alt="Original"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Background Image */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">
                Background
              </Label>
              <div className="relative aspect-square w-full border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {backgroundImageUrl ? (
                  <Image
                    src={backgroundImageUrl}
                    alt="Background"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MdImage className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">
                        No background selected
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Result Image */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">
                Result
              </Label>
              <div className="relative aspect-square w-full border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {replacedImageUrl ? (
                  <Image
                    src={replacedImageUrl}
                    alt="Result"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MdAutoAwesome className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">
                        {transformationStatus.status === "processing"
                          ? "Processing..."
                          : "Result will appear here"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={handleReplacement}
              disabled={
                !backgroundImage ||
                !originalImageUrl ||
                transformationStatus.status === "processing"
              }
              size="sm"
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700"
            >
              <MdAutoAwesome className="w-3 h-3" />
              <span className="text-sm">
                {transformationStatus.status === "processing"
                  ? "Processing..."
                  : "Replace Background"}
              </span>
            </Button>

            {replacedImageUrl && (
              <>
                <Button
                  onClick={handleUseReplaced}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <MdAutoAwesome className="w-3 h-3" />
                  <span className="text-sm">Use This Image</span>
                </Button>

                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <MdDownload className="w-3 h-3" />
                  <span className="text-sm">Download</span>
                </Button>

                <Button
                  onClick={() => setIsComparing(!isComparing)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <MdCompareArrows className="w-3 h-3" />
                  <span className="text-sm">
                    {isComparing ? "Stop Compare" : "Compare"}
                  </span>
                </Button>
              </>
            )}

            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <MdRefresh className="w-3 h-3" />
              <span className="text-sm">Reset</span>
            </Button>
          </div>

          {/* Comparison View */}
          {isComparing && replacedImageUrl && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Before vs After Comparison
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Original</Label>
                  <div className="relative aspect-video w-full border border-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={originalImageUrl}
                      alt="Original"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">
                    With New Background
                  </Label>
                  <div className="relative aspect-video w-full border border-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={replacedImageUrl}
                      alt="Background Replaced"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackgroundReplacement;
