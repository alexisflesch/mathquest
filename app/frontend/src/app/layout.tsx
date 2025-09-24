import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata, Viewport } from 'next';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: 'MathQuest',
  description: 'MathQuest : révisez les maths ou défiez vos amis dans des tournois ludiques, du CP au post-bac !',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MathQuest',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#153B50',
};

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
      <body>
        {/* Dev SW cleanup disabled to avoid any runtime serviceWorker activity during local dev.
            If you need to unregister SWs for testing, use an incognito window or append ?unregisterSW=1 to the URL which activates a one-time unregister hook placed elsewhere in the codebase. */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
