import path from "path";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const isLightBuild = process.env.LIGHT_BUILD === '1';
const isAnalyze = process.env.ANALYZE === 'true';
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
    eslint: isLightBuild ? { ignoreDuringBuilds: true } : {
        dirs: ['src', 'middleware.ts', 'next-env.d.ts'], // Exclude test files from ESLint during build
        // Only show errors, not warnings during build
        ignoreDuringBuilds: false
    },
    typescript: isLightBuild ? { ignoreBuildErrors: true } : {},

    // Memory optimizations for low-memory environments
    ...(isLightBuild && {
        compiler: {
            removeConsole: false, // Skip console removal to save processing
        },
    }),

    webpack: (config, { dev, isServer }) => {
        config.resolve.alias["@"] = path.resolve(__dirname, "src");
        config.resolve.alias["@components"] = path.resolve(__dirname, "src/components");
        config.resolve.alias["@shared"] = path.resolve(__dirname, "../shared");

        // Memory optimizations for light builds
        if (isLightBuild) {
            // Reduce parallelism to use less memory
            config.parallelism = 1;

            // Disable some optimizations that use more memory
            config.optimization = {
                ...config.optimization,
                moduleIds: 'named', // Use simpler module IDs
                chunkIds: 'named',  // Use simpler chunk IDs
            };

            // Reduce bundle analysis overhead
            if (!dev && !isServer) {
                config.optimization.splitChunks = {
                    chunks: 'all',
                    cacheGroups: {
                        default: {
                            minChunks: 2,
                            chunks: 'all',
                            enforce: true,
                        },
                    },
                };
            }
        }

        return config;
    },
    outputFileTracingRoot: path.join(__dirname, '..'), // Point to the monorepo root (app/)
    experimental: {
    },
    async headers() {
        return [
            {
                source: '/_next/static/:path*/_buildManifest.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' },
                ],
            },
            {
                source: '/_next/static/:path*/_ssgManifest.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' },
                ],
            },
        ];
    },
};

// Configure PWA with next-pwa (minimal, injectManifest to avoid known _ref bug)
const withPWA = withPWAInit({
    dest: "public",
    disable: isDev, // Disable PWA in development
    register: true,
    sw: "sw.js",
    reloadOnOnline: true,
    customWorkerSrc: 'src/sw',
    cacheOnFrontEndNav: false,
    cacheStartUrl: false,
    fallbacks: {
        document: '/offline.html',
    },
    workboxOptions: {
        // Disable library-added runtime routes to avoid the _ref bug; our custom SW controls behavior
        runtimeCaching: [],
        disableDevLogs: true,
    },
});

// Conditionally apply PWA plugin only in production
let finalConfig = withPWA(nextConfig);

if (isAnalyze) {
    const withBundleAnalyzer = require('@next/bundle-analyzer');
    finalConfig = withBundleAnalyzer({
        enabled: true,
    })(finalConfig);
}

export default finalConfig;
