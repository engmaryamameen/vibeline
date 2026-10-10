'use client';

import { useCallback, useEffect, useState } from 'react';
import { Crop as CropIcon, RotateCcw, Send, SlidersHorizontal, Smile, Type, Undo2, X } from 'lucide-react';
import { useMediaEditor } from '../hooks/use-media-editor';
import { useObjectUrl } from '../hooks/use-object-url';
import { cropFromControls, DEFAULT_CROP_CONTROLS, type CropControls } from '../lib/crop';
import { hasEdits, type EffectName } from '../lib/editor-model';
import { canExportVideo } from '../lib/media-capabilities';
import { EditorAdjustPanel } from './editor-adjust-panel';
import { EditorCanvas } from './editor-canvas';
import { EditorCropPanel } from './editor-crop-panel';
import { EditorStickerPanel } from './editor-sticker-panel';
import { EditorTextPanel } from './editor-text-panel';
import { EffectsRail } from './effects-rail';
import { MediaExportFallback } from './media-export-fallback';
import { useMediaExport } from '../hooks/use-media-export';

type Tool = 'text' | 'adjust' | 'crop' | 'stickers';

type Props = {
  draft: File;
  initialEffect?: EffectName;
  sending: boolean;
  sendLabel?: string;
  allowCaption?: boolean;
  onRetake: () => void;
  onClose: () => void;
  onSend: (file: File, caption?: string) => Promise<void>;
};

const TOOLS: Array<{ id: Tool; icon: typeof Type; label: string }> = [
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'stickers', icon: Smile, label: 'Stickers' },
  { id: 'crop', icon: CropIcon, label: 'Crop & rotate' },
  { id: 'adjust', icon: SlidersHorizontal, label: 'Adjust' }
];

export function MediaEditor({ draft, initialEffect = 'Original', sending, sendLabel = 'Send', allowCaption = false, onRetake, onClose, onSend }: Props) {
  const editor = useMediaEditor();
  const url = useObjectUrl(draft);
  const isVideo = draft.type.startsWith('video/');
  const [tool, setTool] = useState<Tool | null>(null);
  const [cropControls, setCropControls] = useState<CropControls>(DEFAULT_CROP_CONTROLS);
  const [sourceAspect, setSourceAspect] = useState(1);
  const [caption, setCaption] = useState('');
  const exportState = useMediaExport();

  const { setEffect, setCrop, reset } = editor;

  useEffect(() => {
    setEffect(initialEffect);
  }, [initialEffect, setEffect]);

  const onSourceReady = useCallback((width: number, height: number) => {
    setSourceAspect(height > 0 ? width / height : 1);
  }, []);

  useEffect(() => {
    if (cropControls === DEFAULT_CROP_CONTROLS) return;
    setCrop(cropFromControls(sourceAspect, cropControls));
  }, [sourceAspect, cropControls, setCrop]);

  const resetAll = () => {
    reset();
    setCropControls(DEFAULT_CROP_CONTROLS);
    setTool(null);
    exportState.clear();
  };

  const edited = hasEdits(editor.state);
  const busy = sending || exportState.busy;

  const send = async (file: File) => {
    await onSend(file, allowCaption ? caption.trim() || undefined : undefined);
  };

  const handleSend = () => {
    void exportState.run(draft, editor.state, send);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      <header className="flex h-16 shrink-0 items-center justify-between px-4">
        <button type="button" onClick={onClose} aria-label="Close editor" className="grid h-10 w-10 place-items-center rounded-full text-white transition-colors hover:bg-white/15">
          <X size={22} />
        </button>
        <div className="flex items-center gap-1">
          {edited && (
            <button
              type="button"
              onClick={resetAll}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/25 disabled:opacity-40"
            >
              <Undo2 size={14} /> Reset
            </button>
          )}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col px-3">
        {url && (
          <EditorCanvas
            url={url}
            isVideo={isVideo}
            state={editor.state}
            selectedOverlayId={editor.selectedOverlay?.id}
            onSourceReady={onSourceReady}
            onSelectOverlay={editor.selectOverlay}
            onMoveOverlay={(id, x, y) => editor.updateOverlay(id, { x, y })}
          />
        )}

        <nav aria-label="Editor tools" className="absolute right-3 top-2 flex flex-col gap-2 rounded-2xl bg-black/55 p-1.5 backdrop-blur">
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={tool === id}
              onClick={() => setTool((current) => (current === id ? null : id))}
              className={`grid h-11 w-11 place-items-center rounded-xl transition-colors ${tool === id ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}
            >
              <Icon size={20} />
            </button>
          ))}
        </nav>

        {tool === 'text' && (
          <EditorTextPanel
            overlays={editor.state.overlays}
            selected={editor.selectedOverlay}
            onClose={() => setTool(null)}
            onAdd={() => editor.addOverlay('text', 'Your text')}
            onSelect={editor.selectOverlay}
            onUpdate={editor.updateOverlay}
            onRemove={editor.removeOverlay}
          />
        )}
        {tool === 'stickers' && (
          <EditorStickerPanel
            overlays={editor.state.overlays}
            onAdd={(value) => editor.addOverlay('sticker', value)}
            onUpdate={editor.updateOverlay}
            onRemove={editor.removeOverlay}
            onClose={() => setTool(null)}
          />
        )}
        {tool === 'crop' && (
          <EditorCropPanel
            controls={cropControls}
            rotation={editor.state.rotation}
            onChange={setCropControls}
            onRotate={editor.rotate}
            onReset={() => {
              editor.resetCrop();
              setCropControls(DEFAULT_CROP_CONTROLS);
            }}
            onClose={() => setTool(null)}
          />
        )}
        {tool === 'adjust' && (
          <EditorAdjustPanel adjustments={editor.state.adjustments} onChange={editor.setAdjustment} onReset={editor.resetAdjustments} onClose={() => setTool(null)} />
        )}
      </div>

      <footer className="shrink-0 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <EffectsRail value={editor.state.effect} disabled={busy} onChange={editor.setEffect} />

        {allowCaption && (
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={500}
            disabled={busy}
            aria-label="Caption"
            placeholder="Add a caption…"
            className="mt-3 h-11 w-full rounded-xl bg-white/15 px-3 text-[15px] text-white outline-none placeholder:text-white/45 focus:ring-2 focus:ring-white/40 disabled:opacity-50"
          />
        )}

        {isVideo && !canExportVideo() && edited && (
          <p role="status" className="mt-2 text-center text-xs text-amber-300">
            This browser cannot re-encode video, so edits cannot be written into the file.
          </p>
        )}

        {exportState.notice && (
          <p role="status" className="mt-2 text-center text-xs text-amber-300">
            {exportState.notice}
          </p>
        )}

        {exportState.error && (
          <MediaExportFallback
            error={exportState.error}
            busy={busy}
            onSendOriginal={() => void exportState.sendOriginal(draft, send)}
            onDismiss={exportState.clear}
          />
        )}

        {exportState.progress !== undefined && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-[#0584FE] transition-[width] duration-150" style={{ width: `${Math.round(exportState.progress * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-center text-xs text-white/70">Rendering edits into the video… {Math.round(exportState.progress * 100)}%</p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={busy}
            onClick={onRetake}
            className="flex items-center gap-2 rounded-full bg-white/20 px-5 py-3 text-white transition-colors hover:bg-white/30 disabled:opacity-40"
          >
            <RotateCcw size={18} /> Retake
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleSend}
            className="flex items-center gap-2 rounded-full bg-[#0584FE] px-6 py-3 font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            <Send size={18} /> {busy ? 'Processing…' : sendLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}
