"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider, useAuth } from '../components/AuthProvider';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { logger, getCurrentLogLevel, setLogLevel, LogLevel } from '@/clientLogger';
import { MathJaxContext } from 'better-react-mathjax';
import AppNav from '@/components/AppNav';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Loading screen component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="text-center">
        {/* Animated spinner with app colors */}
        <div
          className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-6"
          style={{
            borderColor: 'var(--muted)',
            borderTopColor: 'var(--primary)'
          }}
        ></div>

        {/* App logo/title */}
        <h2
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--navbar)' }}
        >
          🧮 MathQuest
        </h2>

        {/* Loading text */}
        <p
          className="text-lg"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Chargement...
        </p>

        {/* Optional: Add some math-themed decorative elements */}
        <div className="mt-8 flex justify-center space-x-4 text-2xl opacity-50">
          <span style={{ color: 'var(--primary)' }}>+</span>
          <span style={{ color: 'var(--secondary)' }}>×</span>
          <span style={{ color: 'var(--accent)' }}>÷</span>
          <span style={{ color: 'var(--success)' }}>−</span>
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
      <AppNav sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
      <main className={`min-h-screen transition-all duration-200 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {children}
      </main>
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    <html lang="fr" className={inter.className} suppressHydrationWarning>
      <Head>
        <title>MathQuest - Révisez et défiez vos amis en maths !</title>
        <meta name="description" content="MathQuest : révisez les maths ou défiez vos amis dans des tournois ludiques, du CP au collège !" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <body>
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
      </body>
    </html>
  );
}
