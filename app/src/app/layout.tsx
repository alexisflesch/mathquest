"use client";

// Removed unused import: import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppNav from '@/components/AppNav';
import { AuthProvider } from '@/components/AuthProvider';

// Removed unused assignments for geistSans and geistMono

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.className} suppressHydrationWarning>
      {/* Removed <head> with <link> for Inter font */}
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
