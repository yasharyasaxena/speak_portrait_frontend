import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://speak-portrait.s3.ap-south-1.amazonaws.com/**"),
    ],
  },
};

export default nextConfig;
