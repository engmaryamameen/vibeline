import { MessageCircleMore, Sparkles } from 'lucide-react';

export function AuthVisual() {
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
          Keep your conversations and context in one calm place, with AI ready when you want help thinking, writing, or
          moving forward.
        </p>
      </div>
    </aside>
  );
}
