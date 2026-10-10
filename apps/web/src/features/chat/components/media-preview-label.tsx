import type { MediaPreviewKind } from '@vibeline/contracts';
import { MicrophoneIcon, PhotoIcon, PhotoStackIcon, VideoIcon } from '@/src/shared/assets/svg';

const ICONS = {
  photo: PhotoIcon,
  photos: PhotoStackIcon,
  video: VideoIcon,
  voice: MicrophoneIcon
} as const;

type Props = { kind: MediaPreviewKind; label: string };

export function MediaPreviewLabel({ kind, label }: Props) {
  if (kind === 'none' || !label) return null;
  const Icon = ICONS[kind];
  return (
    <span className="inline-flex min-w-0 items-center gap-1 align-middle">
      <Icon width={14} height={14} className="shrink-0 opacity-70" />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
