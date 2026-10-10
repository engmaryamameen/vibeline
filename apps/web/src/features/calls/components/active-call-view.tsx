'use client';

import { MicOff, VideoOff } from 'lucide-react';
import type { Call } from '@vibeline/contracts';
import { ChatAvatar } from '@/src/features/chat/components/chat-avatar';
import { formatCallDuration, useCallDuration } from '../hooks/use-call-duration';
import type { CallLinkState, CallPhase } from '../hooks/use-call-session';
import { CallAudioSink } from './call-audio-sink';
import { CallControls } from './call-controls';
import { CallVideoSurface } from './call-video-surface';

type Props = {
  call: Call;
  phase: CallPhase;
  link: CallLinkState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  remoteCameraOff: boolean;
  videoFallback: boolean;
  canSwitchCamera: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
  onHangUp: () => void;
};

const statusLine = (phase: CallPhase, link: CallLinkState) => {
  if (phase === 'outgoing') return 'Ringing…';
  if (phase === 'starting') return 'Starting call…';
  if (phase === 'ending') return 'Ending…';
  if (link === 'reconnecting') return 'Reconnecting…';
  if (link === 'failed') return 'Connection failed';
  if (phase === 'connecting' || link === 'connecting') return 'Connecting…';
  return undefined;
};

export function ActiveCallView({
  call,
  phase,
  link,
  localStream,
  remoteStream,
  micEnabled,
  cameraEnabled,
  remoteCameraOff,
  videoFallback,
  canSwitchCamera,
  onToggleMic,
  onToggleCamera,
  onSwitchCamera,
  onHangUp
}: Props) {
  const duration = useCallDuration(call.connectedAt);
  const status = statusLine(phase, link);
  const isVideoCall = call.media === 'video' && !videoFallback;
  const showRemoteVideo = isVideoCall && Boolean(remoteStream?.getVideoTracks().length) && !remoteCameraOff;

  return (
    <div role="dialog" aria-modal="true" aria-label={`${call.media} call with ${call.peer.displayName}`} className="fixed inset-0 z-[180] flex flex-col bg-[#0B0C0E] text-white motion-safe:animate-fade-in">
      <CallAudioSink stream={remoteStream} />

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {showRemoteVideo ? (
          <CallVideoSurface stream={remoteStream} muted label={`${call.peer.displayName} video`} className="h-full w-full object-cover" />
        ) : (
          <>
            <div className="flex flex-col items-center px-6 text-center">
              <ChatAvatar name={call.peer.displayName} src={call.peer.avatarUrl} size="xl" className="!h-[112px] !w-[112px]" />
              <h2 className="mt-4 text-[24px] font-bold leading-[29px]">{call.peer.displayName}</h2>
              <p aria-live="polite" className="mt-1 text-[15px] text-white/60">
                {status ?? formatCallDuration(duration)}
              </p>
              {isVideoCall && remoteCameraOff && (
                <p className="mt-3 flex items-center gap-1.5 text-[13px] text-white/45">
                  <VideoOff size={14} /> Camera off
                </p>
              )}
            </div>
          </>
        )}

        {showRemoteVideo && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-5">
            <span className="min-w-0">
              <strong className="block truncate text-[17px] font-semibold">{call.peer.displayName}</strong>
              <span aria-live="polite" className="block text-[13px] text-white/70">
                {status ?? formatCallDuration(duration)}
              </span>
            </span>
          </div>
        )}

        {isVideoCall && localStream && (
          <div className="absolute bottom-4 right-4 h-[150px] w-[108px] overflow-hidden rounded-2xl border border-white/15 bg-black shadow-lg sm:h-[180px] sm:w-[130px]">
            {cameraEnabled ? (
              <CallVideoSurface stream={localStream} muted mirrored label="Your camera" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-white/45">
                <VideoOff size={22} />
              </span>
            )}
          </div>
        )}

        {!micEnabled && (
          <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium">
            <MicOff size={14} /> Muted
          </span>
        )}

        {videoFallback && call.media === 'video' && (
          <p role="status" className="absolute inset-x-4 bottom-4 text-center text-xs text-amber-300 sm:bottom-6">
            Your camera is unavailable, so this call continues with audio only.
          </p>
        )}
      </div>

      <footer className="shrink-0 px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5">
        <CallControls
          media={call.media}
          micEnabled={micEnabled}
          cameraEnabled={cameraEnabled}
          canSwitchCamera={canSwitchCamera}
          videoFallback={videoFallback}
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onSwitchCamera={onSwitchCamera}
          onHangUp={onHangUp}
        />
      </footer>
    </div>
  );
}
