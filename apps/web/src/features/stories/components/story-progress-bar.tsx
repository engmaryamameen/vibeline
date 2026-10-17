type Props = { count: number; index: number; progress: number };

export function StoryProgressBar({ count, index, progress }: Props) {
  return (
    <div className="flex items-center gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={count} aria-valuenow={index + 1} aria-label={`Story ${index + 1} of ${count}`}>
      {Array.from({ length: count }, (_, position) => (
        <span key={position} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
          <span
            className="block h-full rounded-full bg-white"
            style={{ width: position < index ? '100%' : position === index ? `${Math.round(progress * 100)}%` : '0%' }}
          />
        </span>
      ))}
    </div>
  );
}
