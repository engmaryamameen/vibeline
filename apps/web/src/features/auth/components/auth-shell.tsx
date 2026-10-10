import type { ReactNode } from 'react';
import { PageShell } from '@vibeline/ui';
import { AuthVisual } from './auth-visual';
import { Brand } from './brand';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <PageShell containerClassName="py-4 sm:py-6 lg:py-8">
      <section className="col-span-4 grid grid-rows-[auto_1fr] self-stretch md:col-span-6 md:col-start-2 lg:col-span-5 lg:col-start-auto">
        <Brand />

        <div className="flex items-center py-8 sm:py-10 lg:py-12">
          <div className="mx-auto w-full max-w-[430px]">{children}</div>
        </div>
      </section>

      <AuthVisual />
    </PageShell>
  );
}
