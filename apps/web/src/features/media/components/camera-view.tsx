'use client';

import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, RefreshCw, X } from 'lucide-react';
import { useCameraStream, type CameraFacing } from '../hooks/use-camera-stream';
import { useVideoRecorder } from '../hooks/use-video-recorder';
import { cssFilter, initialEditState, type EffectName } from '../lib/editor-model';
import { CameraModeRail, type CameraMode } from './camera-mode-rail';
import { EffectsRail } from './effects-rail';

type Props = {
  allowVideo: boolean;
  onClose: () => void;
  onChooseLibrary?: () => void;
  onCapture: (file: File, effect: EffectName) => void;
};

const timecode = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function CameraView({ allowVideo, onClose, onChooseLibrary, onCapture }: Props) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<CameraFacing>('environment');
  const [mode, setMode] = useState<CameraMode>('photo');
  const [effect, setEffect] = useState<EffectName>('Original');
  const [showEffects, setShowEffects] = useState(false);
  const [captureError, setCaptureError] = useState('');

  const camera = useCameraStream(true, facing);
  const recorder = useVideoRecorder((file) => onCapture(file, effect));

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;
    element.srcObject = camera.stream;
    if (camera.stream) void element.play().catch(() => undefined);
    return () => {
      element.srcObject = null;
    };
  }, [camera.stream]);

  const setMicrophoneEnabled = camera.setMicrophoneEnabled;
  useEffect(() => {
    if (!recorder.recording) setMicrophoneEnabled(false);
  }, [recorder.recording, setMicrophoneEnabled]);

  const previewFilter = cssFilter({ ...initialEditState(), effect });
  const error = captureError || recorder.error || camera.error;

  const capturePhoto = () => {
    const video = previewRef.current;
    if (!video?.videoWidth) {
      setCaptureError('The camera preview is not ready yet.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCaptureError('Photo capture is unavailable in this browser.');
      return;
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCaptureError('The photo could not be captured.');
          return;
        }
        onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }), effect);
      },
      'image/jpeg',
      0.92
    );
  };

  const toggleShutter = () => {
    setCaptureError('');
    recorder.clearError();
    if (recorder.recording) {
      recorder.stop();
      return;
    }
    if (mode === 'video') {
      if (!camera.stream) return;
      setMicrophoneEnabled(true);
      recorder.start(camera.stream);
      return;
    }
    capturePhoto();
  };

  return (
    <>
      <video
        ref={previewRef}
        muted
        autoPlay
        playsInline
        style={{ filter: previewFilter }}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${camera.ready ? 'opacity-100' : 'opacity-0'}`}
      />
      {!camera.ready && !camera.error && (
        <p className="absolute inset-0 grid place-items-center text-sm text-white/70">Starting camera…</p>
      )}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-5 pb-10 pt-7">
        <button type="button" onClick={onClose} aria-label="Close camera" className="rounded-full p-2 transition-colors hover:bg-white/15">
          <X size={24} />
        </button>
        {recorder.recording && (
          <span role="status" className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-sm font-medium tabular-nums">
            <span className="h-2 w-2 rounded-full bg-white motion-safe:animate-pulse" />
            {timecode(recorder.seconds)}
          </span>
        )}
        <button
          type="button"
          aria-pressed={showEffects}
          onClick={() => setShowEffects((value) => !value)}
          className="rounded-full bg-black/30 px-3 py-2 text-sm transition-colors hover:bg-black/45"
        >
          {showEffects ? 'Hide effects' : 'Effects'}
        </button>
      </div>

      {error && (
        <div role="alert" className="absolute left-4 right-4 top-24 rounded-xl bg-red-600/90 p-3 text-sm">
          <p>{error}</p>
          {camera.error && (
            <button type="button" onClick={camera.retry} className="mt-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              Try again
            </button>
          )}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-16">
        {showEffects && (
          <div className="mb-4 motion-safe:animate-fade-in">
            <EffectsRail value={effect} disabled={recorder.recording} onChange={setEffect} />
          </div>
        )}

        {allowVideo && (
          <div className="mb-5">
            <CameraModeRail value={mode} disabled={recorder.recording} onChange={setMode} />
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          {onChooseLibrary ? (
            <button
              type="button"
              aria-label="Choose a photo or video"
              disabled={recorder.recording}
              onClick={onChooseLibrary}
              className="rounded-full p-3 transition-colors hover:bg-white/15 disabled:opacity-40"
            >
              <ImageIcon size={24} />
            </button>
          ) : (
            <span className="h-12 w-12" />
          )}

          <button
            type="button"
            disabled={!camera.ready}
            aria-label={recorder.recording ? 'Stop recording' : mode === 'video' ? 'Start video recording' : 'Take photo'}
            onClick={toggleShutter}
            className="grid h-[76px] w-[76px] place-items-center rounded-full border-[6px] border-white bg-white/20 transition-transform active:scale-95 disabled:opacity-40"
          >
            <span
              className={`block transition-all duration-200 ${
                recorder.recording
                  ? 'h-[32px] w-[32px] rounded-lg bg-red-500'
                  : mode === 'video' && allowVideo
                    ? 'h-[56px] w-[56px] rounded-full bg-red-500'
                    : 'h-[58px] w-[58px] rounded-full bg-white/80'
              }`}
            />
          </button>

          <button
            type="button"
            disabled={recorder.recording || !camera.canSwitch}
            aria-label="Switch camera"
            onClick={() => setFacing((value) => (value === 'user' ? 'environment' : 'user'))}
            className="rounded-full p-3 transition-colors hover:bg-white/15 disabled:opacity-30"
          >
            <RefreshCw size={25} />
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-white/60">
          {recorder.recording
            ? 'Tap to stop recording'
            : mode === 'video' && allowVideo
              ? camera.hasAudio
                ? 'Tap to record video'
                : 'Tap to record video — no microphone available'
              : 'Tap to take photo'}
        </p>
      </div>
    </>
  );
}
