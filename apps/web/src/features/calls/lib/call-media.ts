import type { CallMedia } from '@vibeline/contracts';

export type LocalMediaResult = { stream: MediaStream; videoDenied: boolean };

export class CallMediaError extends Error {
  constructor(
    message: string,
    readonly reason: 'unsupported' | 'microphone-denied' | 'device-missing' | 'device-busy' | 'unknown'
  ) {
    super(message);
    this.name = 'CallMediaError';
  }
}

const AUDIO_CONSTRAINTS: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

const classify = (error: unknown): CallMediaError => {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return new CallMediaError('Microphone access is blocked. Allow it in your browser settings to make calls.', 'microphone-denied');
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return new CallMediaError('No microphone was found on this device.', 'device-missing');
  }
  if (name === 'NotReadableError') {
    return new CallMediaError('Your microphone is already in use by another application.', 'device-busy');
  }
  return new CallMediaError('Microphone access could not be started.', 'unknown');
};

export const supportsCalling = () =>
  typeof window !== 'undefined' && typeof RTCPeerConnection !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

export const requestLocalMedia = async (media: CallMedia, facing: 'user' | 'environment' = 'user'): Promise<LocalMediaResult> => {
  if (!supportsCalling()) {
    throw new CallMediaError('Calling needs a modern browser served over HTTPS.', 'unsupported');
  }

  if (media === 'video') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      return { stream, videoDenied: false };
    } catch {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS }).catch((error: unknown) => {
        throw classify(error);
      });
      return { stream, videoDenied: true };
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS }).catch((error: unknown) => {
    throw classify(error);
  });
  return { stream, videoDenied: false };
};

export const requestCameraTrack = async (facing: 'user' | 'environment') => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } }
  });
  const track = stream.getVideoTracks()[0];
  if (!track) {
    stream.getTracks().forEach((item) => item.stop());
    throw new CallMediaError('No camera was found on this device.', 'device-missing');
  }
  return track;
};

export const hasMultipleCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput').length > 1;
  } catch {
    return false;
  }
};

export const stopStream = (stream: MediaStream | null | undefined) => {
  stream?.getTracks().forEach((track) => track.stop());
};
