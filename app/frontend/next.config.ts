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

// Configure PWA with next-pwa
const withPWA = withPWAInit({
    dest: "public",
    disable: isDev, // Disable PWA in development
    register: true,
    sw: "sw.js",
    reloadOnOnline: true,
    cacheOnFrontEndNav: false, // Disable navigation caching to avoid _ref bug
    cacheStartUrl: false, // Disable the problematic start-url caching that causes _ref error
    workboxOptions: {
        // Override the default start-url route that has the broken plugin
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'google-fonts-webfonts',
                    expiration: {
                        maxEntries: 4,
                        maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
                    },
                },
            },
            {
                urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'google-fonts-stylesheets',
                    expiration: {
                        maxEntries: 4,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    },
                },
            },
            {
                urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'static-font-assets',
                    expiration: {
                        maxEntries: 4,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    },
                },
            },
            {
                urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'static-image-assets',
                    expiration: {
                        maxEntries: 64,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                    },
                },
            },
            {
                urlPattern: /\/_next\/static.+\.js$/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'next-static-js-assets',
                    expiration: {
                        maxEntries: 64,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: /\/_next\/image\?url=.+$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'next-image',
                    expiration: {
                        maxEntries: 64,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: /\.(?:mp3|wav|ogg)$/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'static-audio-assets',
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: /\.(?:mp4|webm)$/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'static-video-assets',
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: /\.(?:js)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'static-js-assets',
                    expiration: {
                        maxEntries: 48,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: /\.(?:css|less)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'static-style-assets',
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'next-data',
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: /\.(?:json|xml|csv)$/i,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'static-data-assets',
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: ({ url, sameOrigin }) => {
                    return sameOrigin && url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth/callback');
                },
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'apis',
                    networkTimeoutSeconds: 10,
                    expiration: {
                        maxEntries: 16,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: ({ request, url, sameOrigin }) => {
                    return (
                        request.headers.get('RSC') === '1' &&
                        request.headers.get('Next-Router-Prefetch') === '1' &&
                        sameOrigin &&
                        !url.pathname.startsWith('/api/')
                    );
                },
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'pages-rsc-prefetch',
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: ({ request, url, sameOrigin }) => {
                    return (
                        request.headers.get('RSC') === '1' &&
                        sameOrigin &&
                        !url.pathname.startsWith('/api/')
                    );
                },
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'pages-rsc',
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: ({ url, sameOrigin }) => {
                    return sameOrigin && !url.pathname.startsWith('/api/');
                },
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'pages',
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    },
                },
            },
            {
                urlPattern: ({ sameOrigin }) => !sameOrigin,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'cross-origin',
                    networkTimeoutSeconds: 10,
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 60 * 60, // 1 hour
                    },
                },
            },
        ],
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
