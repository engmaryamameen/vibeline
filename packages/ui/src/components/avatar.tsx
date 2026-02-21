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
  { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  { bg: 'bg-rose-500/15', text: 'text-rose-400' },
  { bg: 'bg-violet-500/15', text: 'text-violet-400' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-400' }
] as const;

const getColorForName = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorPairs[hash % colorPairs.length] ?? colorPairs[0];
};

export const Avatar = ({ name, src, size = 'md', className }: AvatarProps) => {
  const fallback = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const colors = getColorForName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeStyles[size], className)}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-medium',
        sizeStyles[size],
        colors.bg,
        colors.text,
        className
      )}
    >
      {fallback}
    </div>
  );
};
