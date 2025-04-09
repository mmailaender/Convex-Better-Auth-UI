import type { NextConfig } from "next";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

const nextConfig: NextConfig = {
  images: convexUrl
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: convexUrl.replace("https://", ""),
          },
        ],
      }
    : {},
};

export default nextConfig;
