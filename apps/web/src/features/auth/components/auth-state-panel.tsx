import type { ReactNode } from 'react';

type Props = { icon: ReactNode; title: string; description: string; children?: ReactNode };

export function AuthStatePanel({ icon, title, description, children }: Props) {
  return (
    <section className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent">{icon}</div>
      <h1 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-content-primary">{title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-content-secondary">{description}</p>
      {children}
    </section>
  );
}
