import type { ReactNode } from 'react';

import '@/app/globals.css';

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" suppressHydrationWarning className="min-h-full bg-white">
    <body className="min-h-full bg-white font-sans text-content-primary antialiased selection:bg-accent/25">{children}</body>
  </html>
);

export default RootLayout;
