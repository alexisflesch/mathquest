"use client";

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { logger, getCurrentLogLevel, setLogLevel, LogLevel } from '@/clientLogger';
import { MathJaxContext } from 'better-react-mathjax';
import AppNav from '@/components/AppNav';
import InfinitySpin from '@/components/InfinitySpin';
import AuthErrorBanner from '@/components/AuthErrorBanner';

// Loading screen component
function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
            <div className="text-center">
                {/* Custom infinity spinner */}
                <div className="flex justify-center mb-8">
                    <InfinitySpin
                        // baseColor="#3b82f6"
                        size={150}
                    />
                </div>

                {/* App logo/title */}
                <h2
                    className="text-3xl font-bold mb-2 text-[color:var(--foreground)]"
                >
                    🧮 MathQuest
                </h2>

                {/* Loading text */}
                <p
                    className="text-lg text-[color:var(--muted-foreground)]"
                >
                    Chargement...
                </p>

                {/* Optional: Add some math-themed decorative elements */}
                <div className="mt-8 flex justify-center space-x-4 text-2xl opacity-50">
                    <span className="text-[color:var(--primary)]">+</span>
                    <span className="text-[color:var(--secondary)]">×</span>
                    <span className="text-[color:var(--accent)]">÷</span>
                    <span className="text-[color:var(--success)]">−</span>
                </div>
            </div>
        </div>
    );
}

// Main app content that shows after auth is loaded
function AppContent({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>
            <AuthErrorBanner />
            <AppNav sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
            <main className={`min-h-screen transition-all ease-in-out pt-14 md:pt-0 ${sidebarCollapsed ? 'md:ml-12' : 'md:ml-64'}`} style={{ transitionDuration: '220ms' }}>
                {children}
            </main>
        </>
    );
}

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        // Example of client-side logging in action
        logger.debug('Layout mounted - Debug level message');
        logger.info('Application initialized');
        logger.warn('This is an example warning');

        // Log the current log level
        const currentLevel = getCurrentLogLevel();
        logger.info(`Current log level: ${currentLevel}`);

        // You can expose this function to toggle logging during development
        // For example, add a keyboard shortcut or dev panel
        const toggleDebugMode = (e: KeyboardEvent) => {
            // Ctrl+Shift+D toggles debug mode
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                const newLevel = getCurrentLogLevel() === 'DEBUG' ? 'INFO' as LogLevel : 'DEBUG' as LogLevel;
                setLogLevel(newLevel);
                logger.info(`Log level changed to: ${newLevel}`);
            }
        };

        window.addEventListener('keydown', toggleDebugMode);
        return () => window.removeEventListener('keydown', toggleDebugMode);
    }, []);

    return (
        <>
            <script dangerouslySetInnerHTML={{
                __html: `
          (function() {
            try {
              const stored = localStorage.getItem('theme');
              const theme = stored || 'system';
              const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const appliedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
              document.documentElement.setAttribute('data-theme', appliedTheme);
            } catch (e) {
              // Fallback if localStorage is not available
              const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              document.documentElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');
            }
          })();
        `
            }} />
            <MathJaxContext config={{
                loader: { load: ["[tex]/ams"] },
                tex: { packages: { '[+]': ["ams"] } }
            }}>
                <AuthProvider>
                    <AppContent>
                        {children}
                    </AppContent>
                </AuthProvider>
            </MathJaxContext>
        </>
    );
}
