import type { HTMLAttributes } from 'react';
import { cn } from '@vibeline/utils';

export function AuthFields({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-3', className)} {...props} />;
}
