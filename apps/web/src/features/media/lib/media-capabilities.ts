const VIDEO_RECORDING_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4'
];

const AUDIO_RECORDING_TYPES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/mp4'];

let canvasFilterSupport: boolean | undefined;
let roundRectSupport: boolean | undefined;

export const supportsCanvasFilter = () => {
  if (canvasFilterSupport !== undefined) return canvasFilterSupport;
  canvasFilterSupport = false;
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx && 'filter' in ctx) {
      ctx.filter = 'grayscale(1)';
      canvasFilterSupport = ctx.filter.includes('grayscale');
    }
  } catch {
    canvasFilterSupport = false;
  }
  return canvasFilterSupport;
};

export const supportsRoundRect = () => {
  if (roundRectSupport !== undefined) return roundRectSupport;
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    roundRectSupport = typeof ctx?.roundRect === 'function';
  } catch {
    roundRectSupport = false;
  }
  return roundRectSupport ?? false;
};

export const supportsMediaRecorder = () => typeof MediaRecorder !== 'undefined';

const pickRecordingType = (candidates: string[]) => {
  if (!supportsMediaRecorder()) return undefined;
  return candidates.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch {
      return false;
    }
  });
};

export const pickVideoRecordingType = () => pickRecordingType(VIDEO_RECORDING_TYPES);
export const pickAudioRecordingType = () => pickRecordingType(AUDIO_RECORDING_TYPES);

export const supportsCanvasCaptureStream = () => typeof HTMLCanvasElement !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function';

export const canExportVideo = () => supportsMediaRecorder() && supportsCanvasCaptureStream() && Boolean(pickVideoRecordingType());

export const extensionForMimeType = (mimeType: string) => {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
};
