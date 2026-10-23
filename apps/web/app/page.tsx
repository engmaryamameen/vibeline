'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import birdLogo from '@/src/shared/assets/svg/vibeline-bird-logo-green.svg';
import { PageShell } from '@vibeline/ui';
import { AuthGuard } from '@/src/features/auth/components/auth-guard';
import { Brand } from '@/src/features/auth/components';
import { env } from '@/src/lib/env';
import { GoogleIcon } from '@/src/features/auth/assets/svg/social-links';
import { useAuthProviders } from '@/src/features/auth/hooks/use-auth-providers';
import { homeIcons } from '@/src/shared/assets/svg/chat';
import Link from 'next/link';

const highlights = [
  {
    icon: homeIcons.sparkles,
    label: 'Fluid by default',
  },
  {
    icon: homeIcons.shieldCheck,
    label: 'Private by design',
  },
  {
    icon: homeIcons.monitorSmartphone,
    label: 'Ready on every screen',
  },
] as const;

const focusStyles =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--accent-primary))]';

const actionStyles = `
  inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5
  text-sm
  transition-[background-color,border-color,box-shadow,transform,translate]
  duration-200 ease-out
  motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0
  motion-reduce:transition-none
  ${focusStyles}
`;

export default function HomePage() {
  const { google } = useAuthProviders();
  return (
    <AuthGuard mode="guest">
      <PageShell
        containerClassName="min-h-[100dvh] pb-8 overflow-auto"
        gridClassName="min-h-[calc(100dvh-3rem)] grid-rows-[auto_1fr_auto] gap-y-0 sm:min-h-[calc(100dvh-4rem)]"
      >
        <header className="col-span-4 flex items-center justify-between gap-4 md:col-span-8 py-4 lg:col-span-12">
          <Brand />

          <Link href="/login"
            className={`group inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-content-secondary transition-colors hover:text-content-primary motion-reduce:transition-none ${focusStyles}`}
          >
            Login
            <ArrowRight
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        </header>

        <section
          aria-labelledby="home-title"
          className="relative isolate col-span-4 flex min-w-0 flex-col items-center justify-center py-12 text-center sm:py-8 md:col-span-8 lg:col-span-12"
        >
          {/* Ambient color stays behind the content and cannot catch clicks. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute left-1/2 top-0 h-[32rem] w-full max-w-3xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgb(var(--accent-primary)/0.07)_0%,transparent_68%)]" />
          </div>

          <div aria-hidden="true" className="relative">
            <div className="absolute -inset-2 rounded-[34px] border border-[rgb(var(--accent-primary)/0.10)] bg-[rgb(var(--accent-primary)/0.025)]" />
            <div className="relative flex h-[86px] w-[86px] animate-home-float items-center justify-center rounded-[26px] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.20),0_16px_40px_rgb(var(--accent-primary)/0.18)] motion-reduce:animate-none sm:h-20 sm:w-20">
              <Image src={birdLogo} alt="" width={62} height={54} className="h-11 w-auto shrink-0" aria-hidden="true" />
            </div>
          </div>

          <p className="mt-8 max-w-full text-balance text-[10px] font-semibold uppercase leading-5 tracking-[0.19em] text-accent sm:text-[11px] sm:tracking-[0.22em]">
            Your conversations, one calm place
          </p>

          <h1
            id="home-title"
            className="mt-4 w-full max-w-4xl text-balance text-[clamp(2.75rem,6.5vw,5.5rem)] font-semibold leading-[1.04] tracking-[-0.055em] text-content-primary"
          >
            <span className="block">Talk freely.</span>
            <span className="block sm:whitespace-nowrap">
              Come back <span className="text-accent">anytime.</span>
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-balance text-base leading-7 text-content-secondary sm:text-lg">
            A focused space for conversations that stay with you across every
            screen.
          </p>

          <div className="mt-8 w-full max-w-sm">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/register"
                className={`group ${actionStyles} font-semibold bg-[rgb(var(--accent-primary))] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_5px_16px_rgb(var(--accent-primary)/0.16)] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_22px_rgb(var(--accent-primary)/0.24)]`}
              >
                Register
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </Link>

              <Link
                href="/login"
                className={`${actionStyles} font-semibold border border-border bg-surface-panel text-content-primary hover:border-border-strong hover:shadow-sm`}
              >
                Login
              </Link>
            </div>

            {google && (
              <a
                href={`${env.apiBaseUrl}/auth/google`}
                className={`${actionStyles} mt-3 w-full border border-transparent bg-[#f2f2f2] font-medium text-[#1f1f1f] hover:bg-[#e9e9e9]`}
              >
                <GoogleIcon />
                Continue with Google
              </a>
            )}
          </div>
        </section>

        <footer className="col-span-4 pb-1 md:col-span-8 lg:col-span-12">
          <ul
            aria-label="VibeLine highlights"
            className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t border-border/70 pt-5"
          >
            {highlights.map(({ icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-xs font-medium text-content-secondary sm:text-sm"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--accent-primary)/0.07)] text-accent">
                  <span
                    aria-hidden="true"
                    className="block h-3.5 w-3.5 shrink-0 bg-current"
                    style={{
                      WebkitMask: `url("${icon}") center / contain no-repeat`,
                      mask: `url("${icon}") center / contain no-repeat`,
                    }}
                  />
                </span>

                <span>{label}</span>
              </li>
            ))}
          </ul>
        </footer>
      </PageShell>
    </AuthGuard>
  );
}