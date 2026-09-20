import { cn } from '@vibeline/utils';

type VibeLineLogoSize = 'sm' | 'md' | 'lg';

type VibeLineLogoProps = {
  size?: VibeLineLogoSize;
  className?: string;
  variant?: 'light' | 'dark';
};

const sizeMap: Record<VibeLineLogoSize, { box: string; icon: number }> = {
  sm: { box: 'h-6 w-6 rounded-md', icon: 12 },
  md: { box: 'h-10 w-10 rounded-xl', icon: 20 },
  lg: { box: 'h-16 w-16 rounded-2xl', icon: 32 }
};

function VMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      <path d="M2 4l10 16 10-16H2z" fill="currentColor" />
    </svg>
  );
}


export function VibeLineLogo({
  size = 'md',
  variant = 'dark',
  className
}: VibeLineLogoProps) {
  const { box, icon } = sizeMap[size];

  const boxClasses =
    variant === 'light'
      ? 'bg-white/20 backdrop-blur-sm'
      : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25';

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center text-white',
        box,
        boxClasses,
        className
      )}
      aria-hidden
    >
      <VMark size={icon} />
    </div>
  );
}
