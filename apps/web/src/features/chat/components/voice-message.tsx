'use client';

import { baseMimeType, type MessageAttachment } from '@vibeline/contracts';
import { cn } from '@vibeline/utils';
import { useMediaBlob } from '@/src/features/media/hooks/use-media-blob';
import { VoicePlayer } from './voice-player';

type Props = { attachment: MessageAttachment; own: boolean };

const playableAudioType = (attachment: MessageAttachment) => {
  if (attachment.mimeType.startsWith('audio/')) return baseMimeType(attachment.mimeType);
  const filename = attachment.originalFilename ?? '';
  if (/\.(?:ogg|oga|opus)$/i.test(filename)) return 'audio/ogg';
  if (/\.(?:m4a|mp4)$/i.test(filename)) return 'audio/mp4';
  return 'audio/webm';
};

export function VoiceMessage({ attachment, own }: Props) {
  const { src, failed } = useMediaBlob(attachment.url, playableAudioType(attachment));

  if (failed) {
    return (
      <p role="alert" className={cn('min-w-[200px] text-sm', own ? 'text-white/85' : 'text-black/55')}>
        Voice message unavailable
      </p>
    );
  }

  return <VoicePlayer src={src ?? ''} own={own} />;
}
