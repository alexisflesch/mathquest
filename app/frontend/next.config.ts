import path from "path";
import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

const isLightBuild = process.env.LIGHT_BUILD === '1';
const nextConfig: NextConfig = {
    eslint: isLightBuild ? { ignoreDuringBuilds: true } : { 
        dirs: ['.'],
        // Only show errors, not warnings during build
        ignoreDuringBuilds: false
    },
    typescript: isLightBuild ? { ignoreBuildErrors: true } : {},
    // // Set default port to 3008
    // devServer: {
    //     port: 3008,
    // },
    webpack: (config) => {
        config.resolve.alias["@"] = path.resolve(__dirname, "src");
        config.resolve.alias["@logger"] = path.resolve(__dirname, "../shared/logger.ts");
        config.resolve.alias["@components"] = path.resolve(__dirname, "src/components");
        config.resolve.alias["@shared"] = path.resolve(__dirname, "../shared");
        // Add missing aliases for build
        config.resolve.alias["@db"] = path.resolve(__dirname, "../backend-backup/db/index.ts");
        config.resolve.alias["@/app/utils/usernameFilter"] = path.resolve(__dirname, "src/app/utils/usernameFilter.ts");
        return config;
    },
    outputFileTracingRoot: path.join(__dirname, '..'), // Point to the monorepo root (app/)
    experimental: {
    },
};

export default withPWA({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
})(nextConfig);
