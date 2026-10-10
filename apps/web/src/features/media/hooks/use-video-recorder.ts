'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { extensionForMimeType, pickVideoRecordingType, supportsMediaRecorder } from '../lib/media-capabilities';

export const MAX_RECORDING_MS = 60_000;

export type VideoRecorderState = {
  recording: boolean;
  seconds: number;
  error: string;
  supported: boolean;
  start: (stream: MediaStream) => void;
  stop: () => void;
  cancel: () => void;
  clearError: () => void;
};

export const useVideoRecorder = (onRecorded: (file: File) => void): VideoRecorderState => {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRecordedRef = useRef(onRecorded);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');

  onRecordedRef.current = onRecorded;

  const clearTick = useCallback(() => {
    if (tickRef.current) clearTimeout(tickRef.current);
    tickRef.current = null;
  }, []);

  const stop = useCallback(() => {
    clearTick();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    else setRecording(false);
  }, [clearTick]);

  const cancel = useCallback(() => {
    discardRef.current = true;
    stop();
  }, [stop]);

  const start = useCallback(
    (stream: MediaStream) => {
      if (!supportsMediaRecorder()) {
        setError('Video recording is not supported in this browser.');
        return;
      }
      const mimeType = pickVideoRecordingType();
      if (!mimeType) {
        setError('No supported video recording format is available in this browser.');
        return;
      }
      if (!stream.getVideoTracks().length) {
        setError('The camera is not ready yet.');
        return;
      }

      try {
        chunksRef.current = [];
        discardRef.current = false;
        setError('');

        const recorder = new MediaRecorder(stream, { mimeType });
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size) chunksRef.current.push(event.data);
        };
        recorder.onerror = () => {
          clearTick();
          setRecording(false);
          setError('Video recording failed.');
          chunksRef.current = [];
        };
        recorder.onstop = () => {
          clearTick();
          setRecording(false);
          const chunks = chunksRef.current;
          chunksRef.current = [];
          recorderRef.current = null;
          if (discardRef.current || !chunks.length) return;
          const type = recorder.mimeType || mimeType;
          const blob = new Blob(chunks, { type });
          onRecordedRef.current(new File([blob], `video-${Date.now()}.${extensionForMimeType(type)}`, { type }));
        };

        recorder.start(250);
        startedAtRef.current = Date.now();
        setSeconds(0);
        setRecording(true);

        const tick = () => {
          const elapsed = Date.now() - startedAtRef.current;
          setSeconds(Math.floor(elapsed / 1000));
          if (elapsed >= MAX_RECORDING_MS) {
            stop();
            return;
          }
          tickRef.current = setTimeout(tick, 250);
        };
        tickRef.current = setTimeout(tick, 250);
      } catch {
        setError('Video recording could not be started.');
        setRecording(false);
      }
    },
    [clearTick, stop]
  );

  useEffect(
    () => () => {
      clearTick();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        discardRef.current = true;
        recorder.stop();
      }
    },
    [clearTick]
  );

  return { recording, seconds, error, supported: supportsMediaRecorder(), start, stop, cancel, clearError: () => setError('') };
};
