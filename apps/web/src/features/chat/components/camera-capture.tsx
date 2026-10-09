'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, RefreshCw, X, RotateCcw, Send, Type, WandSparkles, SlidersHorizontal, Trash2 } from 'lucide-react';

type Props = { open: boolean; sending: boolean; onClose: () => void; onChooseLibrary: () => void; libraryFile: File | null; onSend: (file: File) => Promise<void> };
const MAX_RECORDING_MS = 60_000;
const EFFECTS = [{ name: 'Original', filter: 'none' }, { name: 'Warm', filter: 'sepia(0.35) saturate(1.25)' }, { name: 'Mono', filter: 'grayscale(1)' }, { name: 'Cool', filter: 'hue-rotate(20deg) saturate(0.85)' }, { name: 'Vivid', filter: 'contrast(1.15) saturate(1.5)' }] as const;
const VIDEO_TYPES = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];

export function CameraCapture({ open, sending, onClose, onChooseLibrary, libraryFile, onSend }: Props) {
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [effect, setEffect] = useState<(typeof EFFECTS)[number]['name']>('Original');
  const [showEffects, setShowEffects] = useState(false);
  const [editorTool, setEditorTool] = useState<'filters' | 'text' | 'adjust' | null>(null);
  const [caption, setCaption] = useState('');
  const [captionColor, setCaptionColor] = useState('#ffffff');
  const [captionSize, setCaptionSize] = useState(36);
  const [captionPosition, setCaptionPosition] = useState({ x: 0.5, y: 0.5 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [exporting, setExporting] = useState(false);
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
  const editorPreviewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);
  const effectsRailRef = useRef<HTMLDivElement>(null);
  const effectButtonsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const effectsTouchStartRef = useRef<number | null>(null);
  const currentFilter = `${EFFECTS.find(item => item.name === effect)?.filter ?? 'none'} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  useEffect(() => {
    const rail = effectsRailRef.current;
    const button = effectButtonsRef.current[effect];
    if (rail && button) rail.scrollTo({ left: button.offsetLeft - (rail.clientWidth - button.clientWidth) / 2, behavior: 'smooth' });
  }, [effect, editorTool, showEffects, file]);
  const changeEffect = (direction: number) => {
    const index = EFFECTS.findIndex(item => item.name === effect);
    const next = Math.max(0, Math.min(EFFECTS.length - 1, index + direction));
    setEffect(EFFECTS[next].name);
  };
  const effectsRail = (
    <div ref={effectsRailRef} onTouchStart={event => { effectsTouchStartRef.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={event => {
      const start = effectsTouchStartRef.current;
      if (start !== null && event.changedTouches[0] && Math.abs(event.changedTouches[0].clientX - start) > 55) {
        changeEffect(event.changedTouches[0].clientX < start ? 1 : -1);
      }
      effectsTouchStartRef.current = null;
    }} className="relative flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-[calc(50%-44px)] py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Effects selector">
      {EFFECTS.map(item => <button key={item.name} ref={node => { effectButtonsRef.current[item.name] = node; }} type="button" disabled={recording} onClick={() => setEffect(item.name)} aria-pressed={effect === item.name} className={`shrink-0 snap-center rounded-full px-4 py-3 text-xs font-semibold transition-colors ${effect === item.name ? 'bg-white text-black' : 'bg-white/25 text-white'}`}>{item.name}</button>)}
    </div>
  );

  

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
  const exportImage = async (source: File): Promise<File> => {
    const bitmap = await createImageBitmap(source);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.filter = currentFilter;
      ctx.drawImage(bitmap, 0, 0);
      ctx.filter = 'none';
      if (caption.trim()) {
        const size = Math.max(16, Math.round(bitmap.width * captionSize / 400));
        ctx.font = `bold ${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(2, size / 12);
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.fillStyle = captionColor;
        const x = captionPosition.x * canvas.width;
        const y = captionPosition.y * canvas.height;
        for (const [i, line] of caption.split('\n').entries()) {
          const lineY = y + (i - (caption.split('\n').length - 1) / 2) * size * 1.2;
          ctx.strokeText(line, x, lineY, canvas.width * 0.9);
          ctx.fillText(line, x, lineY, canvas.width * 0.9);
        }
      }
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image export failed')), 'image/jpeg', 0.9));
      return new File([blob], `edited-${Date.now()}.jpg`, { type: 'image/jpeg' });
    } finally { bitmap.close(); }
  };
  const send = async () => {
    if (!file || busy || sending) return;
    setBusy(true);
    setExporting(true);
    setError('');
    try {
      if (file.type.startsWith('video/') && (caption.trim() || effect !== 'Original' || brightness !== 100 || contrast !== 100 || saturation !== 100)) {
        setError('Video export with edits is not supported yet. Reset edits to send the original video.');
        return;
      }
      const outgoing = file.type.startsWith('image/') && (caption.trim() || effect !== 'Original' || brightness !== 100 || contrast !== 100 || saturation !== 100)
        ? await exportImage(file) : file;
      await onSend(outgoing); close();
    }
    catch { setError('Could not send media. Try again.'); }
    finally { setBusy(false); setExporting(false); }
  };
  return <div role="dialog" aria-modal="true" aria-label="Chat camera" className="fixed inset-0 z-[100] bg-black text-white">
    {!file ? <video ref={previewRef} muted autoPlay playsInline style={{ filter: EFFECTS.find(item => item.name === effect)?.filter ?? 'none' }} className="absolute inset-0 h-full w-full object-cover" /> : fileUrl && (file.type.startsWith('video/') ? <video src={fileUrl} controls playsInline style={{ filter: currentFilter }} className="absolute inset-0 h-full w-full object-contain" /> : <img src={fileUrl} alt="Captured photo" style={{ filter: currentFilter }} className="absolute inset-0 h-full w-full object-contain" />)}
    <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-5 pb-10 pt-7">
      <button type="button" onClick={close} aria-label="Close camera" className="rounded-full p-2"><X size={24} /></button>
      {recording ? <span className="rounded-full bg-red-600 px-3 py-1 text-sm">● {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span> : null}
      {!file && <button type="button" aria-label="Toggle effects" onClick={() => setShowEffects(v => !v)} className="rounded-full bg-black/30 px-3 py-2 text-sm">{showEffects ? 'Hide effects' : 'Effects'}</button>}
    </div>
    {file && <>
      <div ref={editorPreviewRef} className="absolute inset-0 pointer-events-none" aria-label="Media editing canvas">
        {caption && <div role="button" tabIndex={0} aria-label="Drag text to position" onPointerDown={event => { dragRef.current = true; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (!dragRef.current || !editorPreviewRef.current) return; const r = editorPreviewRef.current.getBoundingClientRect(); setCaptionPosition({ x: Math.max(0.05, Math.min(0.95, (event.clientX-r.left)/r.width)), y: Math.max(0.05, Math.min(0.95, (event.clientY-r.top)/r.height)) }); }} onPointerUp={() => { dragRef.current = false; }} onPointerCancel={() => { dragRef.current = false; }} style={{ left: `${captionPosition.x*100}%`, top: `${captionPosition.y*100}%`, color: captionColor, fontSize: captionSize, textShadow: '0 1px 4px #000, 0 0 2px #000', transform: 'translate(-50%,-50%)', touchAction: 'none' }} className="pointer-events-auto absolute max-w-[85%] cursor-move select-none whitespace-pre-wrap break-words text-center font-bold">{caption}</div>}
      </div>
      <div className="absolute right-3 top-24 z-10 flex flex-col gap-3 rounded-2xl bg-black/60 p-2" aria-label="Media editor tools">
        <button type="button" aria-label="Text" onClick={() => setEditorTool(editorTool === 'text' ? null : 'text')} className="rounded-xl p-3 hover:bg-white/20"><Type size={22}/></button>
        <button type="button" aria-label="Filters" onClick={() => setEditorTool(editorTool === 'filters' ? null : 'filters')} className="rounded-xl p-3 hover:bg-white/20"><WandSparkles size={22}/></button>
        <button type="button" aria-label="Adjust" onClick={() => setEditorTool(editorTool === 'adjust' ? null : 'adjust')} className="rounded-xl p-3 hover:bg-white/20"><SlidersHorizontal size={22}/></button>
        <button type="button" aria-label="Reset edits" onClick={() => { setCaption(''); setEffect('Original'); setBrightness(100); setContrast(100); setSaturation(100); setEditorTool(null); }} className="rounded-xl p-3 hover:bg-white/20"><Trash2 size={22}/></button>
      </div>
      {editorTool && editorTool !== 'filters' && <div className="absolute bottom-40 left-3 right-20 z-20 max-h-[40vh] overflow-y-auto rounded-2xl bg-black/85 p-4 shadow-xl sm:bottom-auto sm:left-auto sm:right-20 sm:top-24 sm:w-72" aria-label="Editor settings">
        {editorTool === 'text' && <div className="space-y-3"><label className="block text-sm">Text<textarea aria-label="Overlay text" maxLength={300} value={caption} onChange={event => setCaption(event.target.value)} className="mt-2 w-full rounded-lg bg-white/15 p-2 text-white" rows={3}/></label><label className="block text-sm">Size <input aria-label="Text size" type="range" min={18} max={72} value={captionSize} onChange={event => setCaptionSize(Number(event.target.value))}/></label><label className="block text-sm">Color <input aria-label="Text color" type="color" value={captionColor} onChange={event => setCaptionColor(event.target.value)}/></label><p className="text-xs text-white/70">Drag the text over the preview to position it.</p></div>}
        {editorTool === 'filters' && <p className="text-sm text-white/75">Swipe or tap an effect in the bottom selector.</p>}
        {editorTool === 'adjust' && <div className="space-y-3">{([{ name: 'Brightness', value: brightness, set: setBrightness }, { name: 'Contrast', value: contrast, set: setContrast }, { name: 'Saturation', value: saturation, set: setSaturation }] as const).map(item => <label key={item.name} className="block text-sm">{item.name} {item.value}%<input type="range" aria-label={item.name} min={0} max={200} value={item.value} onChange={event => item.set(Number(event.target.value))} className="w-full"/></label>)}</div>}
      </div>}
    </>}
    {error && <div role="alert" className="absolute left-4 right-4 top-24 rounded-xl bg-red-600/90 p-3 text-sm">{error}</div>}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-16">
      {file ? <><div className="mb-4">{effectsRail}</div><div className="flex items-center justify-between gap-4"><button type="button" disabled={busy || sending || exporting} onClick={() => { setFile(null); setError(''); }} className="flex items-center gap-2 rounded-full bg-white/20 px-5 py-3"><RotateCcw size={18}/> Retake</button><button type="button" disabled={busy || sending || exporting} onClick={() => void send()} className="flex items-center gap-2 rounded-full bg-[#0584FE] px-6 py-3 font-semibold disabled:opacity-50"><Send size={18}/> {busy || sending || exporting ? 'Processing…' : 'Send'}</button></div></> : <>
        {showEffects && <div className="mb-4">{effectsRail}</div>}
        <div className="mb-5 flex justify-center gap-3 overflow-x-auto" aria-label="Camera modes" onTouchStart={event => { (event.currentTarget as HTMLElement).dataset.touchX = String(event.touches[0].clientX); }} onTouchEnd={event => { const dx = event.changedTouches[0].clientX - Number((event.currentTarget as HTMLElement).dataset.touchX || 0); if (Math.abs(dx) > 45 && !recording) setMode(dx < 0 ? 'video' : 'photo'); }}>
          {(['photo', 'video'] as const).map(value => <button key={value} type="button" disabled={recording} onClick={() => setMode(value)} aria-pressed={mode === value} className={`rounded-full px-6 py-2 text-xs font-bold tracking-widest ${mode === value ? 'bg-white text-black' : 'bg-white/20 text-white/75'}`}>{value.toUpperCase()}</button>)}
        </div>
        <div className="flex items-center justify-between gap-4"><button type="button" aria-label="Choose photo or video" onClick={onChooseLibrary} className="p-3"><ImageIcon size={24}/></button><button type="button" disabled={!cameraReady} aria-label={recording ? 'Stop recording' : mode === 'video' ? 'Start video recording' : 'Take photo'} onClick={() => { if (recording) stopRecording(); else if (mode === 'video') startRecording(); else capturePhoto(); }} className="grid h-[76px] w-[76px] place-items-center rounded-full border-[6px] border-white bg-white/20 disabled:opacity-40"><span className={`block transition-all ${recording ? 'h-[32px] w-[32px] rounded-lg bg-red-500' : mode === 'video' ? 'h-[56px] w-[56px] rounded-full bg-red-500' : 'h-[58px] w-[58px] rounded-full bg-white/80'}`} /></button><button type="button" disabled={recording} aria-label="Switch camera" onClick={() => setFacing(v => v === 'user' ? 'environment' : 'user')} className="p-3"><RefreshCw size={25}/></button></div>
        <p className="mt-3 text-center text-xs text-white/60">{recording ? 'Tap to stop recording' : mode === 'video' ? 'Tap to record video' : 'Tap to take photo'}</p>
      </>}
    </div>
  </div>;
}
