import { z } from 'zod';

export const MEDIA_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const MEDIA_AUDIO_MIME_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4'] as const;
export const MEDIA_VIDEO_MIME_TYPES = ['video/webm', 'video/mp4'] as const;

export const MEDIA_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MEDIA_MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const MEDIA_MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MEDIA_MAX_UPLOAD_BYTES = MEDIA_MAX_VIDEO_BYTES;

export const MEDIA_UPLOAD_CONTENT_TYPES = [
  ...MEDIA_IMAGE_MIME_TYPES,
  ...MEDIA_AUDIO_MIME_TYPES,
  ...MEDIA_VIDEO_MIME_TYPES
] as const;

export type MediaKind = 'image' | 'audio' | 'video';

export const baseMimeType = (value: string) => value.split(';')[0]!.trim().toLowerCase();

export const mediaKindFromMimeType = (value: string): MediaKind | undefined => {
  const base = baseMimeType(value);
  if (base.startsWith('image/')) return 'image';
  if (base.startsWith('audio/')) return 'audio';
  if (base.startsWith('video/')) return 'video';
  return undefined;
};

export const maxBytesForMediaKind = (kind: MediaKind) =>
  kind === 'video' ? MEDIA_MAX_VIDEO_BYTES : kind === 'audio' ? MEDIA_MAX_AUDIO_BYTES : MEDIA_MAX_IMAGE_BYTES;

export const isAudioMedia = (mimeType: string, filename?: string | null) => {
  const base = baseMimeType(mimeType);
  if (base.startsWith('audio/')) return true;
  if (base.startsWith('video/') || base.startsWith('image/')) return false;
  return /\.(?:ogg|oga|opus|m4a|webm)$/i.test(filename ?? '');
};

export const isVideoMedia = (mimeType: string, filename?: string | null) => {
  const base = baseMimeType(mimeType);
  if (base.startsWith('video/')) return true;
  if (base.startsWith('audio/') || base.startsWith('image/')) return false;
  return /\.(?:mp4|mov|m4v)$/i.test(filename ?? '');
};

export const isImageMedia = (mimeType: string, filename?: string | null) =>
  !isAudioMedia(mimeType, filename) && !isVideoMedia(mimeType, filename);

export const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  originalFilename: z.string().nullish().transform((value) => value ?? undefined)
});
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export const mediaAssetResponseSchema = z.object({ asset: mediaAssetSchema });

export const mediaAssetUrl = (mediaAssetId: string) => `/media/assets/${mediaAssetId}/content`;

export type MediaPreviewCounts = { attachmentCount: number; hasAudio: boolean; hasVideo: boolean };
export type MediaPreviewKind = 'none' | 'photo' | 'photos' | 'video' | 'voice';
export type MediaPreview = { kind: MediaPreviewKind; label: string };

export const mediaPreview = ({ attachmentCount, hasAudio, hasVideo }: MediaPreviewCounts): MediaPreview => {
  if (hasAudio) return { kind: 'voice', label: 'Voice message' };
  if (hasVideo) return { kind: 'video', label: 'Video' };
  if (attachmentCount === 1) return { kind: 'photo', label: 'Photo' };
  if (attachmentCount > 1) return { kind: 'photos', label: `${attachmentCount} photos` };
  return { kind: 'none', label: '' };
};

export const mediaPreviewFromMimeTypes = (mimeTypes: string[]) =>
  mediaPreview({
    attachmentCount: mimeTypes.length,
    hasAudio: mimeTypes.some((type) => isAudioMedia(type)),
    hasVideo: mimeTypes.some((type) => isVideoMedia(type))
  });
