export type FilterOp =
  | { fn: 'brightness'; amount: number }
  | { fn: 'contrast'; amount: number }
  | { fn: 'saturate'; amount: number }
  | { fn: 'grayscale'; amount: number }
  | { fn: 'sepia'; amount: number }
  | { fn: 'hue-rotate'; degrees: number };

export const EFFECTS = [
  { name: 'Original', ops: [] },
  { name: 'Warm', ops: [{ fn: 'sepia', amount: 0.35 }, { fn: 'saturate', amount: 1.25 }] },
  { name: 'Cool', ops: [{ fn: 'hue-rotate', degrees: 20 }, { fn: 'saturate', amount: 0.85 }] },
  { name: 'Mono', ops: [{ fn: 'grayscale', amount: 1 }] },
  { name: 'Vivid', ops: [{ fn: 'contrast', amount: 1.15 }, { fn: 'saturate', amount: 1.5 }] },
  { name: 'Fade', ops: [{ fn: 'contrast', amount: 0.88 }, { fn: 'saturate', amount: 0.78 }, { fn: 'brightness', amount: 1.06 }] },
  { name: 'Noir', ops: [{ fn: 'grayscale', amount: 1 }, { fn: 'contrast', amount: 1.35 }, { fn: 'brightness', amount: 0.92 }] }
] as const satisfies ReadonlyArray<{ name: string; ops: readonly FilterOp[] }>;

export type EffectName = (typeof EFFECTS)[number]['name'];

export const OVERLAY_COLORS = ['#ffffff', '#000000', '#0584fe', '#ff3b30', '#ffd60a', '#34c759', '#ff9f0a', '#af52de'] as const;

export const STICKERS = ['😂', '❤️', '🔥', '😍', '🎉', '👍', '😮', '🥳', '✨', '💯', '😭', '🙌', '👀', '⭐', '🤯', '🫶'] as const;

export type TextAlign = 'left' | 'center' | 'right';
export type OverlayBackground = 'none' | 'solid' | 'translucent';
export type OverlayKind = 'text' | 'sticker';

export type Overlay = {
  id: string;
  kind: OverlayKind;
  value: string;
  x: number;
  y: number;
  size: number;
  color: string;
  align: TextAlign;
  bold: boolean;
  italic: boolean;
  background: OverlayBackground;
};

export type Crop = { x: number; y: number; width: number; height: number };
export type Rotation = 0 | 90 | 180 | 270;
export type Adjustments = { brightness: number; contrast: number; saturation: number };

export type EditState = {
  effect: EffectName;
  adjustments: Adjustments;
  crop: Crop;
  rotation: Rotation;
  overlays: Overlay[];
};

export const FULL_CROP: Crop = { x: 0, y: 0, width: 1, height: 1 };
export const NEUTRAL_ADJUSTMENTS: Adjustments = { brightness: 100, contrast: 100, saturation: 100 };

export const initialEditState = (): EditState => ({
  effect: 'Original',
  adjustments: { ...NEUTRAL_ADJUSTMENTS },
  crop: { ...FULL_CROP },
  rotation: 0,
  overlays: []
});

export const createOverlay = (kind: OverlayKind, value: string): Overlay => ({
  id: crypto.randomUUID(),
  kind,
  value,
  x: 0.5,
  y: kind === 'sticker' ? 0.35 : 0.5,
  size: kind === 'sticker' ? 0.18 : 0.07,
  color: '#ffffff',
  align: 'center',
  bold: true,
  italic: false,
  background: 'none'
});

export const isCropped = (crop: Crop) => crop.x !== 0 || crop.y !== 0 || crop.width !== 1 || crop.height !== 1;

export const hasColorEdits = (state: EditState) =>
  state.effect !== 'Original' ||
  state.adjustments.brightness !== 100 ||
  state.adjustments.contrast !== 100 ||
  state.adjustments.saturation !== 100;

export const hasGeometryEdits = (state: EditState) => state.rotation !== 0 || isCropped(state.crop);

export const hasEdits = (state: EditState) =>
  hasColorEdits(state) || hasGeometryEdits(state) || state.overlays.length > 0;

export const filterOps = (state: EditState): FilterOp[] => {
  const preset = EFFECTS.find((item) => item.name === state.effect)?.ops ?? [];
  const { brightness, contrast, saturation } = state.adjustments;
  const ops: FilterOp[] = [...preset];
  if (brightness !== 100) ops.push({ fn: 'brightness', amount: brightness / 100 });
  if (contrast !== 100) ops.push({ fn: 'contrast', amount: contrast / 100 });
  if (saturation !== 100) ops.push({ fn: 'saturate', amount: saturation / 100 });
  return ops;
};

const serializeOp = (op: FilterOp) =>
  op.fn === 'hue-rotate' ? `hue-rotate(${op.degrees}deg)` : `${op.fn}(${op.amount})`;

export const cssFilter = (state: EditState) => {
  const ops = filterOps(state);
  return ops.length ? ops.map(serializeOp).join(' ') : 'none';
};

export const outputSize = (sourceWidth: number, sourceHeight: number, state: EditState) => {
  const width = Math.max(1, Math.round(sourceWidth * state.crop.width));
  const height = Math.max(1, Math.round(sourceHeight * state.crop.height));
  return state.rotation === 90 || state.rotation === 270 ? { width: height, height: width } : { width, height };
};
