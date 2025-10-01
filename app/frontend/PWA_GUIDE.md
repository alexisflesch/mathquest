# Kutsum PWA (Progressive Web App)

Kutsum (formerly MathQuest) is now a fully functional Progressive Web App! This means users can install it on their devices and use it offline.

## Features

### ✅ Installable
- Users can install Kutsum on their desktop, mobile, or tablet
- Works like a native app with its own icon and window
- No need to go through app stores

### ✅ Offline Support
- Service worker caches essential resources
- App shell remains available offline
- Graceful degradation when network is unavailable

### ✅ Fast Loading
- Smart caching strategies for optimal performance
- Static assets cached with StaleWhileRevalidate
- API calls use NetworkFirst with fallback

### ✅ App-like Experience
- Standalone display mode (no browser UI)
- Custom theme colors
- Optimized for mobile and desktop

## Installation

### For Users

#### Desktop (Chrome/Edge)
1. Visit Kutsum in Chrome or Edge
2. Look for the install button (⊕) in the address bar
3. Click "Install" in the prompt
4. Kutsum will open in its own window

#### Mobile (Android)
1. Open Kutsum in Chrome
2. Tap the menu (⋮) and select "Add to Home screen" or "Install app"
3. Confirm installation
4. Launch from your home screen

#### iOS (iPhone/iPad)
1. Open Kutsum in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Name it "Kutsum" and tap "Add"
5. Launch from your home screen

## Technical Implementation

### Files Created/Modified

#### 1. `public/manifest.json`
Web app manifest defining app metadata, icons, and display settings.

```json
{
  "name": "Kutsum",
  "short_name": "Kutsum",
  "description": "L'appli de révisions qui n'en fait qu'à sa tête",
  "display": "standalone",
  "theme_color": "#3b82f6",
  ...
}
```

#### 2. `next.config.ts`
PWA configuration using `@ducanh2912/next-pwa`:

```typescript
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: isDev,
  register: true,
  sw: "sw.js",
  reloadOnOnline: true,
});
```

#### 3. `src/app/layout.tsx`
Added PWA meta tags and manifest link:

```typescript
export const metadata: Metadata = {
  manifest: '/manifest.json',
  icons: {
    apple: [{ url: '/icon-192.png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Kutsum',
  },
};
```

### Generated Files

#### `public/sw.js`
Service worker file (auto-generated during build):
- Handles caching strategies
- Manages offline functionality
- Updates automatically

#### `public/workbox-*.js`
Workbox library (auto-generated):
- Provides caching utilities
- Implements routing strategies

## Caching Strategies

### StaleWhileRevalidate
Used for fonts, images, CSS, and JS:
- Serves cached version immediately
- Updates cache in background
- Always fast, always fresh

### NetworkFirst
Used for API calls and HTML pages:
- Tries network first
- Falls back to cache if offline
- Timeout: 10 seconds

### CacheFirst
Used for external fonts (Google Fonts):
- Serves from cache if available
- Only fetches once
- Maximum efficiency

## Testing PWA

### 1. Build Production Version
```bash
cd app/frontend
npm run build
npm start
```

### 2. Test Installation
- Open http://localhost:3008 in Chrome
- Check for install prompt in address bar
- Install and verify it opens in standalone window

### 3. Test Offline Mode
- Open Chrome DevTools (F12)
- Go to Application tab → Service Workers
- Check "Offline" checkbox
- Navigate the app - basic pages should still work

### 4. Lighthouse PWA Audit
```bash
# Open Chrome DevTools (F12)
# Go to Lighthouse tab
# Select "Progressive Web App" category
# Click "Generate report"
# Target: 90+ score
```

### 5. Manifest Validation
- Chrome DevTools → Application → Manifest
- Verify all icons load correctly
- Check theme color is applied
- Verify shortcuts appear

## Troubleshooting

### Service Worker Not Registering
1. Check browser console for errors
2. Verify you're on HTTPS or localhost
3. Clear browser cache and hard reload (Ctrl+Shift+R)
4. Check Service Workers in DevTools Application tab

### Icons Not Showing
1. Verify icon files exist in `public/` folder
2. Check manifest.json paths are correct
3. Clear browser cache
4. Uninstall and reinstall PWA

### Offline Mode Not Working
1. Verify service worker is registered
2. Check network tab in DevTools
3. Ensure resources are being cached
4. Try hard reload to update service worker

### Updates Not Appearing
Service workers cache aggressively. To force an update:
1. Increment version in manifest.json
2. Rebuild: `npm run build`
3. Clear Application → Storage in DevTools
4. Hard reload the page

## Development

### Disable PWA in Development
PWA is automatically disabled in development mode (`NODE_ENV=development`) to avoid caching issues.

### Test PWA Locally
```bash
# Build production version
npm run build

# Start in production mode
npm start

# Access at http://localhost:3008
```

### Update Caching Strategy
Edit `next.config.ts` and modify the `workboxOptions.runtimeCaching` array.

## Performance Benefits

- **First Load**: Service worker caches app shell
- **Repeat Visits**: Instant load from cache
- **Offline**: Core functionality remains available
- **Updates**: Background sync when online

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile): Full support
- ✅ Firefox (Desktop & Mobile): Full support
- ✅ Safari (Desktop): Full support
- ⚠️ Safari (iOS): Install works, some PWA features limited
- ❌ IE11: Not supported (Next.js 15 requirement)

## Future Enhancements

Potential PWA improvements:
- [ ] Background sync for offline quiz submissions
- [ ] Push notifications for quiz invitations
- [ ] Periodic background sync for leaderboard updates
- [ ] Share target API for sharing quiz codes
- [ ] Install promotion banner for first-time users

## Resources

- [Next PWA Documentation](https://ducanh-next-pwa.vercel.app/)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [PWA Builder](https://www.pwabuilder.com/)

---

**Note**: Remember to test PWA functionality on actual devices, as DevTools simulation may not reflect real-world behavior perfectly.