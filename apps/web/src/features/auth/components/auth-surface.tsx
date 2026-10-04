'use client';

import type { ComponentType, FormHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Info,
  MessageCircleMore,
  Sparkles,
  type LucideProps
} from 'lucide-react';
import { Button, Input, PageShell } from '@vibeline/ui';
import { cn } from '@vibeline/utils';
import { GoogleIcon } from '../assets/svg/social-links';

export const authPrimaryClassName =
  'bg-[#2B8761] text-white shadow-[0_10px_28px_rgba(43,135,97,0.20)] transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-px hover:bg-[#206649] hover:shadow-[0_14px_32px_rgba(43,135,97,0.27)] disabled:translate-y-0 disabled:shadow-none disabled:opacity-50 motion-reduce:transition-none';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <PageShell containerClassName="py-4 sm:py-6 lg:py-8">
      <section className="col-span-4 grid grid-rows-[auto_1fr] self-stretch md:col-span-6 md:col-start-2 lg:col-span-5 lg:col-start-auto">
        <Brand />

        <div className="flex items-center py-8 sm:py-10 lg:py-12">
          <div className="mx-auto w-full max-w-[430px] lg:mx-auto">
            {children}
          </div>
        </div>
      </section>

      <AuthVisual />
    </PageShell>
  );
}

function AuthVisual() {
  return (
    <aside className="relative hidden self-stretch overflow-hidden rounded-[28px] border border-emerald-950/[0.04] bg-[linear-gradient(145deg,#eef8f5_0%,#dcefe9_45%,#b9ddd2_100%)] shadow-[0_24px_80px_rgba(17,94,70,0.08)] lg:col-span-7 lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgb(255_255_255/0.9),transparent_29%),radial-gradient(circle_at_18%_82%,rgb(255_255_255/0.7),transparent_30%)]" />
      <div className="absolute -right-[18%] -top-[24%] h-[76%] w-[68%] rotate-[38deg] rounded-[64px] border border-white/75 bg-white/20 shadow-[0_24px_90px_rgba(30,120,88,0.08)] backdrop-blur-2xl" />
      <div className="absolute left-[10%] top-[3%] h-[88%] w-[30%] -rotate-[41deg] rounded-[56px] border border-white/65 bg-white/15 backdrop-blur-xl" />
      <div className="absolute bottom-[-18%] right-[3%] h-[58%] w-[52%] rotate-[42deg] rounded-[64px] border border-white/60 bg-white/15 shadow-[0_30px_100px_rgba(21,128,91,0.08)] backdrop-blur-2xl" />
      <div className="absolute left-[42%] top-[31%] h-[190px] w-[190px] rounded-full border border-white/70 bg-white/20 backdrop-blur-2xl" />
      <div className="absolute left-[42%] top-[31%] flex h-[190px] w-[190px] items-center justify-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/70 bg-white/45 text-emerald-800 shadow-[0_18px_55px_rgba(17,94,70,0.10)] backdrop-blur-2xl">
          <MessageCircleMore className="h-10 w-10" strokeWidth={1.5} />
          <span className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/70 text-emerald-600 shadow-sm backdrop-blur-xl">
            <Sparkles className="h-4 w-4" />
          </span>
        </div>
      </div>
      <div className="absolute left-[12%] top-[18%] h-3 w-3 rounded-full border border-white/80 bg-white/50 shadow-[0_0_30px_rgba(255,255,255,0.8)]" />
      <div className="absolute bottom-[29%] right-[11%] h-5 w-5 rounded-full border border-white/80 bg-white/35" />

      <div className="absolute bottom-10 left-10 right-10 xl:bottom-12 xl:left-12 xl:right-12">
        <p className="max-w-md text-[2rem] font-semibold leading-[1.08] tracking-[-0.045em] text-slate-900 xl:text-[2.2rem]">
          Conversations without the noise.
        </p>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 xl:text-[15px]">
          Keep your conversations and context in one calm place, with AI ready when you want help thinking, writing, or moving forward.
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

export function AuthForm({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form className={cn('space-y-8', className)} noValidate {...props} />;
}

export function AuthFields({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-3', className)} {...props} />;
}

export function AuthHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-10 sm:mb-6">
      <h1 className="text-center font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.045em] text-content-primary sm:text-[2.3rem] md:text-left">
        {title}
      </h1>

      {(description || action) && (
        <div className="mt-2 max-w-sm text-center text-sm leading-6 text-content-secondary md:text-left">
          {description && <span>{description}</span>}

          {action && (
            <>
              {description && ' '}
              {action}
            </>
          )}
        </div>
      )}
    </header>
  );
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ComponentType<LucideProps>;
  trailing?: ReactNode;
  fieldAction?: ReactNode;
  error?: string;
};

export function AuthField({
  label,
  icon: Icon,
  trailing,
  fieldAction,
  error,
  className,
  id,
  name,
  ...props
}: AuthFieldProps) {
  const fieldId = id ?? name;
  const errorId = fieldId ? `${fieldId}-error` : undefined;

  return (
    <label className="block" htmlFor={fieldId}>
      <span className="mb-2 block text-sm font-medium text-content-primary">
        {label}
      </span>

      <span className="group relative block">
        {Icon && (
          <Icon
            className={cn(
              'pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2',
              'text-content-muted transition-colors duration-150',
              'group-focus-within:text-accent',
              error && 'text-status-error'
            )}
          />
        )}

        <Input
          id={fieldId}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            Icon && 'pl-11',
            trailing && 'pr-12',
            className
          )}
          {...props}
        />

        {trailing}
      </span>

      {(error || fieldAction) && (
        <span className="mt-1.5 flex items-start justify-between gap-3">
          <span className="min-w-0 flex-1">
            {error && (
              <span
                id={errorId}
                role="alert"
                className="flex items-center gap-2 text-sm leading-[22px] text-status-error"
              >
                <Info className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </span>
            )}
          </span>

          {fieldAction && (
            <span className="shrink-0 ">
              {fieldAction}
            </span>
          )}
        </span>
      )}
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
      className={cn(
        authPrimaryClassName,
        'flex flex-row items-center justify-center gap-2 w-full h-11 px-[14px] py-3 rounded-full text-sm font-medium leading-5 tracking-[0.015em] text-center'
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-[18px] w-[18px] animate-spin shrink-0" />
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
    <div className="mt-auto mb-0 pt-16 md:pt-6">
      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-content-muted">or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <SocialLink
        href={`${apiBaseUrl}/auth/google`}
        label="Continue with Google"
        icon={<GoogleIcon />}
      />
    </div>
  );
}

function SocialLink({
  href,
  label,
  icon
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      className="
        box-border flex h-[54px] w-full items-center justify-center gap-2
        rounded-full border-2 border-[#E2E8F0] bg-white px-6 py-2
        text-sm font-medium leading-5 tracking-[0.015em] text-[#1E293B]
        transition-[border-color,background-color] duration-150 ease-out
        hover:border-[#CBD5E1] hover:bg-[#F8FAFC]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8761]/20
      "
    >
      <div className="h-6 w-6 shrink-0 flex items-center justify-center">
        {icon}
      </div>
      <span>{label}</span>
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
