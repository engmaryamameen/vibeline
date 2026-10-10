import { applyColorMatrix, colorMatrixForOps, type ColorMatrix } from './color-matrix';
import { cssFilter, filterOps, outputSize, type EditState, type Overlay } from './editor-model';
import { supportsCanvasFilter, supportsRoundRect } from './media-capabilities';

export type FrameSource = HTMLVideoElement | HTMLImageElement | ImageBitmap;

export type RenderPlan = {
  width: number;
  height: number;
  useCanvasFilter: boolean;
  matrix: ColorMatrix | null;
};

export const sourceDimensions = (source: FrameSource) => {
  if (source instanceof HTMLVideoElement) return { width: source.videoWidth, height: source.videoHeight };
  if (source instanceof HTMLImageElement) return { width: source.naturalWidth, height: source.naturalHeight };
  return { width: source.width, height: source.height };
};

export const createRenderPlan = (sourceWidth: number, sourceHeight: number, state: EditState, allowMatrixFallback: boolean): RenderPlan => {
  const { width, height } = outputSize(sourceWidth, sourceHeight, state);
  const ops = filterOps(state);
  const useCanvasFilter = ops.length > 0 && supportsCanvasFilter();
  return {
    width,
    height,
    useCanvasFilter,
    matrix: ops.length > 0 && !useCanvasFilter && allowMatrixFallback ? colorMatrixForOps(ops) : null
  };
};

const fontFor = (overlay: Overlay, pixels: number) => {
  const style = overlay.italic ? 'italic ' : '';
  const weight = overlay.bold ? '700' : '400';
  return `${style}${weight} ${pixels}px system-ui, -apple-system, "Segoe UI", sans-serif`;
};

const fillBox = (ctx: CanvasRenderingContext2D, left: number, top: number, width: number, height: number, radius: number) => {
  ctx.beginPath();
  if (supportsRoundRect()) ctx.roundRect(left, top, width, height, radius);
  else ctx.rect(left, top, width, height);
  ctx.fill();
};

const drawOverlay = (ctx: CanvasRenderingContext2D, overlay: Overlay, width: number, height: number) => {
  const fontPixels = Math.max(8, overlay.size * height);
  const lineHeight = fontPixels * 1.2;
  const lines = overlay.value.split('\n');
  const x = overlay.x * width;
  const centerY = overlay.y * height;
  const top = centerY - ((lines.length - 1) * lineHeight) / 2;

  ctx.save();
  ctx.font = fontFor(overlay, fontPixels);
  ctx.textAlign = overlay.align;
  ctx.textBaseline = 'middle';

  if (overlay.background !== 'none') {
    const paddingX = fontPixels * 0.32;
    const paddingY = fontPixels * 0.18;
    ctx.fillStyle = overlay.background === 'solid' ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.42)';
    for (const [index, line] of lines.entries()) {
      const boxWidth = ctx.measureText(line).width + paddingX * 2;
      const lineY = top + index * lineHeight;
      const boxLeft = overlay.align === 'center' ? x - boxWidth / 2 : overlay.align === 'right' ? x - boxWidth + paddingX : x - paddingX;
      fillBox(ctx, boxLeft, lineY - lineHeight / 2 - paddingY, boxWidth, lineHeight + paddingY * 2, Math.min(fontPixels * 0.28, boxWidth / 2));
    }
  } else if (overlay.kind === 'text') {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, fontPixels / 10);
    ctx.strokeStyle = 'rgba(0,0,0,0.72)';
    for (const [index, line] of lines.entries()) ctx.strokeText(line, x, top + index * lineHeight);
  }

  ctx.fillStyle = overlay.color;
  for (const [index, line] of lines.entries()) ctx.fillText(line, x, top + index * lineHeight);
  ctx.restore();
};

export const renderFrame = (ctx: CanvasRenderingContext2D, source: FrameSource, state: EditState, plan: RenderPlan) => {
  const { width: sourceWidth, height: sourceHeight } = sourceDimensions(source);
  if (!sourceWidth || !sourceHeight) return;

  const { width, height } = plan;
  const sx = state.crop.x * sourceWidth;
  const sy = state.crop.y * sourceHeight;
  const sw = Math.max(1, state.crop.width * sourceWidth);
  const sh = Math.max(1, state.crop.height * sourceHeight);
  const rotated = state.rotation === 90 || state.rotation === 270;
  const drawWidth = rotated ? height : width;
  const drawHeight = rotated ? width : height;

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  if (plan.useCanvasFilter) ctx.filter = cssFilter(state);
  ctx.translate(width / 2, height / 2);
  if (state.rotation) ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.drawImage(source, sx, sy, sw, sh, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();

  if (plan.matrix) applyColorMatrix(ctx, width, height, plan.matrix);

  for (const overlay of state.overlays) drawOverlay(ctx, overlay, width, height);
};

export const prepareCanvas = (canvas: HTMLCanvasElement, plan: RenderPlan) => {
  if (canvas.width !== plan.width) canvas.width = plan.width;
  if (canvas.height !== plan.height) canvas.height = plan.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is unavailable');
  return ctx;
};
