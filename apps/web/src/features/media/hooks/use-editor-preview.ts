'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { EditState } from '../lib/editor-model';
import { createRenderPlan, prepareCanvas, renderFrame, sourceDimensions, type FrameSource } from '../lib/render-frame';

type Options = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  sourceRef: RefObject<HTMLVideoElement | HTMLImageElement | null>;
  state: EditState;
  animate: boolean;
  ready: boolean;
};

export const useEditorPreview = ({ canvasRef, sourceRef, state, animate, ready }: Options) => {
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const source = sourceRef.current;
    if (!canvas || !source || !ready) return;

    const paint = () => {
      const { width, height } = sourceDimensions(source as FrameSource);
      if (!width || !height) return;
      const plan = createRenderPlan(width, height, state, !animate);
      const ctx = prepareCanvas(canvas, plan);
      renderFrame(ctx, source as FrameSource, state, plan);
    };

    if (!animate) {
      paint();
      return;
    }

    const loop = () => {
      paint();
      frameRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, [canvasRef, sourceRef, state, animate, ready]);
};
