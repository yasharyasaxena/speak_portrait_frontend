"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/app/loading";
import { handleGetCompletedProjects } from "@/lib/api";
import { IoMdDownload, IoMdPlay, IoMdClose } from "react-icons/io";
import { MdDateRange, MdVideoLibrary, MdInfo } from "react-icons/md";
import { HiOutlineExternalLink } from "react-icons/hi";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  media: {
    id: string;
    fileName: string;
    fileType: "IMAGE" | "AUDIO" | "VIDEO";
    url: string;
    createdAt: string;
  }[];
}

interface ExpandableCardProps {
  project: Project;
  videoUrl: string;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  layoutId: string;
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({
  project,
  videoUrl,
  isExpanded,
  onExpand,
  onCollapse,
  layoutId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        onCollapse();
      }
    };

    if (isExpanded) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (!isExpanded) {
        document.body.style.overflow = "unset";
      }
    };
  }, [isExpanded, onCollapse]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `${project.name || project.id}-video.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const cardContent = (
    <>
      <div className="relative aspect-video bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          poster=""
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onClick={!isExpanded ? onExpand : handlePlayPause}
          controls={isExpanded}
          muted={!isExpanded}
        />

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Play button overlay - only show when not expanded */}
        {!isExpanded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={onExpand}
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full p-4 transition-all duration-300 transform hover:scale-110 border border-white/20"
            >
              <IoMdPlay className="text-3xl text-white ml-1" />
            </button>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-emerald-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium border border-white/20">
            ✓ Complete
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">
              {project.name || `Project ${project.id.slice(0, 8)}`}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2 flex items-center">
              <MdDateRange className="mr-2 text-neutral-500" />
              {formatDate(project.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          <div className="flex items-center">
            <MdVideoLibrary className="mr-2" />
            <span>{project.media.length} media files</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
            Ready
          </div>
        </div>

        {/* Quick action buttons for collapsed state */}
        {!isExpanded && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(e);
              }}
              className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <IoMdDownload className="mr-1" />
              Download
            </button>
            <Link
              href={`/user/gallery/${project.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <MdInfo className="text-lg" />
            </Link>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center bg-neutral-600 hover:bg-neutral-700 text-white py-2 px-3 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <HiOutlineExternalLink className="text-lg" />
            </a>
          </div>
        )}
      </div>
    </>
  );

  if (isExpanded) {
    return (
      <>
        {/* Backdrop with blur */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-all duration-300"
          onClick={onCollapse}
        />

        {/* Expanded card */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div
            className="w-full max-w-5xl h-full max-h-[95vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-out transform flex flex-col"
            style={{
              animation: "expandIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Close button */}
            <button
              onClick={onCollapse}
              className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white rounded-full p-2 transition-all duration-200 border border-white/20"
            >
              <IoMdClose className="text-xl" />
            </button>

            {/* Video Section - Takes most space */}
            <div className="flex-1 p-6 min-h-0">
              <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  controls
                  autoPlay={false}
                />
              </div>
            </div>

            {/* Content Section - Scrollable if needed */}
            <div className="flex-shrink-0 max-h-64 overflow-y-auto">
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-4">
                    <h3 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">
                      {project.name || `Project ${project.id.slice(0, 8)}`}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2 flex items-center">
                      <MdDateRange className="mr-2 text-neutral-500" />
                      Created: {formatDate(project.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                  <div className="flex items-center">
                    <MdVideoLibrary className="mr-2" />
                    <span>{project.media.length} media files</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    Ready
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <IoMdDownload className="mr-2" />
                    Download Video
                  </button>
                  <Link
                    href={`/user/gallery/${project.id}`}
                    className="flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <MdInfo className="mr-2" />
                    Project Details
                  </Link>
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center bg-neutral-600 hover:bg-neutral-700 text-white px-6 py-3 rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <HiOutlineExternalLink className="mr-2" />
                    Open in New Tab
                  </a>
                </div>

                {/* Project details */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Created:
                      </span>
                      <p className="font-medium text-neutral-700 dark:text-neutral-300">
                        {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Last Updated:
                      </span>
                      <p className="font-medium text-neutral-700 dark:text-neutral-300">
                        {formatDate(project.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transform hover:-translate-y-1 hover:scale-[1.02]"
      onClick={onExpand}
    >
      {cardContent}
    </div>
  );
};

export default function Dashboard() {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expandable card state
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const handleCardExpand = (projectId: string) => {
    setExpandedCardId(projectId);
  };

  const handleCardCollapse = () => {
    setExpandedCardId(null);
  };

  useEffect(() => {
    const fetchCompletedProjects = async () => {
      if (currentUser) {
        try {
          setIsLoading(true);
          setError(null);
          const completedProjects = await handleGetCompletedProjects(
            currentUser
          );
          console.log("Completed projects:", completedProjects);

          // Ensure we have an array of projects
          const projectsArray = Array.isArray(completedProjects)
            ? completedProjects
            : [completedProjects].filter(Boolean);

          setProjects(projectsArray);
        } catch (error) {
          console.error("Error fetching completed projects:", error);
          setError("Failed to load completed projects. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCompletedProjects();
  }, [currentUser]);

  // Get projects with videos
  const projectsWithVideos = projects.filter((project) =>
    project.media.some((media) => media.fileType === "VIDEO")
  );

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-4">
          Welcome to your dashboard! Here you can manage your AI portrait
          generation and view your gallery.
        </p>
      </div>

      {/* All Videos Section */}
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-950 dark:to-neutral-900 rounded-lg p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800 dark:from-neutral-200 dark:via-neutral-400 dark:to-neutral-200 bg-clip-text text-transparent mb-4">
            All Videos
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Browse all your completed AI portrait videos
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading your videos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Error Loading Videos
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : projectsWithVideos.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="text-gray-400 text-6xl mb-4">🎬</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                No Videos Yet
              </h2>
              <p className="text-gray-600 mb-6">
                You haven&apos;t completed any video projects yet. Start
                creating your first AI portrait video!
              </p>
              <Link
                href="/user/generate"
                className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
              >
                Create Your First Video
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Showing {projectsWithVideos.length} completed video
                {projectsWithVideos.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Sort by:</span>
                <select className="border border-gray-300 rounded px-2 py-1 text-gray-700">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projectsWithVideos.map((project) => {
                const videoMedia = project.media.find(
                  (media) => media.fileType === "VIDEO"
                );
                if (!videoMedia) return null;

                return (
                  <ExpandableCard
                    key={project.id}
                    project={project}
                    videoUrl={videoMedia.url}
                    isExpanded={expandedCardId === project.id}
                    onExpand={() => handleCardExpand(project.id)}
                    onCollapse={handleCardCollapse}
                    layoutId={`card-${project.id}`}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
