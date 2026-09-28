import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, which silently rejects fresh camera photos. Vercel
      // itself caps request bodies at ~4.5MB, so stay safely under that;
      // chat photos/voice go straight to storage and never hit this limit.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
