"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppNav from '@/components/AppNav';
import { AuthProvider } from '@/components/AuthProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Removed export const metadata: Metadata = { ... } because metadata export is not allowed in client components

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <AppNav />
          <main className="min-h-screen md:ml-64">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
