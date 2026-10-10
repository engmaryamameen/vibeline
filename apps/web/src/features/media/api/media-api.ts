import { mediaAssetResponseSchema } from '@vibeline/contracts';
import type { AuthorizedRequest } from '@/src/lib/authorized-request';

export const mediaApi = (request: AuthorizedRequest) => ({
  load: (url: string, signal?: AbortSignal) =>
    request<Blob>(url, { responseType: 'blob', cache: 'default', ...(signal ? { signal } : {}) }),

  upload: (file: File) =>
    request('/media/assets', {
      method: 'POST',
      rawBody: file,
      headers: {
        'content-type': file.type || 'application/octet-stream',
        'x-file-name': encodeURIComponent(file.name)
      },
      responseSchema: mediaAssetResponseSchema
    })
});

export type MediaApi = ReturnType<typeof mediaApi>;
