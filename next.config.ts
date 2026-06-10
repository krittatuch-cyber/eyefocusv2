import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: Turbopack is disabled for Cloudflare builds via --webpack flag in build:cf script
  // output: standalone is required by @opennextjs/cloudflare to generate .next/standalone
  output: "standalone",
};

export default nextConfig;
