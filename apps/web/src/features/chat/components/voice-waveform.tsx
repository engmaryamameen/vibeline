import { cn } from '@vibeline/utils';

export const WAVEFORM_BAR_COUNT = 42;
export const fallbackWaveform = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => 0.22 + ((index * 17) % 13) / 18);

export const formatDuration = (seconds: number) => {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}`;
};

export const decodeWaveform = async (blob: Blob, count = WAVEFORM_BAR_COUNT) => {
  try {
    const context = new AudioContext();
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    const data = buffer.getChannelData(0);
    const size = Math.max(1, Math.floor(data.length / count));
    const bars = Array.from({ length: count }, (_, index) => {
      let peak = 0;
      const start = index * size;
      const end = Math.min(data.length, start + size);
      for (let i = start; i < end; i += 1) peak = Math.max(peak, Math.abs(data[i] ?? 0));
      return peak;
    });
    const max = Math.max(...bars, 0.01);
    void context.close();
    return bars.map((value) => Math.max(0.14, value / max));
  } catch {
    return fallbackWaveform;
  }
};

type Props = { bars: number[]; progress: number; own?: boolean; live?: boolean; level?: number };

export function VoiceWaveform({ bars, progress, own = false, live = false, level = 0 }: Props) {
  return (
    <div className="flex h-9 min-w-0 flex-1 items-center gap-[2px] overflow-hidden" aria-hidden="true">
      {bars.map((value, index) => {
        const active = index / Math.max(1, bars.length - 1) <= progress;
        const height = live ? Math.max(0.16, Math.min(1, value * (0.45 + level * 1.5))) : value;
        return (
          <span
            key={index}
            className={cn(
              'w-[3px] shrink-0 rounded-full transition-[height,background-color] duration-75',
              active ? (own ? 'bg-white' : 'bg-[#0584FE]') : own ? 'bg-white/35' : 'bg-black/20'
            )}
            style={{ height: `${Math.round(5 + height * 24)}px` }}
          />
        );
      })}
    </div>
  );
}
