import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/risk", destination: "/", permanent: false },
      { source: "/social", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
