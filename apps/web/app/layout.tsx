import type { ReactNode } from 'react';

import '@/app/globals.css';

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" suppressHydrationWarning>
    <body>{children}</body>
  </html>
);

export default RootLayout;
