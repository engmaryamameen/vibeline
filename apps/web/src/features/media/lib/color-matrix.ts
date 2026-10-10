import type { FilterOp } from './editor-model';

export type ColorMatrix = readonly [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

const IDENTITY: ColorMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];

const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;

const multiply = (a: ColorMatrix, b: ColorMatrix): ColorMatrix => {
  const out: number[] = [];
  for (let row = 0; row < 3; row += 1) {
    const [a0, a1, a2, a3] = [a[row * 4], a[row * 4 + 1], a[row * 4 + 2], a[row * 4 + 3]] as [number, number, number, number];
    for (let column = 0; column < 3; column += 1) {
      out.push(a0 * b[column]! + a1 * b[4 + column]! + a2 * b[8 + column]!);
    }
    out.push(a0 * b[3] + a1 * b[7] + a2 * b[11] + a3);
  }
  return out as unknown as ColorMatrix;
};

const saturate = (amount: number): ColorMatrix => [
  LUMA_R + (1 - LUMA_R) * amount, LUMA_G - LUMA_G * amount, LUMA_B - LUMA_B * amount, 0,
  LUMA_R - LUMA_R * amount, LUMA_G + (1 - LUMA_G) * amount, LUMA_B - LUMA_B * amount, 0,
  LUMA_R - LUMA_R * amount, LUMA_G - LUMA_G * amount, LUMA_B + (1 - LUMA_B) * amount, 0
];

const sepia = (amount: number): ColorMatrix => {
  const keep = 1 - amount;
  return [
    0.393 + 0.607 * keep, 0.769 - 0.769 * keep, 0.189 - 0.189 * keep, 0,
    0.349 - 0.349 * keep, 0.686 + 0.314 * keep, 0.168 - 0.168 * keep, 0,
    0.272 - 0.272 * keep, 0.534 - 0.534 * keep, 0.131 + 0.869 * keep, 0
  ];
};

const hueRotate = (degrees: number): ColorMatrix => {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [
    0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928, 0,
    0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.14, 0.072 - cos * 0.072 - sin * 0.283, 0,
    0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072, 0
  ];
};

const scale = (amount: number): ColorMatrix => [amount, 0, 0, 0, 0, amount, 0, 0, 0, 0, amount, 0];

const contrast = (amount: number): ColorMatrix => {
  const intercept = (1 - amount) / 2;
  return [amount, 0, 0, intercept, 0, amount, 0, intercept, 0, 0, amount, intercept];
};

const matrixForOp = (op: FilterOp): ColorMatrix => {
  switch (op.fn) {
    case 'brightness':
      return scale(op.amount);
    case 'contrast':
      return contrast(op.amount);
    case 'saturate':
      return saturate(op.amount);
    case 'grayscale':
      return saturate(1 - Math.min(1, Math.max(0, op.amount)));
    case 'sepia':
      return sepia(Math.min(1, Math.max(0, op.amount)));
    case 'hue-rotate':
      return hueRotate(op.degrees);
  }
};

export const colorMatrixForOps = (ops: readonly FilterOp[]): ColorMatrix =>
  ops.reduce<ColorMatrix>((accumulated, op) => multiply(matrixForOp(op), accumulated), IDENTITY);

export const isIdentityMatrix = (matrix: ColorMatrix) => matrix.every((value, index) => Math.abs(value - IDENTITY[index]!) < 1e-6);

export const applyColorMatrix = (ctx: CanvasRenderingContext2D, width: number, height: number, matrix: ColorMatrix) => {
  if (isIdentityMatrix(matrix) || width <= 0 || height <= 0) return;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const [rr, rg, rb, ro, gr, gg, gb, go, br, bg, bb, bo] = matrix;
  const clamp = (value: number) => (value < 0 ? 0 : value > 255 ? 255 : value);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]! / 255;
    const g = data[i + 1]! / 255;
    const b = data[i + 2]! / 255;
    data[i] = clamp((rr * r + rg * g + rb * b + ro) * 255);
    data[i + 1] = clamp((gr * r + gg * g + gb * b + go) * 255);
    data[i + 2] = clamp((br * r + bg * g + bb * b + bo) * 255);
  }
  ctx.putImageData(image, 0, 0);
};
