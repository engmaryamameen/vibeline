'use client';

import { useEffect, useRef, useState } from 'react';
import { maxBytesForMediaKind, mediaKindFromMimeType } from '@vibeline/contracts';
import { useBodyScrollLock } from '@/src/shared/hooks/use-body-scroll-lock';
import { useDismiss } from '@/src/shared/hooks/use-dismiss';
import type { EffectName } from '../lib/editor-model';
import { CameraView } from './camera-view';
import { MediaEditor } from './media-editor';

type Props = {
  open: boolean;
  sending: boolean;
  allowVideo?: boolean;
  allowLibrary?: boolean;
  allowCaption?: boolean;
  sendLabel?: string;
  title?: string;
  onClose: () => void;
  onSend: (file: File, caption?: string) => Promise<void>;
};

const describeRejection = (file: File) => {
  const kind = mediaKindFromMimeType(file.type);
  if (!kind || kind === 'audio') return 'Choose an image or a video file.';
  const limit = maxBytesForMediaKind(kind);
  if (file.size > limit) return `${kind === 'video' ? 'Videos' : 'Images'} must be ${Math.floor(limit / 1024 / 1024)} MB or smaller.`;
  return undefined;
};

export function MediaCaptureDialog({
  open,
  sending,
  allowVideo = true,
  allowLibrary = true,
  allowCaption = false,
  sendLabel,
  title = 'Camera',
  onClose,
  onSend
}: Props) {
  const libraryRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<File | null>(null);
  const [draftEffect, setDraftEffect] = useState<EffectName>('Original');
  const [libraryError, setLibraryError] = useState('');

  useBodyScrollLock(open);

  useEffect(() => {
    if (open) return;
    setDraft(null);
    setDraftEffect('Original');
    setLibraryError('');
  }, [open]);

  useDismiss({ active: open, onDismiss: onClose, closeOnOutside: false });

  if (!open) return null;

  const acceptLibraryFile = (file: File | undefined) => {
    if (!file) return;
    const rejection = describeRejection(file);
    if (rejection) {
      setLibraryError(rejection);
      return;
    }
    if (!allowVideo && file.type.startsWith('video/')) {
      setLibraryError('Choose an image file.');
      return;
    }
    setLibraryError('');
    setDraftEffect('Original');
    setDraft(file);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] bg-black text-white motion-safe:animate-fade-in">
      {allowLibrary && (
        <input
          ref={libraryRef}
          type="file"
          accept={allowVideo ? 'image/*,video/*' : 'image/*'}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = '';
            acceptLibraryFile(file);
          }}
        />
      )}

      {draft ? (
        <MediaEditor
          draft={draft}
          initialEffect={draftEffect}
          sending={sending}
          sendLabel={sendLabel}
          allowCaption={allowCaption}
          onRetake={() => setDraft(null)}
          onClose={onClose}
          onSend={async (file, caption) => {
            await onSend(file, caption);
            setDraft(null);
            onClose();
          }}
        />
      ) : (
        <CameraView
          allowVideo={allowVideo}
          onClose={onClose}
          onChooseLibrary={allowLibrary ? () => libraryRef.current?.click() : undefined}
          onCapture={(file, effect) => {
            setDraftEffect(effect);
            setDraft(file);
          }}
        />
      )}

      {libraryError && (
        <div role="alert" className="absolute left-4 right-4 top-24 z-50 rounded-xl bg-red-600/90 p-3 text-sm">
          <p>{libraryError}</p>
          <button type="button" onClick={() => setLibraryError('')} className="mt-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
