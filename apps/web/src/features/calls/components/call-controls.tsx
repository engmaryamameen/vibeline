'use client';

import { Mic, MicOff, PhoneOff, SwitchCamera, Video, VideoOff } from 'lucide-react';

type Props = {
  media: 'audio' | 'video';
  micEnabled: boolean;
  cameraEnabled: boolean;
  canSwitchCamera: boolean;
  videoFallback: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
  onHangUp: () => void;
};

const control = (active: boolean) =>
  `grid h-14 w-14 place-items-center rounded-full transition-transform active:scale-95 ${
    active ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-black hover:bg-white/90'
  }`;

export function CallControls({
  media,
  micEnabled,
  cameraEnabled,
  canSwitchCamera,
  videoFallback,
  onToggleMic,
  onToggleCamera,
  onSwitchCamera,
  onHangUp
}: Props) {
  const showVideoControls = media === 'video' && !videoFallback;

  return (
    <div className="flex items-center justify-center gap-4">
      <button type="button" onClick={onToggleMic} aria-pressed={!micEnabled} aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'} className={control(micEnabled)}>
        {micEnabled ? <Mic size={22} /> : <MicOff size={22} />}
      </button>

      {showVideoControls && (
        <button
          type="button"
          onClick={onToggleCamera}
          aria-pressed={!cameraEnabled}
          aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
          className={control(cameraEnabled)}
        >
          {cameraEnabled ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
      )}

      {showVideoControls && canSwitchCamera && (
        <button type="button" onClick={onSwitchCamera} aria-label="Switch camera" className={control(true)}>
          <SwitchCamera size={22} />
        </button>
      )}

      <button
        type="button"
        onClick={onHangUp}
        aria-label="End call"
        className="grid h-14 w-14 place-items-center rounded-full bg-status-error text-white transition-transform active:scale-95 hover:brightness-110"
      >
        <PhoneOff size={22} />
      </button>
    </div>
  );
}
