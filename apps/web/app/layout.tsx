import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '@/app/globals.css';

export const metadata: Metadata = {
  title: { default: 'Vibeline', template: '%s · Vibeline' },
  description: 'Messaging with media, audio and video calls, and 24-hour stories.',
  applicationName: 'Vibeline',
  icons: { icon: '/images/vibeline-bird-logo.svg' },
  formatDetection: { telephone: false }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff'
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en" suppressHydrationWarning className="min-h-full bg-white">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </head>
    <body className="min-h-full bg-white font-sans text-content-primary antialiased selection:bg-accent/25">
      {children}
      <div id="overlay-root" />
    </body>
  </html>
);

export default RootLayout;
