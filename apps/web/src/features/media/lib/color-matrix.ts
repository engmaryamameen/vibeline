import type { FilterOp } from './editor-model';

export type ColorMatrix = readonly number[];

const IDENTITY: ColorMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];

const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;

const multiply = (a: ColorMatrix, b: ColorMatrix): ColorMatrix => {
  const out = new Array<number>(12).fill(0);
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      out[row * 4 + column] =
        a[row * 4]! * b[column]! + a[row * 4 + 1]! * b[4 + column]! + a[row * 4 + 2]! * b[8 + column]!;
    }
    out[row * 4 + 3] =
      a[row * 4]! * b[3]! + a[row * 4 + 1]! * b[7]! + a[row * 4 + 2]! * b[11]! + a[row * 4 + 3]!;
  }
  return out;
};

const saturateMatrix = (amount: number): ColorMatrix => [
  LUMA_R + (1 - LUMA_R) * amount, LUMA_G - LUMA_G * amount, LUMA_B - LUMA_B * amount, 0,
  LUMA_R - LUMA_R * amount, LUMA_G + (1 - LUMA_G) * amount, LUMA_B - LUMA_B * amount, 0,
  LUMA_R - LUMA_R * amount, LUMA_G - LUMA_G * amount, LUMA_B + (1 - LUMA_B) * amount, 0
];

const sepiaMatrix = (amount: number): ColorMatrix => {
  const inverse = 1 - amount;
  return [
    0.393 + 0.607 * inverse, 0.769 - 0.769 * inverse, 0.189 - 0.189 * inverse, 0,
    0.349 - 0.349 * inverse, 0.686 + 0.314 * inverse, 0.168 - 0.168 * inverse, 0,
    0.272 - 0.272 * inverse, 0.534 - 0.534 * inverse, 0.131 + 0.869 * inverse, 0
  ];
};

const hueRotateMatrix = (degrees: number): ColorMatrix => {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [
    0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928, 0,
    0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.14, 0.072 - cos * 0.072 - sin * 0.283, 0,
    0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072, 0
  ];
};

const scaleMatrix = (amount: number): ColorMatrix => [amount, 0, 0, 0, 0, amount, 0, 0, 0, 0, amount, 0];

const contrastMatrix = (amount: number): ColorMatrix => {
  const intercept = (1 - amount) / 2;
  return [amount, 0, 0, intercept, 0, amount, 0, intercept, 0, 0, amount, intercept];
};

const matrixForOp = (op: FilterOp): ColorMatrix => {
  switch (op.fn) {
    case 'brightness':
      return scaleMatrix(op.amount);
    case 'contrast':
      return contrastMatrix(op.amount);
    case 'saturate':
      return saturateMatrix(op.amount);
    case 'grayscale':
      return saturateMatrix(1 - Math.min(1, Math.max(0, op.amount)));
    case 'sepia':
      return sepiaMatrix(Math.min(1, Math.max(0, op.amount)));
    case 'hue-rotate':
      return hueRotateMatrix(op.degrees);
  }
};

export const colorMatrixForOps = (ops: readonly FilterOp[]): ColorMatrix =>
  ops.reduce<ColorMatrix>((accumulator, op) => multiply(matrixForOp(op), accumulator), IDENTITY);

export const isIdentityMatrix = (matrix: ColorMatrix) =>
  matrix.every((value, index) => Math.abs(value - IDENTITY[index]!) < 1e-6);

export const applyColorMatrix = (ctx: CanvasRenderingContext2D, width: number, height: number, matrix: ColorMatrix) => {
  if (isIdentityMatrix(matrix) || width <= 0 || height <= 0) return;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11] = matrix as number[];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]! / 255;
    const g = data[i + 1]! / 255;
    const b = data[i + 2]! / 255;
    data[i] = Math.max(0, Math.min(255, (m0! * r + m1! * g + m2! * b + m3!) * 255));
    data[i + 1] = Math.max(0, Math.min(255, (m4! * r + m5! * g + m6! * b + m7!) * 255));
    data[i + 2] = Math.max(0, Math.min(255, (m8! * r + m9! * g + m10! * b + m11!) * 255));
  }
  ctx.putImageData(image, 0, 0);
};
