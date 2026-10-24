import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "*.localhost",
    "vn.localhost",
    "en.localhost",
    "jp.localhost",
  ],
};

export default nextConfig;

