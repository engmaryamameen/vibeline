'use client';

import { useCallback, useState } from 'react';
import type { EditState } from '../lib/editor-model';
import { exportEditedMedia, MediaExportError } from '../lib/export-media';

export type MediaExportState = {
  busy: boolean;
  progress: number | undefined;
  error: MediaExportError | Error | undefined;
  notice: string;
  run: (draft: File, state: EditState, send: (file: File) => Promise<void>) => Promise<void>;
  sendOriginal: (draft: File, send: (file: File) => Promise<void>) => Promise<void>;
  clear: () => void;
};

export const useMediaExport = (): MediaExportState => {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number>();
  const [error, setError] = useState<MediaExportError | Error>();
  const [notice, setNotice] = useState('');

  const clear = useCallback(() => {
    setError(undefined);
    setNotice('');
    setProgress(undefined);
  }, []);

  const run = useCallback(async (draft: File, state: EditState, send: (file: File) => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    clear();
    try {
      const result = await exportEditedMedia(draft, state, { onVideoProgress: setProgress });
      setProgress(undefined);
      if (result.reencoded && !result.audioPreserved && draft.type.startsWith('video/')) {
        setNotice('Audio could not be preserved by this browser, so the edited video is silent.');
      }
      await send(result.file);
    } catch (caught) {
      setProgress(undefined);
      setError(caught instanceof Error ? caught : new Error('Media could not be prepared.'));
    } finally {
      setBusy(false);
    }
  }, [busy, clear]);

  const sendOriginal = useCallback(async (draft: File, send: (file: File) => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    clear();
    try {
      await send(draft);
    } catch {
      setError(new Error('The original media could not be sent. Try again.'));
    } finally {
      setBusy(false);
    }
  }, [busy, clear]);

  return { busy, progress, error, notice, run, sendOriginal, clear };
};
