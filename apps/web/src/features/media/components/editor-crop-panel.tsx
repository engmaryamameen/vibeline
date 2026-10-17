'use client';

import { RotateCcw, RotateCw } from 'lucide-react';
import { CROP_ASPECTS, type CropControls } from '../lib/crop';
import { EditorPanelShell } from './editor-panel-shell';

type Props = {
  controls: CropControls;
  rotation: number;
  onChange: (controls: CropControls) => void;
  onRotate: (direction: 1 | -1) => void;
  onReset: () => void;
  onClose: () => void;
};

export function EditorCropPanel({ controls, rotation, onChange, onRotate, onReset, onClose }: Props) {
  const update = (patch: Partial<CropControls>) => onChange({ ...controls, ...patch });

  return (
    <EditorPanelShell title="Crop & rotate" onClose={onClose}>
      <div className="space-y-3 text-white">
        <div>
          <span className="text-sm text-white/70">Aspect</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {CROP_ASPECTS.map(({ label, value }) => (
              <button
                key={label}
                type="button"
                aria-pressed={controls.aspect === value}
                onClick={() => update({ aspect: value })}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  controls.aspect === value ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-sm">
          <span className="flex items-baseline justify-between">
            <span className="text-white/70">Zoom</span>
            <span className="tabular-nums text-white/55">{controls.zoom.toFixed(1)}×</span>
          </span>
          <input
            type="range"
            aria-label="Zoom"
            min={10}
            max={40}
            value={Math.round(controls.zoom * 10)}
            onChange={(event) => update({ zoom: Number(event.target.value) / 10 })}
            className="mt-1 w-full accent-white"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-white/70">Horizontal</span>
            <input
              type="range"
              aria-label="Horizontal position"
              min={0}
              max={100}
              value={Math.round(controls.centerX * 100)}
              onChange={(event) => update({ centerX: Number(event.target.value) / 100 })}
              className="mt-1 w-full accent-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Vertical</span>
            <input
              type="range"
              aria-label="Vertical position"
              min={0}
              max={100}
              value={Math.round(controls.centerY * 100)}
              onChange={(event) => update({ centerY: Number(event.target.value) / 100 })}
              className="mt-1 w-full accent-white"
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">Rotate</span>
          <button type="button" aria-label="Rotate left" onClick={() => onRotate(-1)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 hover:bg-white/25">
            <RotateCcw size={16} />
          </button>
          <button type="button" aria-label="Rotate right" onClick={() => onRotate(1)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 hover:bg-white/25">
            <RotateCw size={16} />
          </button>
          <span className="ml-auto text-xs tabular-nums text-white/55">{rotation}°</span>
        </div>

        <button type="button" onClick={onReset} className="w-full rounded-xl bg-white/15 py-2.5 text-xs font-semibold text-white hover:bg-white/25">
          Reset crop & rotation
        </button>
      </div>
    </EditorPanelShell>
  );
}
