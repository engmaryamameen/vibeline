'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraFacing = 'user' | 'environment';

export type CameraStreamState = {
  stream: MediaStream | null;
  ready: boolean;
  error: string;
  hasAudio: boolean;
  canSwitch: boolean;
  setMicrophoneEnabled: (enabled: boolean) => void;
  retry: () => void;
};

const permissionMessage = (error: unknown) => {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera access is blocked. Allow the camera in your browser settings and try again.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this device.';
  if (name === 'NotReadableError') return 'The camera is already in use by another application.';
  return 'The camera could not be started. Check your device and try again.';
};

export const useCameraStream = (active: boolean, facing: CameraFacing): CameraStreamState => {
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [canSwitch, setCanSwitch] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setReady(false);
  }, []);

  useEffect(() => {
    if (!active) {
      stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera capture needs a modern browser served over HTTPS.');
      return;
    }

    let cancelled = false;
    setError('');
    setReady(false);

    const open = async () => {
      const video: MediaTrackConstraints = { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } };
      let media: MediaStream;
      try {
        media = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      } catch {
        try {
          media = await navigator.mediaDevices.getUserMedia({ video, audio: false });
        } catch (videoError) {
          if (!cancelled) setError(permissionMessage(videoError));
          return;
        }
      }

      if (cancelled) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }

      media.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      streamRef.current = media;
      setStream(media);
      setReady(true);

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setCanSwitch(devices.filter((device) => device.kind === 'videoinput').length > 1);
      } catch {
        if (!cancelled) setCanSwitch(false);
      }
    };

    void open();

    return () => {
      cancelled = true;
      stop();
    };
  }, [active, facing, attempt, stop]);

  const setMicrophoneEnabled = useCallback((enabled: boolean) => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }, []);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    stream,
    ready,
    error,
    hasAudio: Boolean(stream?.getAudioTracks().length),
    canSwitch,
    setMicrophoneEnabled,
    retry
  };
};
