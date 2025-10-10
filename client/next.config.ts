import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "dib3gcifsty30.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",

      },

      {
        protocol: "https",
        hostname: "commondatastorage.googleapis.com",
      },
      // Add localhost for development
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
