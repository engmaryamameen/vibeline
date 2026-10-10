'use client';

import { MediaExportError } from '../lib/export-media';

type Props = {
  error: MediaExportError | Error;
  busy: boolean;
  onSendOriginal: () => void;
  onDismiss: () => void;
};

const OFFERS_ORIGINAL = new Set(['unsupported-video-export', 'unsupported-video-color']);

export function MediaExportFallback({ error, busy, onSendOriginal, onDismiss }: Props) {
  const canSendOriginal = error instanceof MediaExportError && OFFERS_ORIGINAL.has(error.reason);

  return (
    <div role="alert" className="mt-3 rounded-2xl bg-red-600/90 p-3 text-sm text-white motion-safe:animate-slide-up">
      <p>{error.message}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {canSendOriginal && (
          <button
            type="button"
            disabled={busy}
            onClick={onSendOriginal}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
          >
            Send original without edits
          </button>
        )}
        <button type="button" onClick={onDismiss} className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold">
          Keep editing
        </button>
      </div>
    </div>
  );
}
