'use client';

import type { Adjustments } from '../lib/editor-model';
import { EditorPanelShell } from './editor-panel-shell';

type Props = {
  adjustments: Adjustments;
  onChange: (key: keyof Adjustments, value: number) => void;
  onReset: () => void;
  onClose: () => void;
};

const SLIDERS: Array<{ key: keyof Adjustments; label: string }> = [
  { key: 'brightness', label: 'Brightness' },
  { key: 'contrast', label: 'Contrast' },
  { key: 'saturation', label: 'Saturation' }
];

export function EditorAdjustPanel({ adjustments, onChange, onReset, onClose }: Props) {
  return (
    <EditorPanelShell title="Adjust" onClose={onClose}>
      <div className="space-y-3 text-white">
        {SLIDERS.map(({ key, label }) => (
          <label key={key} className="block text-sm">
            <span className="flex items-baseline justify-between">
              <span className="text-white/70">{label}</span>
              <span className="tabular-nums text-white/55">{adjustments[key]}%</span>
            </span>
            <input
              type="range"
              aria-label={label}
              min={0}
              max={200}
              value={adjustments[key]}
              onChange={(event) => onChange(key, Number(event.target.value))}
              className="mt-1 w-full accent-white"
            />
          </label>
        ))}
        <button type="button" onClick={onReset} className="w-full rounded-xl bg-white/15 py-2.5 text-xs font-semibold text-white hover:bg-white/25">
          Reset adjustments
        </button>
      </div>
    </EditorPanelShell>
  );
}
