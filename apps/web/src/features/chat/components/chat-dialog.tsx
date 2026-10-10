'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@vibeline/utils';
import { useBodyScrollLock } from '@/src/shared/hooks/use-body-scroll-lock';
import { useDismiss } from '@/src/shared/hooks/use-dismiss';
import { useFocusTrap } from '@/src/shared/hooks/use-focus-trap';

const EXIT_MS = 160;

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode };

export function ChatDialog({ open, title, onClose, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useBodyScrollLock(mounted);
  useDismiss({ active: open, onDismiss: onClose, closeOnOutside: false });
  useFocusTrap(open, panelRef);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-hidden="true"
        className={cn('absolute inset-0 bg-black/35 transition-opacity duration-150 ease-out', visible ? 'opacity-100' : 'opacity-0')}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative max-h-[86dvh] w-full overflow-hidden rounded-t-[24px] bg-surface-panel shadow-2xl transition duration-150 ease-out sm:max-w-md sm:rounded-[20px]',
          'motion-reduce:transition-none',
          visible ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-4 opacity-0 sm:translate-y-0 sm:scale-[.97]'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface-soft transition-colors hover:bg-surface-hover"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
