"use client";
import Image from "next/image";
import imgSrc from "../../../public/Gradient.png";
import { LoginForm } from "@/components/login-form";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "../loading";

export default function Page() {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const query = useSearchParams();
  const register = query.get("register") === "true";
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/user/dashboard");
    }
  }, [isAuthenticated, router]);

  if (loading || isAuthenticated) {
    return <Loading />;
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="z-0 w-1/2 relative">
        <h1 className="text-6xl z-10 font-serif font-light leading-tight text-left absolute top-1/2 left-1/2 w-3/4 max-w-xl transform -translate-x-1/2 -translate-y-1/2 drop-shadow-lg bg-gradient-to-b from-white via-white/80 to-white/60 bg-clip-text text-transparent">
          Welcome.
          <br />
          <span className="font-normal">
            Start your journey now with the{" "}
            <span className="font-bold">SpeakPortrait</span> App
          </span>
        </h1>
        <Image src={imgSrc} alt="" className="bg-[#050A24] h-screen" />
      </div>
      <div className="w-1/2">
        <div className="flex h-full items-center justify-center">
          <LoginForm register={register} />
        </div>
      </div>
    </div>
  );
}
