import type { InputHTMLAttributes } from 'react';

import { cn } from '@vibeline/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      'flex h-9 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm text-content-primary',
      'placeholder:text-content-muted',
      'outline-none',
      'transition-[border-color,box-shadow,background-color] duration-200 ease-out',
      'hover:border-border-strong',
      'focus:border-accent/70 focus:ring-4 focus:ring-accent/10',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
);