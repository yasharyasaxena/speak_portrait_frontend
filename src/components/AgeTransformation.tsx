"use client";
import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  handleAgeTransformationWebSocket,
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
} from "react-icons/md";
import Image from "next/image";

interface AgeTransformationProps {
  originalImageUrl: string;
  projectId?: string;
  onTransformationComplete?: (transformedImageUrl: string) => void;
  onClose?: () => void;
}

interface TransformationStatus {
  status: "idle" | "processing" | "completed" | "error";
  message: string;
}

export default function AgeTransformation({
  originalImageUrl,
  projectId,
  onTransformationComplete,
  onClose,
}: AgeTransformationProps) {
  const { currentUser } = useAuth();
  const [targetAge, setTargetAge] = useState<number>(25);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [transformedImageUrl, setTransformedImageUrl] = useState<string | null>(
    null
  );
  const [transformationStatus, setTransformationStatus] =
    useState<TransformationStatus>({
      status: "idle",
      message: "",
    });
  const [showComparison, setShowComparison] = useState<boolean>(false);

  const handleStatusUpdate = (data: any) => {
    setTransformationStatus({
      status: data.status,
      message: data.message || "",
    });
  };

  const handleTransformation = async () => {
    if (!currentUser || !originalImageUrl) return;

    try {
      setTransformationStatus({
        status: "processing",
        message: "Connecting to age transformation service...",
      });

      const result = await handleAgeTransformationWebSocket({
        imageUrl: originalImageUrl,
        targetAge,
        onStatusUpdate: handleStatusUpdate,
      });

      const typedResult = result as { finalUrl: string };

      // Upload the transformed image to your S3 bucket
      const response = await fetch(typedResult.finalUrl);
      const blob = await response.blob();
      const file = new File(
        [blob],
        `transformed-age-${targetAge}-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
        }
      );

      const uploadData = await handleSingleUpload(file, currentUser, projectId);

      const finalTransformedUrl = uploadData.files[0].url;
      setTransformedImageUrl(finalTransformedUrl);
      setTransformationStatus({
        status: "completed",
        message: `Age transformation completed! Changed to age ${targetAge}.`,
      });

      if (onTransformationComplete) {
        onTransformationComplete(finalTransformedUrl);
      }
    } catch (error) {
      console.error("Age transformation error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Age transformation failed. Please try again.";
      setTransformationStatus({
        status: "error",
        message: errorMessage,
      });
    }
  };

  const handleUseTransformed = () => {
    if (transformedImageUrl && onTransformationComplete) {
      onTransformationComplete(transformedImageUrl);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleUseOriginal = () => {
    if (onTransformationComplete) {
      onTransformationComplete(originalImageUrl);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleReset = () => {
    setTransformedImageUrl(null);
    setTransformationStatus({
      status: "idle",
      message: "",
    });
    setTargetAge(25);
  };

  const getAgeCategory = (age: number) => {
    if (age <= 12) return "Child";
    if (age <= 17) return "Teenager";
    if (age <= 30) return "Young Adult";
    if (age <= 50) return "Adult";
    if (age <= 65) return "Middle-aged";
    return "Senior";
  };

  const getStatusIcon = () => {
    switch (transformationStatus.status) {
      case "processing":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        );
      case "completed":
        return <span className="text-green-600">✅</span>;
      case "error":
        return <span className="text-red-600">❌</span>;
      default:
        return <MdAutoAwesome className="text-purple-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <MdAutoAwesome className="text-2xl text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            Age Transformation
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MdClose className="text-xl text-gray-500" />
          </button>
        )}
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-purple-800">
              Enable Age Transformation
            </h3>
            <p className="text-sm text-purple-600">
              Transform the age of the person in your image using AI
            </p>
          </div>
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled ? "bg-purple-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {isEnabled && (
        <>
          {/* Age Selection */}
          <div className="mb-6">
            <Label className="text-sm mb-4 flex justify-between items-center">
              <span>Target Age</span>
              <div className="text-right">
                <span className="font-bold text-lg text-purple-600">
                  {targetAge}
                </span>
                <div className="text-xs text-gray-500">
                  {getAgeCategory(targetAge)}
                </div>
              </div>
            </Label>
            <Slider
              value={[targetAge]}
              onValueChange={(value) => setTargetAge(value[0])}
              max={80}
              min={5}
              step={1}
              className="mb-2"
              disabled={transformationStatus.status === "processing"}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 years</span>
              <span>80 years</span>
            </div>
          </div>

          {/* Status Display */}
          {transformationStatus.status !== "idle" && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon()}
                <span className="font-medium text-blue-800 capitalize">
                  {transformationStatus.status}
                </span>
              </div>
              {transformationStatus.message && (
                <p className="text-sm text-blue-600">
                  {transformationStatus.message}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center mb-6">
            {transformationStatus.status === "idle" && (
              <Button
                onClick={handleTransformation}
                disabled={!currentUser || !originalImageUrl}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
              >
                <MdAutoAwesome className="mr-2" />
                Transform Age to {targetAge}
              </Button>
            )}

            {transformationStatus.status === "completed" && (
              <div className="flex space-x-4">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex items-center"
                >
                  <MdRefresh className="mr-2" />
                  Try Different Age
                </Button>
                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  variant="outline"
                  className="flex items-center"
                >
                  <MdCompareArrows className="mr-2" />
                  {showComparison ? "Hide" : "Show"} Comparison
                </Button>
              </div>
            )}
          </div>

          {/* Image Display */}
          {transformedImageUrl && (
            <div className="mb-6">
              {showComparison ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <h3 className="font-medium text-gray-700 mb-3">Original</h3>
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={originalImageUrl}
                        alt="Original"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-gray-700 mb-3">
                      Transformed (Age {targetAge})
                    </h3>
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={transformedImageUrl}
                        alt="Transformed"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="font-medium text-gray-700 mb-3">
                    Transformed Result (Age {targetAge})
                  </h3>
                  <div className="relative aspect-square max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={transformedImageUrl}
                      alt="Transformed"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Final Action Buttons */}
          {transformationStatus.status === "completed" && (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleUseOriginal}
                variant="outline"
                className="px-6 py-2"
              >
                Use Original Image
              </Button>
              <Button
                onClick={handleUseTransformed}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
              >
                Use Transformed Image
              </Button>
              <a
                href={transformedImageUrl || "#"}
                download={`transformed-age-${targetAge}.jpg`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <MdDownload className="mr-2" />
                Download
              </a>
            </div>
          )}
        </>
      )}

      {!isEnabled && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">🎭</div>
          <p className="text-gray-600">
            Enable age transformation to modify the age of the person in your
            image
          </p>
          <Button
            onClick={handleUseOriginal}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            Continue with Original Image
          </Button>
        </div>
      )}
    </div>
  );
}
