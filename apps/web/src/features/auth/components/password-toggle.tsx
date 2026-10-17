import { Eye, EyeOff } from 'lucide-react';

export function PasswordToggle({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={visible ? 'Hide password' : 'Show password'}
      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-content-muted transition-[background-color,color] duration-200 hover:bg-surface-soft hover:text-content-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/10"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
