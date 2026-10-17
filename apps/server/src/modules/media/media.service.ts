import { randomUUID } from 'node:crypto';
import { maxBytesForMediaKind, mediaAssetUrl, mediaKindFromMimeType } from '@vibeline/contracts';
import { AppError } from '@/common/errors/app-error';
import { mediaRepository, type StoredMediaAsset } from './media.repository';
import { sniffMediaType } from './media.sniff';
import { mediaStorage } from './media.storage';

const toPublicAsset = (asset: StoredMediaAsset) => ({
  id: asset.id,
  url: mediaAssetUrl(asset.id),
  mimeType: asset.mimeType,
  sizeBytes: asset.sizeBytes,
  originalFilename: asset.originalFilename ?? undefined
});

export const mediaService = {
  async upload(userId: string, data: Buffer, filename?: string, declaredContentType?: string) {
    const mimeType = sniffMediaType(data, declaredContentType);
    if (!mimeType) {
      throw new AppError(400, 'UNSUPPORTED_MEDIA', 'Only JPEG, PNG, WebP, GIF images, WebM/OGG/MP4 audio and WebM/MP4 video are accepted');
    }

    const kind = mediaKindFromMimeType(mimeType)!;
    const maxBytes = maxBytesForMediaKind(kind);
    if (!data.length || data.length > maxBytes) {
      throw new AppError(400, 'INVALID_MEDIA_SIZE', `${kind} uploads must be between 1 byte and ${Math.floor(maxBytes / 1024 / 1024)} MB`);
    }

    const id = randomUUID();
    await mediaStorage.put(id, data);
    try {
      const asset = await mediaRepository.create({
        id,
        ownerUserId: userId,
        storageKey: id,
        mimeType,
        sizeBytes: data.length,
        originalFilename: filename?.slice(0, 255)
      });
      return toPublicAsset(asset);
    } catch (error) {
      await mediaStorage.delete(id);
      throw error;
    }
  },

  async content(userId: string, id: string) {
    const asset = await mediaRepository.find(id);
    if (!asset) throw new AppError(404, 'MEDIA_NOT_FOUND', 'Media not found');
    if (!(await mediaRepository.isReadableBy(id, userId))) {
      throw new AppError(404, 'MEDIA_NOT_FOUND', 'Media not found');
    }
    return { asset, stream: mediaStorage.read(asset.storageKey) };
  }
};
