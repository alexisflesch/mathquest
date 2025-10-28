/*
  Minimal custom service worker for next-pwa (injectManifest mode)
  Purpose: avoid the library-generated plugins that cause the `_ref` undefined bug.
*/

/// <reference lib="WebWorker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

// Ensure TypeScript knows about self as ServiceWorkerGlobalScope
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

self.skipWaiting();
clientsClaim();

// Injected by workbox at build time
precacheAndRoute(self.__WB_MANIFEST || []);

// Clean up old precaches
cleanupOutdatedCaches();

// Register our own start-url route early to shadow the plugin's default route
// This avoids invoking the buggy plugin-generated handler.
registerRoute('/', new NetworkFirst({ cacheName: 'start-url' }), 'GET');
