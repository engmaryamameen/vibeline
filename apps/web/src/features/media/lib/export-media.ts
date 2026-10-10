import { hasColorEdits, hasEdits, type EditState } from './editor-model';
import { canExportVideo, extensionForMimeType, pickVideoRecordingType, supportsCanvasFilter } from './media-capabilities';
import { createRenderPlan, prepareCanvas, renderFrame, sourceDimensions } from './render-frame';

export class MediaExportError extends Error {
  constructor(
    message: string,
    readonly reason: 'unsupported-video-export' | 'unsupported-video-color' | 'decode-failed' | 'encode-failed'
  ) {
    super(message);
    this.name = 'MediaExportError';
  }
}

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new MediaExportError('Image encoding failed', 'encode-failed'))), type, quality);
  });

const loadImageBitmap = async (file: File) => {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new MediaExportError('This image could not be decoded for editing', 'decode-failed');
  }
};

export const exportImage = async (source: File, state: EditState): Promise<File> => {
  const bitmap = await loadImageBitmap(source);
  try {
    const plan = createRenderPlan(bitmap.width, bitmap.height, state, true);
    const canvas = document.createElement('canvas');
    const ctx = prepareCanvas(canvas, plan);
    renderFrame(ctx, bitmap, state, plan);
    const keepsAlpha = source.type === 'image/png' && state.overlays.every((overlay) => overlay.background !== 'solid');
    const type = keepsAlpha ? 'image/png' : 'image/jpeg';
    const blob = await canvasToBlob(canvas, type, 0.92);
    const extension = type === 'image/png' ? 'png' : 'jpg';
    return new File([blob], `vibeline-${Date.now()}.${extension}`, { type });
  } finally {
    bitmap.close();
  }
};

const loadVideoElement = (url: string) =>
  new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    const fail = () => reject(new MediaExportError('This video could not be decoded for editing', 'decode-failed'));
    video.onloadedmetadata = () => {
      if (!video.videoWidth || !video.videoHeight) fail();
      else resolve(video);
    };
    video.onerror = fail;
    video.src = url;
  });

type AudioBridge = { tracks: MediaStreamTrack[]; bridged: boolean; close: () => Promise<void> };

const SILENT_BRIDGE: AudioBridge = { tracks: [], bridged: false, close: async () => undefined };

const bridgeAudio = async (video: HTMLVideoElement): Promise<AudioBridge> => {
  const AudioContextCtor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return SILENT_BRIDGE;
  try {
    const context = new AudioContextCtor();
    if (context.state === 'suspended') await context.resume().catch(() => undefined);
    const source = context.createMediaElementSource(video);
    const destination = context.createMediaStreamDestination();
    source.connect(destination);
    return {
      tracks: destination.stream.getAudioTracks(),
      bridged: true,
      close: async () => {
        source.disconnect();
        await context.close().catch(() => undefined);
      }
    };
  } catch {
    return SILENT_BRIDGE;
  }
};

export type VideoExportProgress = (ratio: number) => void;
export type VideoExportResult = { file: File; audioPreserved: boolean };

export const exportVideo = async (source: File, state: EditState, onProgress?: VideoExportProgress): Promise<VideoExportResult> => {
  if (!canExportVideo()) {
    throw new MediaExportError('This browser cannot re-encode video, so the edits cannot be written into the file', 'unsupported-video-export');
  }
  if (hasColorEdits(state) && !supportsCanvasFilter()) {
    throw new MediaExportError('This browser cannot bake colour effects into video. Text, stickers, crop and rotation are supported.', 'unsupported-video-color');
  }

  const mimeType = pickVideoRecordingType()!;
  const objectUrl = URL.createObjectURL(source);
  const video = await loadVideoElement(objectUrl).catch((error: unknown) => {
    URL.revokeObjectURL(objectUrl);
    throw error;
  });

  const { width: sourceWidth, height: sourceHeight } = sourceDimensions(video);
  const plan = createRenderPlan(sourceWidth, sourceHeight, state, false);
  const canvas = document.createElement('canvas');
  const ctx = prepareCanvas(canvas, plan);
  const canvasStream = canvas.captureStream(30);
  const audio = await bridgeAudio(video);
  const combined = new MediaStream([...canvasStream.getVideoTracks(), ...audio.tracks]);
  const recorder = new MediaRecorder(combined, { mimeType });
  const chunks: Blob[] = [];
  let frame = 0;

  const cleanup = async () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    video.pause();
    canvasStream.getTracks().forEach((track) => track.stop());
    await audio.close();
    URL.revokeObjectURL(objectUrl);
  };

  try {
    const recorded = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => reject(new MediaExportError('Video encoding failed', 'encode-failed'));
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || mimeType }));
    });

    const paint = () => {
      renderFrame(ctx, video, state, plan);
      if (video.duration) onProgress?.(Math.min(1, video.currentTime / video.duration));
      frame = requestAnimationFrame(paint);
    };

    const finished = new Promise<void>((resolve, reject) => {
      video.onended = () => resolve();
      video.onerror = () => reject(new MediaExportError('Video playback failed during export', 'decode-failed'));
    });

    video.currentTime = 0;
    recorder.start(250);
    paint();
    await video.play();
    await finished;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    renderFrame(ctx, video, state, plan);
    if (recorder.state !== 'inactive') recorder.stop();

    const blob = await recorded;
    if (!blob.size) throw new MediaExportError('Video encoding produced an empty file', 'encode-failed');
    const type = blob.type || mimeType;
    return {
      file: new File([blob], `vibeline-${Date.now()}.${extensionForMimeType(type)}`, { type }),
      audioPreserved: audio.bridged
    };
  } finally {
    await cleanup();
  }
};

export type ExportResult = { file: File; reencoded: boolean; audioPreserved: boolean };

export const exportEditedMedia = async (
  source: File,
  state: EditState,
  options: { onVideoProgress?: VideoExportProgress } = {}
): Promise<ExportResult> => {
  if (!hasEdits(state)) return { file: source, reencoded: false, audioPreserved: true };
  if (source.type.startsWith('video/')) {
    const result = await exportVideo(source, state, options.onVideoProgress);
    return { file: result.file, reencoded: true, audioPreserved: result.audioPreserved };
  }
  return { file: await exportImage(source, state), reencoded: true, audioPreserved: true };
};
