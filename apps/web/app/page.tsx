'use client';

import Link from 'next/link';
import { ArrowRight, MessageCircleMore, ShieldCheck, Sparkles } from 'lucide-react';

import { Button, PageShell } from '@vibeline/ui';
import { AuthGuard } from '@/src/components/auth/auth-guard';
import { Brand } from '@/src/components/auth/auth-surface';
import { env } from '@/src/lib/env';

export default function HomePage() {
  return (
    <AuthGuard mode="guest">
      <PageShell
        containerClassName="min-h-[100dvh]"
        gridClassName="min-h-[calc(100dvh-3rem)] auto-rows-min items-center sm:min-h-[calc(100dvh-4rem)]"
      >
        <header className="col-span-4 flex items-center justify-between md:col-span-8 lg:col-span-12">
          <Brand />
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-content-secondary transition-colors hover:text-content-primary sm:inline-flex"
          >
            Sign in
          </Link>
        </header>

        <section className="col-span-4 flex flex-col items-center py-12 text-center sm:py-16 md:col-span-6 md:col-start-2 lg:col-span-6 lg:col-start-4 lg:py-20">
          <div className="relative flex h-[86px] w-[86px] animate-home-float items-center justify-center rounded-[28px] bg-[linear-gradient(145deg,rgb(var(--accent-primary)),rgb(22_107_78))] text-white shadow-[0_22px_60px_rgb(var(--accent-primary)/0.22)] motion-reduce:animate-none">
            <MessageCircleMore className="h-8 w-8" />
            <span className="absolute -right-3.5 top-2 h-2 w-2 rounded-full bg-[#90eec8] shadow-[0_0_0_6px_rgb(144_238_200/0.12)]" />
            <span className="absolute -left-[17px] bottom-[5px] h-1.5 w-1.5 rounded-full bg-[#90eec8] shadow-[0_0_0_6px_rgb(144_238_200/0.12)]" />
          </div>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Your conversations, one calm place
          </p>
          <h1 className="mt-4 text-balance text-[clamp(2.75rem,7vw,5.6rem)] font-semibold leading-[0.95] tracking-[-0.065em] text-content-primary">
            Talk freely.
            <br />
            Come back anytime.
          </h1>
          <p className="mt-6 max-w-lg text-balance text-base leading-7 text-content-secondary sm:text-lg">
            A focused space for conversations that stay with you across every screen.
          </p>

          <div className="mt-10 grid w-full max-w-sm grid-cols-2 gap-3">
            <Link href="/register">
              <Button size="lg" className="h-12 w-full rounded-xl">
                Register
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="h-12 w-full rounded-xl">
                Sign in
              </Button>
            </Link>
          </div>

          <a
            href={`${env.apiBaseUrl}/auth/google`}
            className="mt-3 flex h-12 w-full max-w-sm items-center justify-center gap-3 rounded-xl border border-border bg-surface-panel text-sm font-semibold text-content-primary transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
          >
            <span className="text-base font-bold">G</span>
            Continue with Google
          </a>
        </section>

        <section className="col-span-4 mt-12 grid gap-3 sm:grid-cols-3 md:col-span-6 md:col-start-2 lg:col-span-8 lg:col-start-3">
          <div className="flex items-center justify-center gap-2 rounded-[14px] border border-border bg-surface-panel/70 px-3.5 py-3 text-xs font-medium text-content-secondary backdrop-blur-xl">
            <Sparkles className="h-4 w-4" />
            <span>Fluid by default</span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-[14px] border border-border bg-surface-panel/70 px-3.5 py-3 text-xs font-medium text-content-secondary backdrop-blur-xl">
            <ShieldCheck className="h-4 w-4" />
            <span>Private by design</span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-[14px] border border-border bg-surface-panel/70 px-3.5 py-3 text-xs font-medium text-content-secondary backdrop-blur-xl">
            <ArrowRight className="h-4 w-4" />
            <span>Ready on every screen</span>
          </div>
        </section>
      </PageShell>
    </AuthGuard>
  );
}
