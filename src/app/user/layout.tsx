"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Loading from "../loading";
import { handleGetCompletedProjects } from "@/lib/api";

interface Project {
  id: string;
  name: string;
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setIsLoading(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (currentUser) {
        try {
          const completedProjects = await handleGetCompletedProjects(
            currentUser
          );
          const projectsArray = Array.isArray(completedProjects)
            ? completedProjects
            : [completedProjects].filter(Boolean);

          // Extract id and name from projects
          const projectsList = projectsArray.map((project: any) => ({
            id: project.id,
            name: project.name,
          }));

          setProjects(projectsList);
        } catch (error) {
          console.error("Error fetching projects for sidebar:", error);
          setProjects([]);
        }
      }
    };

    fetchProjects();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex h-[90vh]">
      <Sidebar projects={projects} />
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
    </div>
  );
}
