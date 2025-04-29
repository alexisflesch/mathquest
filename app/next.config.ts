import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ignoreDuringBuilds: true,
  },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    config.resolve.alias["@logger"] = path.resolve(__dirname, "logger.js");
    config.resolve.alias["@components"] = path.resolve(__dirname, "src/components");
    return config;
  },
};

export default nextConfig;
