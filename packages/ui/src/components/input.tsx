import type { InputHTMLAttributes } from 'react';

import { cn } from '@vibeline/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      'flex h-9 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm text-content-primary',
      'placeholder:text-content-muted',
      'transition-colors duration-150',
      'hover:border-border-strong',
      'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
);
