import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@vibeline/utils';
import birdLogo from '@/src/shared/assets/svg/vibeline-bird-logo-green.svg';

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className="relative z-10 inline-flex w-fit select-none items-center gap-1 transition-opacity hover:opacity-90"
      aria-label="VibeLine home"
    >
      <Image src={birdLogo} alt="" width={52} height={44} className="h-11 w-auto shrink-0" aria-hidden="true" />

      <span
        className={cn(
          'flex items-center font-display text-[26px] font-bold leading-none tracking-[-0.045em]',
          light ? 'text-white' : 'text-slate-900'
        )}
      >
        Vibe
        <span className="text-[#22C55E]">Line</span>
      </span>
    </Link>
  );
}
