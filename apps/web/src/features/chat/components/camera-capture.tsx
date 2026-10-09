'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, RefreshCw, X, RotateCcw, Send } from 'lucide-react';

type Props = { open: boolean; sending: boolean; onClose: () => void; onChooseLibrary: () => void; libraryFile: File | null; onSend: (file: File) => Promise<void> };
const MAX_RECORDING_MS = 60_000;
const EFFECTS = [{ name: 'Original', filter: 'none' }, { name: 'Warm', filter: 'sepia(0.35) saturate(1.25)' }, { name: 'Mono', filter: 'grayscale(1)' }, { name: 'Cool', filter: 'hue-rotate(20deg) saturate(0.85)' }, { name: 'Vivid', filter: 'contrast(1.15) saturate(1.5)' }] as const;
const VIDEO_TYPES = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];

export function CameraCapture({ open, sending, onClose, onChooseLibrary, libraryFile, onSend }: Props) {
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [effect, setEffect] = useState<(typeof EFFECTS)[number]['name']>('Original');
  const [showEffects, setShowEffects] = useState(false);
  const animationRef = useRef<number | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const discardRef = useRef(false);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const stopTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (previewRef.current) previewRef.current.srcObject = null;
    setCameraReady(false);
  }, []);
  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.stop();
    stopTimers();
    setRecording(false);
  }, [stopTimers]);

  useEffect(() => {
    if (!open || file) return;
    let cancelled = false;
    setError('');
    setCameraReady(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access requires a supported browser and a secure connection.');
      return;
    }
    void navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: true })
      .catch(async () => navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false }))
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (previewRef.current) {
          previewRef.current.srcObject = stream;
          void previewRef.current.play().catch(() => {});
        }
        setCameraReady(true);
      }).catch(() => { if (!cancelled) setError('Camera permission denied or camera unavailable.'); });
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, facing, file, stopStream]);

  useEffect(() => {
    if (!open || !libraryFile) return;
    if (!libraryFile.type.startsWith('image/') && !libraryFile.type.startsWith('video/')) {
      setError('Choose an image or video file.');
      return;
    }
    stopStream();
    setError('');
    setFile(libraryFile);
  }, [libraryFile, open, stopStream]);

  useEffect(() => {
    if (!file) { setFileUrl(undefined); return; }
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => () => {
    stopTimers();
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    recordingStreamRef.current?.getTracks().forEach(track => track.stop());
    stopStream();
  }, [stopStream, stopTimers]);

  if (!open) return null;

  const close = () => {
    if (recording) { discardRef.current = true; recorderRef.current?.stop(); chunksRef.current = []; }
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    recordingStreamRef.current?.getTracks().forEach(track => track.stop());
    stopTimers();
    stopStream();
    setRecording(false);
    setFile(null);
    setSeconds(0);
    onClose();
  };
  const capturePhoto = () => {
    const video = previewRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.filter = EFFECTS.find(item => item.name === effect)?.filter ?? 'none';
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) { stopStream(); setFile(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })); }
      else setError('Could not capture photo.');
    }, 'image/jpeg', 0.9);
  };
  const startRecording = () => {
    if (!streamRef.current || typeof MediaRecorder === 'undefined') { setError('Video recording is not supported in this browser.'); return; }
    const type = VIDEO_TYPES.find(t => MediaRecorder.isTypeSupported(t));
    if (!type) { setError('No supported video recording format is available.'); return; }
    try {
      chunksRef.current = [];
      discardRef.current = false;
      const video = previewRef.current;
      if (!video || !video.videoWidth) { setError('Camera preview is not ready.'); return; }
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setError('Canvas recording is unavailable.'); return; }
      const filter = EFFECTS.find(item => item.name === effect)?.filter ?? 'none';
      const paint = () => {
        ctx.filter = filter;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        animationRef.current = requestAnimationFrame(paint);
      };
      paint();
      const captured = canvas.captureStream(30);
      const audioTracks = streamRef.current.getAudioTracks();
      const combined = new MediaStream([...captured.getVideoTracks(), ...audioTracks]);
      recordingStreamRef.current = combined;
      const recorder = new MediaRecorder(combined, { mimeType: type });
      recorderRef.current = recorder;
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onerror = () => { setError('Video recording failed.'); setRecording(false); };
      recorder.onstop = () => {
        setRecording(false);
        stopTimers();
        if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        recordingStreamRef.current?.getVideoTracks().forEach(track => track.stop());
        recordingStreamRef.current = null;
        if (discardRef.current || !chunksRef.current.length) { chunksRef.current = []; return; }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        const ext = recorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
        stopStream();
        setFile(new File([blob], `video-${Date.now()}.${ext}`, { type: blob.type }));
      };
      recorder.start(250);
      startedAtRef.current = Date.now();
      setSeconds(0);
      setRecording(true);
      const tick = () => {
        const elapsed = Date.now() - startedAtRef.current;
        setSeconds(Math.floor(elapsed / 1000));
        if (elapsed >= MAX_RECORDING_MS) { stopRecording(); return; }
        timerRef.current = setTimeout(tick, 250);
      };
      timerRef.current = setTimeout(tick, 250);
    } catch { setError('Could not start video recording.'); }
  };
  const send = async () => {
    if (!file || busy || sending) return;
    setBusy(true);
    setError('');
    try { await onSend(file); close(); }
    catch { setError('Could not send media. Try again.'); }
    finally { setBusy(false); }
  };
  return <div role="dialog" aria-modal="true" aria-label="Chat camera" className="fixed inset-0 z-[100] bg-black text-white">
    {!file ? <video ref={previewRef} muted autoPlay playsInline style={{ filter: EFFECTS.find(item => item.name === effect)?.filter ?? 'none' }} className="absolute inset-0 h-full w-full object-cover" /> : fileUrl && (file.type.startsWith('video/') ? <video src={fileUrl} controls playsInline className="absolute inset-0 h-full w-full object-contain" /> : <img src={fileUrl} alt="Captured photo" className="absolute inset-0 h-full w-full object-contain" />)}
    <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-5 pb-10 pt-7">
      <button type="button" onClick={close} aria-label="Close camera" className="rounded-full p-2"><X size={24} /></button>
      {recording ? <span className="rounded-full bg-red-600 px-3 py-1 text-sm">● {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span> : null}
      {!file && <button type="button" aria-label="Effects" onClick={() => setShowEffects(v => !v)} className="rounded-full bg-black/30 px-3 py-2 text-sm">Effects</button>}
    </div>
    {error && <div role="alert" className="absolute left-4 right-4 top-24 rounded-xl bg-red-600/90 p-3 text-sm">{error}</div>}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-16">
      {file ? <div className="flex items-center justify-between gap-4"><button type="button" disabled={busy || sending} onClick={() => { setFile(null); setError(''); }} className="flex items-center gap-2 rounded-full bg-white/20 px-5 py-3"><RotateCcw size={18}/> Retake</button><button type="button" disabled={busy || sending} onClick={() => void send()} className="flex items-center gap-2 rounded-full bg-[#0584FE] px-6 py-3 font-semibold disabled:opacity-50"><Send size={18}/> {busy || sending ? 'Sending…' : 'Send'}</button></div> : <>
        {showEffects && <div className="mb-5 flex gap-3 overflow-x-auto pb-2" aria-label="Camera effects">{EFFECTS.map(item => <button key={item.name} type="button" disabled={recording} onClick={() => setEffect(item.name)} aria-pressed={effect === item.name} className={`shrink-0 rounded-xl px-4 py-3 text-sm ${effect === item.name ? 'bg-white text-black' : 'bg-white/20 text-white'}`}>{item.name}</button>)}</div>}
        <div className="mb-5 flex justify-center gap-3 overflow-x-auto" aria-label="Camera modes" onTouchStart={event => { (event.currentTarget as HTMLElement).dataset.touchX = String(event.touches[0].clientX); }} onTouchEnd={event => { const dx = event.changedTouches[0].clientX - Number((event.currentTarget as HTMLElement).dataset.touchX || 0); if (Math.abs(dx) > 45 && !recording) setMode(dx < 0 ? 'video' : 'photo'); }}>
          {(['photo', 'video'] as const).map(value => <button key={value} type="button" disabled={recording} onClick={() => setMode(value)} aria-pressed={mode === value} className={`rounded-full px-6 py-2 text-xs font-bold tracking-widest ${mode === value ? 'bg-white text-black' : 'bg-white/20 text-white/75'}`}>{value.toUpperCase()}</button>)}
        </div>
        <div className="flex items-center justify-between gap-4"><button type="button" aria-label="Choose photo or video" onClick={onChooseLibrary} className="p-3"><ImageIcon size={24}/></button><button type="button" disabled={!cameraReady} aria-label={recording ? 'Stop recording' : mode === 'video' ? 'Start video recording' : 'Take photo'} onClick={() => { if (recording) stopRecording(); else if (mode === 'video') startRecording(); else capturePhoto(); }} className="grid h-[76px] w-[76px] place-items-center rounded-full border-[6px] border-white bg-white/20 disabled:opacity-40"><span className={`block transition-all ${recording ? 'h-[32px] w-[32px] rounded-lg bg-red-500' : mode === 'video' ? 'h-[56px] w-[56px] rounded-full bg-red-500' : 'h-[58px] w-[58px] rounded-full bg-white/80'}`} /></button><button type="button" disabled={recording} aria-label="Switch camera" onClick={() => setFacing(v => v === 'user' ? 'environment' : 'user')} className="p-3"><RefreshCw size={25}/></button></div>
        <p className="mt-3 text-center text-xs text-white/60">{recording ? 'Tap to stop recording' : mode === 'video' ? 'Tap to record video' : 'Tap to take photo'}</p>
      </>}
    </div>
  </div>;
}
