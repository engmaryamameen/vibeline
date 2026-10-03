'use client';

import type { ComponentType, InputHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, type LucideProps } from 'lucide-react';
import { Button, Input, VibeLineLogo } from '@vibeline/ui';
import { cn } from '@vibeline/utils';

type Feature = { icon: ComponentType<LucideProps>; title: string; description: string };

export function AuthShell({ eyebrow, title, accent, description, features = [], children }: { eyebrow?: string; title: string; accent: string; description: string; features?: Feature[]; children: ReactNode }) {
  return <main className="auth-stage min-h-[100dvh] lg:grid lg:grid-cols-[minmax(360px,0.92fr)_minmax(520px,1.08fr)]">
    <aside className="auth-story relative hidden overflow-hidden lg:flex lg:min-h-[100dvh] lg:flex-col lg:justify-between lg:p-10 xl:p-14">
      <div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" /><div className="auth-grid" />
      <Brand light />
      <div className="relative z-10 max-w-xl py-12">
        {eyebrow && <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-white/55">{eyebrow}</p>}
        <h1 className="text-balance text-[clamp(2.75rem,4.8vw,5.6rem)] font-semibold leading-[0.94] tracking-[-0.055em] text-white">{title}<span className="block text-white/45">{accent}</span></h1>
        <p className="mt-7 max-w-lg text-base leading-7 text-white/58 xl:text-lg">{description}</p>
        {features.length > 0 && <div className="mt-10 grid gap-3 xl:grid-cols-3">{features.map(({icon: Icon,title,description}) => <div key={title} className="auth-feature group"><Icon className="h-5 w-5 text-white/85"/><p className="mt-5 text-sm font-semibold text-white">{title}</p><p className="mt-1 text-xs leading-5 text-white/45">{description}</p></div>)}</div>}
      </div>
      <p className="relative z-10 text-xs tracking-wide text-white/35">Private by design · built for real conversations</p>
    </aside>
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
      <div className="auth-mobile-glow lg:hidden" />
      <div className="relative z-10 w-full max-w-[440px] animate-auth-enter">
        <div className="mb-10 lg:hidden"><Brand /></div>
        {children}
      </div>
    </section>
  </main>;
}

export function Brand({light=false}:{light?:boolean}) { return <Link href="/" className="relative z-10 inline-flex items-center gap-3" aria-label="VibeLine home"><VibeLineLogo size="md" variant={light?'light':'dark'} className="auth-logo"/><span className={cn('text-lg font-semibold tracking-[-0.03em]',light?'text-white':'text-content-primary')}>VibeLine</span></Link> }

export function AuthHeader({kicker,title,description}:{kicker?:string;title:string;description:string}) { return <header className="mb-8"><div className="mb-5 h-px w-10 bg-accent"/>{kicker&&<p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{kicker}</p>}<h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-content-primary sm:text-[2.35rem]">{title}</h2><p className="mt-3 max-w-sm text-sm leading-6 text-content-secondary sm:text-base">{description}</p></header> }

export function AuthField({label,icon:Icon,trailing,className,...props}: InputHTMLAttributes<HTMLInputElement>&{label:string;icon?:ComponentType<LucideProps>;trailing?:ReactNode}) { return <label className="block space-y-2"><span className="text-sm font-medium text-content-primary">{label}</span><div className="group relative">{Icon&&<Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted transition-colors group-focus-within:text-accent"/>}<Input className={cn('h-12 rounded-xl border-border bg-surface-panel/80 text-[15px] shadow-sm transition-all duration-200 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10',Icon&&'pl-11',trailing&&'pr-12',className)} {...props}/>{trailing}</div></label> }

export function PasswordToggle({visible,onClick}:{visible:boolean;onClick:()=>void}) { const Icon=visible?EyeOff:Eye; return <button type="button" onClick={onClick} aria-label={visible?'Hide password':'Show password'} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-content-muted transition hover:bg-surface-soft hover:text-content-primary"><Icon className="h-4 w-4"/></button> }

export function AuthNotice({children,tone='error'}:{children:ReactNode;tone?:'error'|'success'}) { const Icon=tone==='error'?AlertCircle:CheckCircle2; return <div role={tone==='error'?'alert':'status'} className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm leading-5',tone==='error'?'border-status-error/15 bg-status-error/5 text-status-error':'border-status-success/15 bg-status-success/5 text-status-success')}><Icon className="mt-0.5 h-4 w-4 shrink-0"/><span>{children}</span></div> }

export function SubmitButton({loading,children,loadingLabel}:{loading:boolean;children:ReactNode;loadingLabel:string}) { return <Button size="lg" type="submit" disabled={loading} className="auth-primary h-12 w-full rounded-xl text-[15px] font-semibold">{loading?<><Loader2 className="h-4 w-4 animate-spin"/>{loadingLabel}</>:children}</Button> }

export function SocialAuth({apiBaseUrl}:{apiBaseUrl:string}) { return <><div className="my-7 flex items-center gap-4"><span className="h-px flex-1 bg-border"/><span className="text-xs text-content-muted">or continue with</span><span className="h-px flex-1 bg-border"/></div><div className="grid grid-cols-2 gap-3"><SocialLink href={`${apiBaseUrl}/auth/google`} label="Google"><span className="text-base font-bold">G</span></SocialLink><SocialLink href={`${apiBaseUrl}/auth/github`} label="GitHub"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.71 1.26 3.37.97.1-.75.4-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.38-5.29 5.67.42.36.79 1.06.79 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"/></svg></SocialLink></div></> }
function SocialLink({href,label,children}:{href:string;label:string;children:ReactNode}) { return <a href={href} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-panel text-sm font-medium text-content-primary transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">{children}{label}</a> }
