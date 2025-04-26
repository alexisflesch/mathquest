"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import AppNav from '@/components/AppNav';
import { AuthProvider } from '../components/AuthProvider';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { logger, getCurrentLogLevel, setLogLevel, LogLevel } from '@/clientLogger';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        <AuthProvider>
          <AppNav sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
          <main className={`min-h-screen transition-all duration-200 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
