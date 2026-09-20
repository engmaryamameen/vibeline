import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@vibeline/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-surface-bg hover:bg-accent-hover active:bg-accent-hover shadow-sm',
  secondary:
    'bg-surface-elevated text-content-primary border border-border hover:bg-surface-hover active:bg-surface-soft',
  ghost:
    'bg-transparent text-content-secondary hover:text-content-primary hover:bg-surface-hover active:bg-surface-soft',
  danger:
    'bg-status-error/10 text-status-error hover:bg-status-error/20 active:bg-status-error/25'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3 text-sm gap-2',
  lg: 'h-10 px-4 text-sm gap-2'
};

export const Button = ({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) => (
  <button
    className={cn(
      'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-bg',
      'disabled:pointer-events-none disabled:opacity-50',
      variantStyles[variant],
      sizeStyles[size],
      className
    )}
    {...props}
  />
);
