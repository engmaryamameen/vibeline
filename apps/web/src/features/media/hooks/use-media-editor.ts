'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  createOverlay,
  initialEditState,
  FULL_CROP,
  NEUTRAL_ADJUSTMENTS,
  type Adjustments,
  type Crop,
  type EditState,
  type EffectName,
  type Overlay,
  type OverlayKind,
  type Rotation
} from '../lib/editor-model';

export type MediaEditorController = {
  state: EditState;
  selectedOverlay: Overlay | undefined;
  selectOverlay: (id: string | undefined) => void;
  setEffect: (effect: EffectName) => void;
  setAdjustment: (key: keyof Adjustments, value: number) => void;
  setCrop: (crop: Crop) => void;
  rotate: (direction: 1 | -1) => void;
  addOverlay: (kind: OverlayKind, value: string) => void;
  updateOverlay: (id: string, patch: Partial<Omit<Overlay, 'id' | 'kind'>>) => void;
  removeOverlay: (id: string) => void;
  resetAdjustments: () => void;
  resetCrop: () => void;
  reset: () => void;
};

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

export const useMediaEditor = (): MediaEditorController => {
  const [state, setState] = useState<EditState>(initialEditState);
  const [selectedId, setSelectedId] = useState<string>();

  const selectedOverlay = useMemo(() => state.overlays.find((overlay) => overlay.id === selectedId), [state.overlays, selectedId]);

  const setEffect = useCallback((effect: EffectName) => setState((current) => ({ ...current, effect })), []);

  const setAdjustment = useCallback(
    (key: keyof Adjustments, value: number) => setState((current) => ({ ...current, adjustments: { ...current.adjustments, [key]: value } })),
    []
  );

  const setCrop = useCallback((crop: Crop) => setState((current) => ({ ...current, crop })), []);

  const rotate = useCallback(
    (direction: 1 | -1) =>
      setState((current) => {
        const index = ROTATIONS.indexOf(current.rotation);
        return { ...current, rotation: ROTATIONS[(index + direction + ROTATIONS.length) % ROTATIONS.length]! };
      }),
    []
  );

  const addOverlay = useCallback((kind: OverlayKind, value: string) => {
    const overlay = createOverlay(kind, value);
    setState((current) => ({ ...current, overlays: [...current.overlays, overlay] }));
    setSelectedId(overlay.id);
  }, []);

  const updateOverlay = useCallback(
    (id: string, patch: Partial<Omit<Overlay, 'id' | 'kind'>>) =>
      setState((current) => ({
        ...current,
        overlays: current.overlays.map((overlay) => (overlay.id === id ? { ...overlay, ...patch } : overlay))
      })),
    []
  );

  const removeOverlay = useCallback((id: string) => {
    setState((current) => ({ ...current, overlays: current.overlays.filter((overlay) => overlay.id !== id) }));
    setSelectedId((current) => (current === id ? undefined : current));
  }, []);

  const resetAdjustments = useCallback(() => setState((current) => ({ ...current, adjustments: { ...NEUTRAL_ADJUSTMENTS } })), []);
  const resetCrop = useCallback(() => setState((current) => ({ ...current, crop: { ...FULL_CROP }, rotation: 0 })), []);

  const reset = useCallback(() => {
    setState(initialEditState());
    setSelectedId(undefined);
  }, []);

  return {
    state,
    selectedOverlay,
    selectOverlay: setSelectedId,
    setEffect,
    setAdjustment,
    setCrop,
    rotate,
    addOverlay,
    updateOverlay,
    removeOverlay,
    resetAdjustments,
    resetCrop,
    reset
  };
};
