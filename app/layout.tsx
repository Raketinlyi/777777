 // Trusted Types polyfill insertion moved to <head> for early execution
import type React from 'react';
import ClientLayout from './ClientLayout';
import '../styles/globals.css';
import '../styles/mobile-fixes.css';
import { Inter } from 'next/font/google';
import { MobileNavigation } from '@/components/mobile-navigation';
import ViewportFix from '@/components/ViewportFix';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'CrazyCube - NFT Platform',
  description: 'Where cubes cry and joke!',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32' },
      { url: '/icons/favicon-180x180.png', sizes: '180x180' },
      { url: '/icons/favicon-192x192.png', sizes: '192x192' },
    ],
    apple: [
      { url: '/icons/favicon-180x180.png', sizes: '180x180' },
    ],
  },
  generator: 'v0.dev',
  other: {
    'next-head-count': '0',
  },
};

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        />
        <link rel='manifest' href='/manifest.json' />
      {/* Tiny Trusted Types polyfill loaded before any other script */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src='/trusted-types-tinyfill.js' suppressHydrationWarning />
      </head>
      <body className={inter.className}>
              {/* moved to ViewportFix component */}
      <ViewportFix />
<ClientLayout>{children}</ClientLayout>
        <MobileNavigation />
      </body>
    </html>
  );
}

export default RootLayout;
