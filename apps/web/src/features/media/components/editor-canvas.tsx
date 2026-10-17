'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Pause, Play } from 'lucide-react';
import { useEditorPreview } from '../hooks/use-editor-preview';
import type { EditState, Overlay } from '../lib/editor-model';

type Props = {
  url: string;
  isVideo: boolean;
  state: EditState;
  selectedOverlayId?: string;
  onSourceReady: (width: number, height: number) => void;
  onSelectOverlay: (id: string | undefined) => void;
  onMoveOverlay: (id: string, x: number, y: number) => void;
};

const clamp01 = (value: number) => Math.min(0.98, Math.max(0.02, value));

const hitTest = (overlays: Overlay[], x: number, y: number) => {
  for (let index = overlays.length - 1; index >= 0; index -= 1) {
    const overlay = overlays[index]!;
    const lines = overlay.value.split('\n').length;
    const halfHeight = (overlay.size * 1.2 * lines) / 2 + 0.01;
    const halfWidth = Math.max(0.08, (overlay.size * 0.55 * Math.max(...overlay.value.split('\n').map((line) => line.length), 1)) / 2);
    if (Math.abs(x - overlay.x) <= halfWidth && Math.abs(y - overlay.y) <= halfHeight) return overlay;
  }
  return undefined;
};

export function EditorCanvas({ url, isVideo, state, selectedOverlayId, onSourceReady, onSelectOverlay, onMoveOverlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const draggingRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  const sourceRef = isVideo ? videoRef : imageRef;
  useEditorPreview({ canvasRef, sourceRef, state, animate: isVideo && playing, ready });

  useEffect(() => {
    setReady(false);
    setPlaying(false);
  }, [url]);

  const handleReady = useCallback(
    (width: number, height: number) => {
      setReady(true);
      onSourceReady(width, height);
    },
    [onSourceReady]
  );

  const pointerToRelative = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pointerToRelative(event);
    const overlay = hitTest(state.overlays, x, y);
    onSelectOverlay(overlay?.id);
    if (!overlay) return;
    draggingRef.current = overlay.id;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const id = draggingRef.current;
    if (!id) return;
    const { x, y } = pointerToRelative(event);
    onMoveOverlay(id, clamp01(x), clamp01(y));
  };

  const endDrag = () => {
    draggingRef.current = null;
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  };

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label="Media preview. Drag text and stickers to reposition them."
        className="max-h-full max-w-full touch-none rounded-lg object-contain shadow-[0_8px_40px_rgba(0,0,0,.5)]"
        style={{ cursor: state.overlays.length ? 'move' : 'default' }}
      />

      {isVideo ? (
        <video
          ref={videoRef}
          src={url}
          playsInline
          loop
          preload="auto"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0"
          onLoadedData={(event) => handleReady(event.currentTarget.videoWidth, event.currentTarget.videoHeight)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      ) : (
        <img
          ref={imageRef}
          src={url}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0"
          onLoad={(event) => handleReady(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
        />
      )}

      {isVideo && ready && (
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={playing ? 'Pause preview' : 'Play preview'}
          className="absolute bottom-3 left-3 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white transition-transform active:scale-95 hover:bg-black/75"
        >
          {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>
      )}

      {selectedOverlayId && (
        <p className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] text-white/80">
          Drag to move
        </p>
      )}

      {!ready && <p className="absolute text-sm text-white/70">Loading preview…</p>}
    </div>
  );
}
