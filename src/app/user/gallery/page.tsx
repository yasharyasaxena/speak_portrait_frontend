"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/app/loading";

export default function GalleryPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Redirect to dashboard since "All Videos" functionality has been moved there
      router.push("/user/dashboard");
    }
  }, [isAuthenticated, loading, router]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800 dark:from-neutral-200 dark:via-neutral-400 dark:to-neutral-200 bg-clip-text text-transparent mb-4">
            Gallery
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            All video content has been moved to the Dashboard
          </p>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <div className="text-blue-500 text-6xl mb-4">📱</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Videos Moved to Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              All video content and gallery features are now available on your
              dashboard.
            </p>
            <button
              onClick={() => router.push("/user/dashboard")}
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
