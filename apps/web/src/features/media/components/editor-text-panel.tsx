'use client';

import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Plus, Trash2 } from 'lucide-react';
import { OVERLAY_COLORS, type Overlay, type OverlayBackground, type TextAlign } from '../lib/editor-model';
import { EditorPanelShell } from './editor-panel-shell';

type Props = {
  overlays: Overlay[];
  selected: Overlay | undefined;
  onClose: () => void;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Omit<Overlay, 'id' | 'kind'>>) => void;
  onRemove: (id: string) => void;
};

const ALIGNMENTS: Array<{ value: TextAlign; icon: typeof AlignLeft; label: string }> = [
  { value: 'left', icon: AlignLeft, label: 'Align left' },
  { value: 'center', icon: AlignCenter, label: 'Align centre' },
  { value: 'right', icon: AlignRight, label: 'Align right' }
];

const BACKGROUNDS: Array<{ value: OverlayBackground; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'translucent', label: 'Soft' },
  { value: 'solid', label: 'Solid' }
];

const toggleClass = (active: boolean) =>
  `grid h-9 w-9 place-items-center rounded-lg transition-colors ${active ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'}`;

export function EditorTextPanel({ overlays, selected, onClose, onAdd, onSelect, onUpdate, onRemove }: Props) {
  const textOverlays = overlays.filter((overlay) => overlay.kind === 'text');
  const active = selected?.kind === 'text' ? selected : textOverlays.at(-1);

  return (
    <EditorPanelShell title="Text" onClose={onClose}>
      {textOverlays.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {textOverlays.map((overlay, index) => (
            <button
              key={overlay.id}
              type="button"
              onClick={() => onSelect(overlay.id)}
              aria-pressed={active?.id === overlay.id}
              className={`max-w-[120px] truncate rounded-full px-3 py-1 text-xs ${
                active?.id === overlay.id ? 'bg-white text-black' : 'bg-white/15 text-white'
              }`}
            >
              {overlay.value.split('\n')[0] || `Layer ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {active ? (
        <div className="space-y-3 text-white">
          <label className="block text-sm">
            <span className="text-white/70">Text</span>
            <textarea
              aria-label="Overlay text"
              maxLength={300}
              rows={2}
              value={active.value}
              onChange={(event) => onUpdate(active.id, { value: event.target.value })}
              className="mt-1 w-full resize-none rounded-lg bg-white/15 p-2 text-white outline-none focus:ring-2 focus:ring-white/40"
            />
          </label>

          <label className="block text-sm">
            <span className="text-white/70">Size {Math.round(active.size * 100)}</span>
            <input
              type="range"
              aria-label="Text size"
              min={3}
              max={22}
              value={Math.round(active.size * 100)}
              onChange={(event) => onUpdate(active.id, { size: Number(event.target.value) / 100 })}
              className="mt-1 w-full accent-white"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {ALIGNMENTS.map(({ value, icon: Icon, label }) => (
              <button key={value} type="button" aria-label={label} aria-pressed={active.align === value} onClick={() => onUpdate(active.id, { align: value })} className={toggleClass(active.align === value)}>
                <Icon size={16} />
              </button>
            ))}
            <span className="mx-1 h-6 w-px bg-white/20" />
            <button type="button" aria-label="Bold" aria-pressed={active.bold} onClick={() => onUpdate(active.id, { bold: !active.bold })} className={toggleClass(active.bold)}>
              <Bold size={16} />
            </button>
            <button type="button" aria-label="Italic" aria-pressed={active.italic} onClick={() => onUpdate(active.id, { italic: !active.italic })} className={toggleClass(active.italic)}>
              <Italic size={16} />
            </button>
          </div>

          <div>
            <span className="text-sm text-white/70">Colour</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {OVERLAY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Text colour ${color}`}
                  aria-pressed={active.color === color}
                  onClick={() => onUpdate(active.id, { color })}
                  style={{ backgroundColor: color }}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${active.color === color ? 'scale-110 border-white' : 'border-white/30'}`}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm text-white/70">Background</span>
            <div className="mt-1 flex gap-2">
              {BACKGROUNDS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active.background === value}
                  onClick={() => onUpdate(active.id, { background: value })}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${active.background === value ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={onAdd} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25">
              <Plus size={14} /> Add layer
            </button>
            <button type="button" onClick={() => onRemove(active.id)} className="flex items-center gap-1.5 rounded-full bg-red-500/80 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500">
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={onAdd} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 py-3 text-sm font-semibold text-white hover:bg-white/25">
          <Plus size={16} /> Add text
        </button>
      )}
    </EditorPanelShell>
  );
}
