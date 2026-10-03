'use client';

import type { ComponentType, InputHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  MessageCircleMore,
  Sparkles,
  type LucideProps
} from 'lucide-react';
import { Button, Input, PageShell, VibeLineLogo } from '@vibeline/ui';
import { cn } from '@vibeline/utils';

export const authPrimaryClassName =
  'bg-accent text-white shadow-[0_10px_28px_rgb(var(--accent-primary)/0.20)] transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_14px_32px_rgb(var(--accent-primary)/0.27)] disabled:translate-y-0 disabled:shadow-none motion-reduce:transition-none';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <PageShell
      containerClassName="py-4 sm:py-6 lg:py-8"
    >
      <section className="col-span-4 grid grid-rows-[auto_1fr_auto] self-stretch md:col-span-6 md:col-start-2 lg:col-span-5 lg:col-start-auto">
        <Brand />

        <div className="flex items-center py-8 sm:py-10 lg:py-12">
          <div className="w-full max-w-[430px] md:mx-auto lg:mx-0">
            {children}
          </div>
        </div>
      </section>

      <AuthVisual />
    </PageShell>
  );
}

function AuthVisual() {
  const cardClassName =
    'absolute rounded-[18px] border border-white/10 bg-white/[0.065] shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur-[18px]';

  return (
    <aside className="relative hidden overflow-hidden rounded-[24px] bg-[linear-gradient(145deg,#071711_0%,#0b2a1e_50%,#10382a_100%)] lg:col-span-7 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12">
      <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.06)_1px,transparent_1px)] bg-[size:52px_52px] opacity-[0.18] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
      <div className="absolute -right-32 -top-32 h-96 w-96 animate-auth-float rounded-full bg-[radial-gradient(circle_at_35%_35%,rgb(79_214_164/0.34),transparent_68%)] blur-[4px] motion-reduce:animate-none" />
      <div className="absolute -left-28 bottom-20 h-72 w-72 animate-auth-float rounded-full bg-[radial-gradient(circle_at_45%_45%,rgb(30_120_88/0.34),transparent_68%)] blur-[4px] [animation-delay:-5s] motion-reduce:animate-none" />
      <div className="relative z-10 flex justify-end">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-white/70 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
          Always within reach
        </span>
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 items-center justify-center py-10">
        <div className="relative min-h-[360px] w-full">
          <div className={cn(cardClassName, 'left-[2%] top-[14%] w-[175px] animate-auth-drift p-[18px] motion-reduce:animate-none')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
              <MessageCircleMore className="h-5 w-5" />
            </div>
            <div className="mt-5 h-2.5 w-24 rounded-full bg-white/20" />
            <div className="mt-2 h-2 w-36 rounded-full bg-white/10" />
          </div>
          <div className="absolute left-1/2 top-1/2 flex h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.055] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08),0_30px_80px_rgb(0_0_0/0.22)] backdrop-blur-[20px]">
            <div className="relative z-[2]">
              <VibeLineLogo size="lg" variant="light" className="shadow-none" />
            </div>
            <div className="absolute -inset-7 animate-auth-pulse rounded-full border border-[rgb(101_227_179/0.18)] motion-reduce:animate-none" />
            <div className="absolute -inset-7 animate-auth-pulse rounded-full border border-[rgb(101_227_179/0.18)] [animation-delay:-2.4s] motion-reduce:animate-none" />
          </div>
          <div className={cn(cardClassName, 'right-0 top-[24%] w-[180px] animate-auth-drift-reverse p-4 motion-reduce:animate-none')}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-200">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-2">
                <div className="h-2.5 w-20 rounded-full bg-white/20" />
                <div className="h-2 w-28 rounded-full bg-white/10" />
              </div>
            </div>
          </div>
          <div className={cn(cardClassName, 'bottom-[8%] left-1/2 flex w-max -translate-x-1/2 items-center gap-2.5 px-4 py-3')}>
            <LockKeyhole className="h-4 w-4 text-emerald-200" />
            <span className="text-xs text-white/65">Your space stays yours.</span>
          </div>
        </div>
      </div>
      <div className="relative z-10 max-w-md">
        <p className="text-3xl font-semibold tracking-[-0.04em] text-white">
          Conversations that feel effortless.
        </p>
        <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
          One calm place to continue the people and ideas that matter.
        </p>
      </div>
    </aside>
  );
}


export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className="relative z-10 inline-flex w-fit items-center gap-1 select-none transition-opacity hover:opacity-90"
      aria-label="VibeLine home"
    >
      <img
        src="/images/vibeline-bird-logo-green.svg"
        alt=""
        className="h-11 w-auto shrink-0"
        aria-hidden="true"
      />

      <span
        className={cn(
          "font-poppins flex items-center text-[26px] font-bold leading-none tracking-[-0.045em]",
          light ? "text-white" : "text-slate-900"
        )}
      >
        Vibe
        <span className="text-[#22C55E] dark:text-emerald-400">
          Line
        </span>
      </span>
    </Link>
  );
}
export function AuthPage({ children }: { children: ReactNode }) {
  return <div className="animate-auth-route motion-reduce:animate-none">{children}</div>;
}

export function AuthHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-[2rem] font-semibold leading-[1.05] tracking-[-0.045em] text-content-primary sm:text-[2.3rem]">
        {title}
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-content-secondary sm:text-[15px]">
        {description}
      </p>
    </header>
  );
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ComponentType<LucideProps>;
  trailing?: ReactNode;
  labelAction?: ReactNode;
};

export function AuthField({ label, icon: Icon, trailing, labelAction, className, ...props }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex min-h-5 items-center justify-between gap-3">
        <span className="text-sm font-medium text-content-primary">{label}</span>
        {labelAction}
      </span>
      <span className="group relative block">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted transition-colors duration-200 group-focus-within:text-accent" />
        )}
        <Input
          className={cn(
            'h-12 rounded-xl border-border bg-surface-panel text-[15px] shadow-[0_1px_2px_rgba(16,40,29,0.03)]',
            'focus:border-accent/65 focus:ring-4 focus:ring-accent/10',
            Icon && 'pl-11',
            trailing && 'pr-12',
            className
          )}
          {...props}
        />
        {trailing}
      </span>
    </label>
  );
}

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

export function AuthNotice({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' }) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-xl border px-4 py-3 text-sm leading-5',
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

export function SubmitButton({ loading, children, loadingLabel }: { loading: boolean; children: ReactNode; loadingLabel: string }) {
  return (
    <Button
      size="lg"
      type="submit"
      disabled={loading}
      className={cn(authPrimaryClassName, 'h-12 w-full rounded-xl text-[15px] font-semibold')}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function SocialAuth({ apiBaseUrl }: { apiBaseUrl: string }) {
  return (
    <>
      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-content-muted">or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SocialLink href={`${apiBaseUrl}/auth/google`} label="Google">
          <span className="text-base font-bold">G</span>
        </SocialLink>
        <SocialLink href={`${apiBaseUrl}/auth/github`} label="GitHub">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.71 1.26 3.37.97.1-.75.4-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.38-5.29 5.67.42.36.79 1.06.79 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
          </svg>
        </SocialLink>
      </div>
    </>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-panel text-sm font-medium text-content-primary transition-[border-color,box-shadow,transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-soft/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/10"
    >
      {children}
      {label}
    </a>
  );
}

export function AuthStatePanel({
  icon,
  title,
  description,
  children
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent">
        {icon}
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-content-primary">{title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-content-secondary">{description}</p>
      {children}
    </section>
  );
}
