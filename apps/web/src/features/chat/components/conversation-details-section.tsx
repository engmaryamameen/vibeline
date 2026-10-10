import type { ReactNode } from 'react';

type Props = { title: string; children: ReactNode };

export function ConversationDetailsSection({ title, children }: Props) {
  return (
    <section className="mt-6">
      <h3 className="mb-1 text-[13px] font-semibold uppercase leading-4 tracking-[-.15px] text-black/35">{title}</h3>
      {children}
    </section>
  );
}
