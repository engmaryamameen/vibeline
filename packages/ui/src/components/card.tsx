import type { PropsWithChildren } from 'react';

import { cn } from '@vibeline/utils';

type CardProps = PropsWithChildren<{ className?: string }>;

export const Card = ({ className, children }: CardProps) => (
  <section
    className={cn(
      'rounded-xl border border-border bg-surface-panel p-6 shadow-panel',
      className
    )}
  >
    {children}
  </section>
);
