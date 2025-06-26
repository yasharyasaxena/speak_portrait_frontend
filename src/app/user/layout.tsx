"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Loading from "../loading";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex h-[90vh]">
      <Sidebar videos={[]} />
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
    </div>
  );
}
