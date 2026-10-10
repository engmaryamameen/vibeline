'use client';

import { Trash2 } from 'lucide-react';
import { STICKERS, type Overlay } from '../lib/editor-model';
import { EditorPanelShell } from './editor-panel-shell';

type Props = {
  overlays: Overlay[];
  onAdd: (value: string) => void;
  onUpdate: (id: string, patch: Partial<Omit<Overlay, 'id' | 'kind'>>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
};

export function EditorStickerPanel({ overlays, onAdd, onUpdate, onRemove, onClose }: Props) {
  const stickers = overlays.filter((overlay) => overlay.kind === 'sticker');
  const active = stickers.at(-1);

  return (
    <EditorPanelShell title="Stickers" onClose={onClose}>
      <div className="grid grid-cols-8 gap-1.5">
        {STICKERS.map((sticker) => (
          <button
            key={sticker}
            type="button"
            onClick={() => onAdd(sticker)}
            aria-label={`Add ${sticker} sticker`}
            className="grid aspect-square place-items-center rounded-lg text-[22px] transition-transform hover:bg-white/15 active:scale-90"
          >
            {sticker}
          </button>
        ))}
      </div>

      {active && (
        <div className="mt-4 space-y-3 border-t border-white/15 pt-3 text-white">
          <label className="block text-sm">
            <span className="flex items-baseline justify-between">
              <span className="text-white/70">Last sticker size</span>
              <span className="tabular-nums text-white/55">{Math.round(active.size * 100)}</span>
            </span>
            <input
              type="range"
              aria-label="Sticker size"
              min={6}
              max={45}
              value={Math.round(active.size * 100)}
              onChange={(event) => onUpdate(active.id, { size: Number(event.target.value) / 100 })}
              className="mt-1 w-full accent-white"
            />
          </label>
          <button
            type="button"
            onClick={() => onRemove(active.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-500/80 py-2.5 text-xs font-semibold text-white hover:bg-red-500"
          >
            <Trash2 size={14} /> Remove last sticker
          </button>
        </div>
      )}

      {stickers.length === 0 && <p className="mt-3 text-xs text-white/55">Tap a sticker to place it, then drag it on the preview.</p>}
    </EditorPanelShell>
  );
}
