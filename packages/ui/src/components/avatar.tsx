'use client';

import { useEffect, useState } from 'react';
import { cn } from '@vibeline/utils';

type AvatarSize = 'sm' | 'md' | 'lg';

type AvatarProps = {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
};

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm'
};

const colorPairs = [
  { bg: 'bg-blue-500/15', text: 'text-blue-700' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-700' },
  { bg: 'bg-amber-500/20', text: 'text-amber-700' },
  { bg: 'bg-rose-500/15', text: 'text-rose-700' },
  { bg: 'bg-violet-500/15', text: 'text-violet-700' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-800' }
] as const;

const getColorForName = (name: string) => {
  const hash = name.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return colorPairs[hash % colorPairs.length] ?? colorPairs[0];
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase() || '?';

export const Avatar = ({ name, src, size = 'md', className }: AvatarProps) => {
  const [failed, setFailed] = useState(false);
  const colors = getColorForName(name);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={cn('shrink-0 rounded-full bg-surface-soft object-cover', sizeStyles[size], className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={cn('flex shrink-0 items-center justify-center rounded-full font-semibold', sizeStyles[size], colors.bg, colors.text, className)}
    >
      {getInitials(name)}
    </div>
  );
};
