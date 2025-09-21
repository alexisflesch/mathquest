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
  manifest: '/manifest.json',
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
        {/* Dev-only SW cleanup very early to avoid stale SW intercepting navigations */}
        {process.env.NODE_ENV === 'development' && (
          <script dangerouslySetInnerHTML={{
            __html: `
              (function(){
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations()
                    .then(function(regs){ return Promise.all(regs.map(function(r){ return r.unregister(); })); })
                    .then(function(){ if ('caches' in window) { caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); }); }})
                    .catch(function(e){ console.warn('[PWA] Early dev SW cleanup failed:', e); });
                }
              })();
            `
          }} />
        )}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
