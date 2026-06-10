import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/risk", destination: "/", permanent: false },
      { source: "/social", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
