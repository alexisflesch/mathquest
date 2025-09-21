import path from "path";
import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';

const isLightBuild = process.env.LIGHT_BUILD === '1';
const isAnalyze = process.env.ANALYZE === 'true';

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
                source: '/sw.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' },
                ],
            },
            {
                source: '/sw-v2.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' },
                ],
            },
            {
                source: '/sw-v3.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' },
                ],
            },
            {
                source: '/workbox-:hash.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' },
                ],
            },
        ];
    },
};

export default withBundleAnalyzer({
    enabled: isAnalyze,
})(withPWA({
    dest: 'public',
    // Re-enable SW registration in production; disabled in development
    register: process.env.NODE_ENV !== 'development',
    sw: 'sw-v3.js',
    // Avoid caching the start URL and prevent external workbox imports
    cacheStartUrl: false,
    workboxOptions: {
        inlineWorkboxRuntime: true, // Inline workbox runtime to avoid external imports
        importScripts: [], // Prevent external workbox script imports
        skipWaiting: true, // Force new service worker to activate immediately
        clientsClaim: true, // Take control of all clients immediately
        runtimeCaching: [
            {
                // Do not have SW intercept HTML navigations
                urlPattern: ({ request }) => request.mode === 'navigate',
                handler: 'NetworkOnly',
                options: { cacheName: 'html-pages' },
            },
            {
                // Cache start URL with NetworkFirst strategy
                urlPattern: '/',
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'start-url',
                    plugins: [
                        {
                            cacheWillUpdate: async ({ response }) => {
                                // Only cache successful responses
                                return response.status === 200 ? response : null;
                            },
                        },
                    ],
                },
            },
        ],
        cleanupOutdatedCaches: true, // Clean up old cache versions
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024, // 2MB limit per file
    },
})(nextConfig));
