import { baseMimeType } from '@vibeline/contracts';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const EBML_MAGIC = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);

const startsWith = (data: Buffer, magic: Buffer) => data.length >= magic.length && data.subarray(0, magic.length).equals(magic);

const isPng = (data: Buffer) => startsWith(data, PNG_MAGIC);
const isJpeg = (data: Buffer) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
const isGif = (data: Buffer) => data.length >= 6 && ['GIF87a', 'GIF89a'].includes(data.subarray(0, 6).toString('latin1'));
const isWebp = (data: Buffer) =>
  data.length >= 12 && data.subarray(0, 4).toString('latin1') === 'RIFF' && data.subarray(8, 12).toString('latin1') === 'WEBP';
const isMatroska = (data: Buffer) => startsWith(data, EBML_MAGIC);
const isOgg = (data: Buffer) => data.length >= 4 && data.subarray(0, 4).toString('latin1') === 'OggS';
const isIsoBmff = (data: Buffer) => data.length >= 12 && data.subarray(4, 8).toString('latin1') === 'ftyp';

export const sniffMediaType = (data: Buffer, declaredContentType?: string): string | undefined => {
  if (isPng(data)) return 'image/png';
  if (isJpeg(data)) return 'image/jpeg';
  if (isGif(data)) return 'image/gif';
  if (isWebp(data)) return 'image/webp';

  const declared = declaredContentType ? baseMimeType(declaredContentType) : undefined;

  if (isMatroska(data)) return declared === 'audio/webm' ? 'audio/webm' : 'video/webm';
  if (isIsoBmff(data)) return declared === 'audio/mp4' ? 'audio/mp4' : 'video/mp4';
  if (isOgg(data)) return 'audio/ogg';

  return undefined;
};
