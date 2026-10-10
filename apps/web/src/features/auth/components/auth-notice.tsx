import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@vibeline/utils';

type Props = { children: ReactNode; tone?: 'error' | 'success' };

export function AuthNotice({ children, tone = 'error' }: Props) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-xl border px-4 py-3 text-sm leading-5 motion-safe:animate-slide-down',
        tone === 'error'
          ? 'border-status-error/15 bg-status-error/5 text-status-error'
          : 'border-status-success/15 bg-status-success/5 text-status-success'
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
