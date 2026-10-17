import type { Crop } from './editor-model';

export const CROP_ASPECTS = [
  { label: 'Original', value: null },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 }
] as const;

export type CropAspect = (typeof CROP_ASPECTS)[number]['value'];

export type CropControls = { aspect: CropAspect; zoom: number; centerX: number; centerY: number };

export const DEFAULT_CROP_CONTROLS: CropControls = { aspect: null, zoom: 1, centerX: 0.5, centerY: 0.5 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const cropFromControls = (sourceAspect: number, controls: CropControls): Crop => {
  const { aspect, zoom } = controls;
  let width = 1;
  let height = 1;

  if (aspect !== null && sourceAspect > 0) {
    if (aspect >= sourceAspect) height = clamp(sourceAspect / aspect, 0, 1);
    else width = clamp(aspect / sourceAspect, 0, 1);
  }

  width = clamp(width / zoom, 0.05, 1);
  height = clamp(height / zoom, 0.05, 1);

  const x = clamp(controls.centerX - width / 2, 0, 1 - width);
  const y = clamp(controls.centerY - height / 2, 0, 1 - height);
  return { x, y, width, height };
};

export const controlsFromCrop = (crop: Crop): CropControls => ({
  aspect: null,
  zoom: crop.width < 1 || crop.height < 1 ? 1 / Math.max(crop.width, crop.height) : 1,
  centerX: crop.x + crop.width / 2,
  centerY: crop.y + crop.height / 2
});
