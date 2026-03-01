import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Required for pdfjs-dist to work in the browser bundle
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
