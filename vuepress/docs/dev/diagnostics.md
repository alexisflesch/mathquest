# Frontend Diagnostics Capture for Live Sessions

This page documents the opt-in diagnostics capture to help investigate intermittent crashes (e.g., STATUS_STACK_OVERFLOW) on the live game page.

## Enable diagnostics

- Append `?mqdebug=1` to any Live page URL, for example:
  - `/live/1234?mqdebug=1`
- Alternatively, set the flag persistently in the browser:
  - `localStorage.setItem('MQ_DEBUG_CAPTURE', '1')`

Enabling diagnostics will:
- Set client log level to DEBUG
- Buffer all client logs into an in-memory ring buffer
- Capture:
  - window errors and unhandled promise rejections
  - visibility/page lifecycle events (pageshow/pagehide, focus/blur)
  - online/offline network changes
  - WebSocket open/error/close (code, reason, wasClean)

Nothing is sent over the network. Data remains local to your browser until you explicitly download it.

## Download logs

1. Reproduce the issue while diagnostics is enabled.
2. Open the browser DevTools console and run:

```js
window.__mqDiag && window.__mqDiag.download && window.__mqDiag.download()
```

This downloads a `mathquest-diag-<timestamp>.json` file containing structured events. If download fails, the buffer will be printed in the console.

## Data format

The file is an array of JSON entries including:
- Logger entries: `{ ts, level, context, message, args }`
- Lifecycle entries: `{ ts, type: 'document.visibilitychange'|'window.pagehide'|'window.pageshow'|'window.focus'|'window.blur', data }`
- Network entries: `{ ts, type: 'window.online'|'window.offline' }`
- WebSocket entries: `{ ts, type: 'ws.open'|'ws.error'|'ws.close', data: { url, code, reason, wasClean } }`
- Error entries: `{ ts, type: 'window.error'|'window.unhandledrejection', data: { message/stack/... } }`

Sample filter keys you can use when sharing:
- `context === 'useStudentGameSocket'`
- `type.startsWith('ws.')`
- `message` containing 'LATE-JOIN-RECOVERY' or 'QUESTION UPDATE'

## Scope and safety

- This is entirely client-side and opt-in.
- No PII is collected beyond what is already present in logs (e.g., accessCode/userId in existing debug messages). Share logs prudently.
- Disable by removing `?mqdebug=1` and running `localStorage.removeItem('MQ_DEBUG_CAPTURE')`.

## Change log

- 2025-10-25: Added diagnostics capture (`src/diagnostics/initDiagnostics.ts`) and logger buffering (`src/clientLogger.ts`). Live page initializes diagnostics on demand.
