"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/app/loading";
import { handleGetCompletedProjects } from "@/lib/api";
import { IoMdDownload, IoMdPlay, IoMdPause } from "react-icons/io";
import { MdDateRange, MdVideoLibrary } from "react-icons/md";
import { HiOutlineExternalLink } from "react-icons/hi";

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

interface VideoCardProps {
  project: Project;
  videoUrl: string;
}

const VideoCard: React.FC<VideoCardProps> = ({ project, videoUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const handlePlayPause = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative aspect-video bg-gray-100">
        <video
          ref={setVideoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          poster="" // You can add a thumbnail if available
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={handlePlayPause}
            className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all duration-200 transform hover:scale-110"
          >
            {isPlaying ? (
              <IoMdPause className="text-2xl text-gray-800" />
            ) : (
              <IoMdPlay className="text-2xl text-gray-800 ml-1" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-800 truncate">
            {project.name || `Project ${project.id.slice(0, 8)}`}
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <MdDateRange className="mr-1" />
            {formatDate(project.updatedAt)}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <MdVideoLibrary className="mr-1" />
            <span>{project.media.length} files</span>
          </div>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Completed
          </span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-colors duration-200"
          >
            <IoMdDownload className="mr-2" />
            Download
          </button>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-lg transition-colors duration-200"
          >
            <HiOutlineExternalLink className="text-lg" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default function GalleryPage() {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <p className="text-gray-600">Please log in to view your gallery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Video Gallery</h1>
        <p className="text-gray-600">
          Browse your completed AI portrait videos
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
              Error Loading Gallery
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
              You haven't completed any video projects yet. Start creating your
              first AI portrait video!
            </p>
            <a
              href="/user/generate"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              Create Your First Video
            </a>
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
                <VideoCard
                  key={project.id}
                  project={project}
                  videoUrl={videoMedia.url}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
