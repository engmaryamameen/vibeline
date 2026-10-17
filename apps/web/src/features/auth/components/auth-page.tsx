import type { ReactNode } from 'react';

export function AuthPage({ children }: { children: ReactNode }) {
  return <div className="animate-auth-route motion-reduce:animate-none">{children}</div>;
}
