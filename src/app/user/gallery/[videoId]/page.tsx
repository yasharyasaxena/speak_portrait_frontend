"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/app/loading";
import { getProjectById, updateProjectName, handleGetVideoUrl } from "@/lib/api";
import { generateVideoS3Url } from "@/lib/utils";
import {
  IoMdDownload,
  IoMdPlay,
  IoMdPause,
  IoMdSave,
  IoMdClose,
  IoMdArrowBack,
} from "react-icons/io";
import { MdEdit } from "react-icons/md";
import {
  MdDateRange,
  MdVideoLibrary,
  MdImage,
  MdAudiotrack,
  MdMovie,
} from "react-icons/md";
import { HiOutlineExternalLink } from "react-icons/hi";
import { FaFileAlt } from "react-icons/fa";
import Image from "next/image";

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  media: {
    id: string;
    fileName: string;
    fileType: "IMAGE" | "AUDIO" | "VIDEO";
    url: string;
    createdAt: string;
  }[];
}

interface MediaItemProps {
  media: Project["media"][0];
  projectName: string;
  processedUrl?: string;
}

const MediaItem: React.FC<MediaItemProps> = ({ media, projectName, processedUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Use processed URL if available, otherwise fall back to original URL
  const actualUrl = processedUrl || media.url;

  const formatFileSize = (url: string) => {
    // This is a placeholder - in a real app you'd get this from the API
    return "~2.5 MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = actualUrl;
    link.download = `${projectName}-${media.fileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMediaIcon = () => {
    switch (media.fileType) {
      case "IMAGE":
        return <MdImage className="text-2xl text-blue-500" />;
      case "AUDIO":
        return <MdAudiotrack className="text-2xl text-green-500" />;
      case "VIDEO":
        return <MdMovie className="text-2xl text-purple-500" />;
      default:
        return <FaFileAlt className="text-2xl text-gray-500" />;
    }
  };

  const getMediaTypeColor = () => {
    switch (media.fileType) {
      case "IMAGE":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "AUDIO":
        return "bg-green-50 border-green-200 text-green-800";
      case "VIDEO":
        return "bg-purple-50 border-purple-200 text-purple-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-neutral-200 overflow-hidden">
      {/* Media Preview */}
      <div className="relative aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200">
        {media.fileType === "IMAGE" && (
          <div className="relative w-full h-full">
            <Image
              src={actualUrl}
              alt={media.fileName}
              fill
              className="object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => setShowPreview(true)}
            />
            <div className="absolute inset-0 bg-black opacity-0 hover:opacity-30 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white font-medium">Click to preview</span>
            </div>
          </div>
        )}
        
        {media.fileType === "AUDIO" && (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-100 to-green-200">
            <div className="text-center">
              <MdAudiotrack className="text-6xl text-green-600 mx-auto mb-2" />
              <audio
                src={actualUrl}
                controls
                className="w-full max-w-xs"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          </div>
        )}

        {media.fileType === "VIDEO" && (
          <div className="relative w-full h-full">
            <video
              src={actualUrl}
              className="w-full h-full object-cover cursor-pointer"
              poster=""
              muted
              preload="metadata"
              onClick={() => setShowPreview(true)}
              onError={(e) => {
                console.error("Video error:", e);
                console.error("Video URL:", actualUrl);
              }}
              onLoadStart={() => {
                console.log("Video loading started:", actualUrl);
              }}
            />
            <div className="absolute inset-0 bg-black opacity-0 hover:opacity-30 transition-opacity duration-300 flex items-center justify-center">
              <IoMdPlay className="text-white text-4xl" />
            </div>
          </div>
        )}        {/* File type badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getMediaTypeColor()}`}
          >
            {media.fileType}
          </span>
        </div>
      </div>

      {/* Media Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getMediaIcon()}
            <div>
              <h3 className="font-medium text-gray-800 truncate max-w-48">
                {media.fileName}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(media.url)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center">
            <MdDateRange className="mr-1" />
            {formatDate(media.createdAt)}
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Ready
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <IoMdDownload className="mr-1" />
            Download
          </button>
          <a
            href={actualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-lg transition-colors duration-200"
          >
            <HiOutlineExternalLink className="text-lg" />
          </a>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors duration-200"
            >
              <IoMdClose className="text-xl" />
            </button>

            {media.fileType === "IMAGE" && (
              <div className="relative w-full h-full">
                <Image
                  src={actualUrl}
                  alt={media.fileName}
                  width={1200}
                  height={800}
                  className="object-contain w-full h-full rounded-lg"
                />
              </div>
            )}

            {media.fileType === "VIDEO" && (
              <video
                src={actualUrl}
                controls
                autoPlay
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  console.error("Preview video error:", e);
                  console.error("Preview video URL:", actualUrl);
                }}
                onLoadStart={() => {
                  console.log("Preview video loading started:", actualUrl);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [processedMediaUrls, setProcessedMediaUrls] = useState<{ [key: string]: string }>({});

  const projectId = params.videoId as string;

  const processMediaUrls = async (project: Project) => {
    const urlMap: { [key: string]: string } = {};
    
    for (const media of project.media) {
      if (media.fileType === "VIDEO") {
        try {
          // Try to get a signed URL from the API
          console.log("Getting signed URL for video:", media.fileName);
          const videoResponse = await handleGetVideoUrl(currentUser!, project.id);
          if (videoResponse && videoResponse.url) {
            urlMap[media.id] = videoResponse.url;
            console.log("Got signed URL:", videoResponse.url);
          } else {
            // Fallback to generating S3 URL
            console.log("Generating S3 URL for:", media.fileName);
            urlMap[media.id] = generateVideoS3Url(currentUser!.uid, project.id, media.fileName);
          }
        } catch (error) {
          console.error("Error getting video URL for", media.fileName, error);
          // Use the original URL as fallback
          urlMap[media.id] = media.url;
        }
      } else {
        // For non-video files, use the original URL
        urlMap[media.id] = media.url;
      }
    }
    
    setProcessedMediaUrls(urlMap);
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (currentUser && projectId) {
        try {
          setIsLoading(true);
          setError(null);
          const projectData = await getProjectById(currentUser, projectId);
          console.log("Project data:", projectData);
          console.log("Project media URLs:", projectData.media?.map((m: any) => ({ type: m.fileType, url: m.url })));
          setProject(projectData);
          setNewProjectName(
            projectData.name || `Project ${projectData.id.slice(0, 8)}`
          );
          
          // Process media URLs to get proper signed URLs for videos
          await processMediaUrls(projectData);
        } catch (error) {
          console.error("Error fetching project:", error);
          setError("Failed to load project details. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProject();
  }, [currentUser, projectId]);

  const handleUpdateProjectName = async () => {
    if (!currentUser || !project || !newProjectName.trim()) return;

    try {
      setIsUpdatingName(true);
      await updateProjectName(currentUser, project.id, newProjectName.trim());
      setProject({ ...project, name: newProjectName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating project name:", error);
      setError("Failed to update project name. Please try again.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Please log in to view project details.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading project details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Error Loading Project
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.back()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const imageAssets = project.media.filter((m) => m.fileType === "IMAGE");
  const audioAssets = project.media.filter((m) => m.fileType === "AUDIO");
  const videoAssets = project.media.filter((m) => m.fileType === "VIDEO");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-neutral-600 hover:text-neutral-800 mr-4 transition-colors duration-200"
            >
              <IoMdArrowBack className="text-xl mr-1" />
              Back to Gallery
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 mr-4">
                {/* Project Name */}
                {isEditingName ? (
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="text-3xl font-bold text-neutral-800 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-700 flex-1"
                      autoFocus
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleUpdateProjectName()
                      }
                    />
                    <button
                      onClick={handleUpdateProjectName}
                      disabled={isUpdatingName || !newProjectName.trim()}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors duration-200"
                    >
                      {isUpdatingName ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <IoMdSave className="text-lg" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setNewProjectName(
                          project.name || `Project ${project.id.slice(0, 8)}`
                        );
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200"
                    >
                      <IoMdClose className="text-lg" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 mb-4">
                    <h1 className="text-3xl font-bold text-neutral-800">
                      {project.name || `Project ${project.id.slice(0, 8)}`}
                    </h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-200"
                    >
                      <MdEdit className="text-lg" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">Project ID:</span>
                    <p className="font-mono text-neutral-700">{project.id}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Created:</span>
                    <p className="text-neutral-700">
                      {formatDate(project.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Last Updated:</span>
                    <p className="text-neutral-700">
                      {formatDate(project.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(
                    project.status
                  )}`}
                >
                  {project.status || "Active"}
                </span>
                <div className="flex items-center text-sm text-neutral-500">
                  <MdVideoLibrary className="mr-1" />
                  {project.media.length} assets
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">Images</h3>
              <MdImage className="text-2xl text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {imageAssets.length}
            </div>
            <p className="text-sm text-neutral-500">
              Portrait images and processed versions
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">Audio</h3>
              <MdAudiotrack className="text-2xl text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {audioAssets.length}
            </div>
            <p className="text-sm text-neutral-500">
              Audio files and TTS generated speech
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">Videos</h3>
              <MdMovie className="text-2xl text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {videoAssets.length}
            </div>
            <p className="text-sm text-neutral-500">
              Generated AI portrait videos
            </p>
          </div>
        </div>

        {/* All Assets */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-800 mb-6">
            All Project Assets
          </h2>

          {project.media.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No Assets Found
              </h3>
              <p className="text-gray-600">
                This project doesn't have any media files yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.media.map((media) => (
                <MediaItem
                  key={media.id}
                  media={media}
                  projectName={
                    project.name || `Project ${project.id.slice(0, 8)}`
                  }
                  processedUrl={processedMediaUrls[media.id]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
