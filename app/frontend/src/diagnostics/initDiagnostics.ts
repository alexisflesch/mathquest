/*
 * initDiagnostics.ts - Opt-in frontend diagnostics capture for live sessions
 * Enable by appending ?mqdebug=1 to the URL (or set localStorage.MQ_DEBUG_CAPTURE = '1').
 * This captures:
 * - Client logger entries (via clientLogger integration)
 * - Window errors and unhandled rejections
 * - Page lifecycle events: visibilitychange, pagehide/pageshow, focus/blur
 * - Online/offline network changes
 * - WebSocket close/error events (best-effort)
 * It exposes window.__mqDiag.download() to save captured events as JSON.
 */

import { setLogLevel } from '@/clientLogger';

type DiagEntry = { ts: number; type: string; data?: unknown };

declare global {
    interface Window {
        __mqDiag?: {
            enabled: boolean;
            events: Array<any>;
            push: (entry: any) => void;
            download?: () => void;
            export?: () => any[];
            clear?: () => void;
        }
    }
}

function push(type: string, data?: unknown) {
    if (typeof window === 'undefined') return;
    if (!window.__mqDiag) window.__mqDiag = { enabled: true, events: [], push: (e: any) => { (window.__mqDiag as any).events.push(e); } };
    try {
        window.__mqDiag!.push({ ts: Date.now(), type, data });
    } catch {
        /* ignore */
    }
}

function persistBuffer() {
    if (typeof window === 'undefined' || !window.__mqDiag) return;
    try {
        localStorage.setItem('MQ_DEBUG_BUFFER', JSON.stringify(window.__mqDiag.events));
    } catch {
        // ignore
    }
}

function installGlobalErrorHandlers() {
    window.addEventListener('error', (e) => {
        push('window.error', {
            message: e.message,
            filename: e.filename,
            lineno: (e as any).lineno,
            colno: (e as any).colno,
            error: e.error ? { name: e.error.name, message: e.error.message, stack: e.error.stack } : undefined
        });
    });
    window.addEventListener('unhandledrejection', (e) => {
        const reason = (e as PromiseRejectionEvent).reason as any;
        push('window.unhandledrejection', {
            reason: reason && typeof reason === 'object' ? { name: reason.name, message: reason.message, stack: reason.stack } : String(reason)
        });
    });
}

function installLifecycleHandlers() {
    document.addEventListener('visibilitychange', () => {
        push('document.visibilitychange', { visibilityState: document.visibilityState });
    });
    window.addEventListener('pageshow', (e) => push('window.pageshow', { persisted: (e as PageTransitionEvent).persisted }));
    window.addEventListener('pagehide', (e) => push('window.pagehide', { persisted: (e as PageTransitionEvent).persisted }));
    window.addEventListener('focus', () => push('window.focus'));
    window.addEventListener('blur', () => push('window.blur'));
}

function installNetworkHandlers() {
    window.addEventListener('online', () => push('window.online'));
    window.addEventListener('offline', () => push('window.offline'));
}

function installWebSocketDiagnostics() {
    const NativeWS = window.WebSocket;
    try {
        // Patch WebSocket constructor to attach close/error listeners
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).WebSocket = function (this: WebSocket, url: string | URL, protocols?: string | string[]) {
            const ws = protocols ? new NativeWS(url, protocols) : new NativeWS(url);
            try {
                ws.addEventListener('open', () => push('ws.open', { url: String(url) }));
                ws.addEventListener('error', (evt) => push('ws.error', { url: String(url), error: String((evt as any)?.message || 'unknown') }));
                ws.addEventListener('close', (evt) => push('ws.close', { url: String(url), code: (evt as CloseEvent).code, reason: (evt as CloseEvent).reason, wasClean: (evt as CloseEvent).wasClean }));
            } catch { }
            return ws as any;
        } as unknown as typeof WebSocket;
        // Preserve static props
        (window as any).WebSocket.prototype = NativeWS.prototype;
    } catch {
        // Ignore failures
    }
}

function installDownloadHelper() {
    if (!window.__mqDiag) return;
    window.__mqDiag.download = () => {
        try {
            const blob = new Blob([JSON.stringify(window.__mqDiag!.events, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            a.download = `mathquest-diag-${ts}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            // As a fallback, log the json to the console
            // eslint-disable-next-line no-console
            console.log('Diagnostics dump:', window.__mqDiag!.events);
        }
    };
    window.__mqDiag.export = () => {
        try { return (window.__mqDiag as any).events.slice(); } catch { return []; }
    };
    window.__mqDiag.clear = () => {
        try {
            (window.__mqDiag as any).events = [];
            localStorage.removeItem('MQ_DEBUG_BUFFER');
        } catch { }
    };
}

export function initDiagnostics(): void {
    if (typeof window === 'undefined') return;

    // Enable capture based on query param/localStorage
    const urlFlag = /(?:[?&])mqdebug=1(?:&|$)/.test(window.location.search);
    const lsFlag = (() => { try { return localStorage.getItem('MQ_DEBUG_CAPTURE') === '1'; } catch { return false; } })();
    const enabled = urlFlag || lsFlag;
    if (!enabled) return;

    try { localStorage.setItem('MQ_DEBUG_CAPTURE', '1'); } catch { }
    try { setLogLevel('DEBUG'); } catch { }

    // Ensure buffer exists
    if (!window.__mqDiag) {
        window.__mqDiag = { enabled: true, events: [], push: (e: any) => { (window.__mqDiag as any).events.push(e); } };
    } else {
        window.__mqDiag.enabled = true;
    }

    push('diag.enabled', { href: window.location.href, userAgent: navigator.userAgent });

    installGlobalErrorHandlers();
    installLifecycleHandlers();
    installNetworkHandlers();
    installWebSocketDiagnostics();
    installDownloadHelper();

    // Restore any previous buffer (from a crash or reload)
    let restoredCount = 0;
    try {
        const prev = localStorage.getItem('MQ_DEBUG_BUFFER');
        if (prev) {
            const arr = JSON.parse(prev);
            if (Array.isArray(arr)) {
                (window.__mqDiag as any).events.push(...arr);
                restoredCount = arr.length;
                push('diag.restore', { count: arr.length });
                // Clear store to avoid duplicates
                localStorage.removeItem('MQ_DEBUG_BUFFER');
            }
        }
    } catch { }

    // Periodically persist the buffer and on unload
    const persistInterval = window.setInterval(persistBuffer, 3000);
    window.addEventListener('pagehide', persistBuffer);
    window.addEventListener('beforeunload', persistBuffer);

    // Global hotkey: Ctrl+Shift+D to download
    document.addEventListener('keydown', (e) => {
        try {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
                e.preventDefault();
                if (window.__mqDiag?.download) {
                    window.__mqDiag.download();
                }
            }
        } catch { }
    });

    // If we restored a previous buffer (likely after a crash), auto-download once
    if (restoredCount > 0) {
        try {
            setTimeout(() => {
                if (window.__mqDiag && window.__mqDiag.download) {
                    window.__mqDiag.download();
                } else {
                    // Fallback: navigate to data URL (may prompt save dialog)
                    try {
                        const data = encodeURIComponent(JSON.stringify((window.__mqDiag as any).events || []));
                        window.location.href = `data:application/json;charset=utf-8,${data}`;
                    } catch { }
                }
            }, 500);
        } catch { }
    }

    // Cleanup installer (idempotent init; no direct teardown needed in SPA)
}

export default initDiagnostics;

export function isDiagnosticsEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return /(?:[?&])mqdebug=1(?:&|$)/.test(window.location.search) || localStorage.getItem('MQ_DEBUG_CAPTURE') === '1';
    } catch {
        return /(?:[?&])mqdebug=1(?:&|$)/.test(window.location.search);
    }
}
