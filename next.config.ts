import type { NextConfig } from "next";

import("@opennextjs/cloudflare").then((module) => module.initOpenNextCloudflareForDev());

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
