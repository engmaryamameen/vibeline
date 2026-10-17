'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = { title: string; onClose: () => void; children: ReactNode };

export function EditorPanelShell({ title, onClose, children }: Props) {
  return (
    <section
      aria-label={title}
      className="absolute inset-x-3 bottom-[168px] z-20 max-h-[42vh] overflow-y-auto overscroll-contain rounded-2xl bg-black/88 p-4 shadow-xl backdrop-blur motion-safe:animate-slide-up sm:bottom-auto sm:left-auto sm:right-20 sm:top-20 sm:w-80"
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title.toLowerCase()}`}
          className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/15"
        >
          <X size={16} />
        </button>
      </header>
      {children}
    </section>
  );
}
