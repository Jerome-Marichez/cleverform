import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build "standalone" -> image Docker légère et portable (anti vendor lock-in).
  output: "standalone",
};

export default nextConfig;
