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
        config.resolve.alias["@logger"] = path.resolve(__dirname, "../shared/logger.ts");
        config.resolve.alias["@components"] = path.resolve(__dirname, "src/components");
        config.resolve.alias["@shared"] = path.resolve(__dirname, "../shared");
        return config;
    },
    outputFileTracingRoot: path.join(__dirname, '..'), // Point to the monorepo root (app/)
    experimental: {
    },
};

export default nextConfig;
