import type { NextConfig } from "next";

// Mode "standalone" activé uniquement pour le build Docker (image légère et portable,
// anti vendor lock-in) ; en local on garde un build / `next start` standard.
const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
};

export default nextConfig;
