'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Pause, Send, Square, Trash2 } from 'lucide-react';
import { cn } from '@vibeline/utils';
import { pickAudioRecordingType } from '@/src/features/media/lib/media-capabilities';
import { VoicePlayer } from './voice-player';
import { formatDuration, VoiceWaveform, WAVEFORM_BAR_COUNT } from './voice-waveform';

type RecorderState = 'starting' | 'recording' | 'paused' | 'preview' | 'error';
type Props = { disabled: boolean; onCancel: () => void; onSend: (file: File) => Promise<void> };

const microphoneMessage = (error: unknown) => {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Microphone access is blocked. Allow it in your browser settings.';
  if (name === 'NotFoundError') return 'No microphone was found on this device.';
  if (name === 'NotReadableError') return 'Your microphone is already in use by another application.';
  return 'Unable to access your microphone.';
};

const extensionFor = (mimeType: string) => (mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'm4a' : 'webm');

export function VoiceRecorder({ disabled, onCancel, onSend }: Props) {
  const [state, setState] = useState<RecorderState>('starting');
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [samples, setSamples] = useState<number[]>(Array(WAVEFORM_BAR_COUNT).fill(0.18));
  const [sending, setSending] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<File | null>(null);
  const timerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const previewUrlRef = useRef('');
  const onCancelRef = useRef(onCancel);

  onCancelRef.current = onCancel;

  const setPreviewUrl = useCallback((url: string) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreview(url);
  }, []);

  useEffect(() => {
    let mounted = true;
    let context: AudioContext | null = null;

    const start = async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        if (!mounted) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = media;

        const mimeType = pickAudioRecordingType();
        const recorder = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size) chunksRef.current.push(event.data);
        };
        recorder.onerror = () => {
          setError('Recording failed. Try again.');
          setState('error');
        };
        recorder.onstop = () => {
          const type = recorder.mimeType || chunksRef.current[0]?.type || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type });
          chunksRef.current = [];
          if (!blob.size) {
            onCancelRef.current();
            return;
          }
          fileRef.current = new File([blob], `voice-${Date.now()}.${extensionFor(type)}`, { type });
          setPreviewUrl(URL.createObjectURL(blob));
          setState('preview');
        };

        recorder.start(250);
        setState('recording');

        context = new AudioContext();
        const source = context.createMediaStreamSource(media);
        const analyser = context.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const next = data.reduce((total, value) => total + value, 0) / (data.length * 255);
          setLevel(next);
          setSamples((previous) => [...previous.slice(1), Math.max(0.14, Math.min(1, next * 1.8))]);
          frameRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (caught) {
        if (!mounted) return;
        setError(microphoneMessage(caught));
        setState('error');
      }
    };

    void start();

    return () => {
      mounted = false;
      if (timerRef.current !== null) clearInterval(timerRef.current);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (context) void context.close();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [setPreviewUrl]);

  useEffect(() => {
    if (state !== 'recording') return;
    timerRef.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state]);

  const finish = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  const togglePause = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === 'recording') {
      recorder.pause();
      setState('paused');
    } else if (recorder.state === 'paused') {
      recorder.resume();
      setState('recording');
    }
  };

  const discard = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    onCancel();
  };

  const send = async () => {
    if (!fileRef.current || disabled || sending) return;
    setSending(true);
    try {
      await onSend(fileRef.current);
      onCancel();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The voice message could not be sent.');
      setState('error');
    } finally {
      setSending(false);
    }
  };

  if (state === 'error') {
    return (
      <div role="alert" className="mb-2 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        <span className="flex-1">{error}</span>
        <button type="button" onClick={onCancel} className="font-semibold">
          Close
        </button>
      </div>
    );
  }

  if (state === 'preview') {
    return (
      <div className="mb-2 flex min-h-[64px] items-center gap-3 rounded-[22px] border border-black/[.07] bg-white px-3 py-2 shadow-[0_4px_18px_rgba(0,0,0,.06)] motion-safe:animate-slide-up">
        <button
          type="button"
          onClick={discard}
          aria-label="Discard recording"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-black/55 transition-colors hover:bg-black/[.05]"
        >
          <Trash2 size={18} />
        </button>
        <VoicePlayer src={preview} compact />
        <button
          type="button"
          disabled={disabled || sending}
          onClick={() => void send()}
          aria-label="Send voice message"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0584FE] text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50"
        >
          <Send size={19} fill="currentColor" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2 flex min-h-[62px] items-center gap-2.5 rounded-[22px] border border-black/[.07] bg-white px-3 py-2 shadow-[0_4px_18px_rgba(0,0,0,.06)] motion-safe:animate-slide-up">
      <button
        type="button"
        onClick={discard}
        aria-label="Cancel recording"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/[.05]"
      >
        <Trash2 size={18} />
      </button>
      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full bg-red-500', state === 'recording' && 'motion-safe:animate-pulse')} />
      <span className="w-11 shrink-0 text-[13px] font-medium tabular-nums text-black/65">{formatDuration(seconds)}</span>
      <VoiceWaveform bars={samples} progress={1} live={state === 'recording'} level={level} />
      <button
        type="button"
        onClick={togglePause}
        aria-label={state === 'paused' ? 'Resume recording' : 'Pause recording'}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/[.05] text-black/70 transition-transform active:scale-95"
      >
        {state === 'paused' ? <Mic size={18} /> : <Pause size={18} fill="currentColor" />}
      </button>
      <button
        type="button"
        onClick={finish}
        aria-label="Finish recording"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0584FE] text-white transition-transform active:scale-95"
      >
        <Square size={13} fill="currentColor" />
      </button>
    </div>
  );
}
