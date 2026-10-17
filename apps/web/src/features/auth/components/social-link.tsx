import type { ReactNode } from 'react';

type Props = { href: string; label: string; icon: ReactNode };

export function SocialLink({ href, label, icon }: Props) {
  return (
    <a
      href={href}
      className="box-border flex h-[54px] w-full items-center justify-center gap-2 rounded-full border-2 border-[#E2E8F0] bg-white px-6 py-2 text-sm font-medium leading-5 tracking-[0.015em] text-[#1E293B] transition-[border-color,background-color] duration-150 ease-out hover:border-[#CBD5E1] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8761]/20"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">{icon}</span>
      <span>{label}</span>
    </a>
  );
}
