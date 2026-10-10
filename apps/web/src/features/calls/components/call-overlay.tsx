'use client';

import type { CallSession } from '../hooks/use-call-session';
import { ActiveCallView } from './active-call-view';
import { IncomingCallCard } from './incoming-call-card';

export function CallOverlay({ session }: { session: CallSession }) {
  const { call, phase } = session;

  return (
    <>
      {call && phase === 'incoming' && (
        <IncomingCallCard call={call} busy={false} onAccept={() => void session.accept()} onDecline={() => void session.decline()} />
      )}

      {call && (phase === 'starting' || phase === 'outgoing' || phase === 'connecting' || phase === 'active' || phase === 'ending') && (
        <ActiveCallView
          call={call}
          phase={phase}
          link={session.link}
          localStream={session.localStream}
          remoteStream={session.remoteStream}
          micEnabled={session.micEnabled}
          cameraEnabled={session.cameraEnabled}
          remoteCameraOff={session.remoteCameraOff}
          videoFallback={session.videoFallback}
          canSwitchCamera={session.canSwitchCamera}
          onToggleMic={session.toggleMic}
          onToggleCamera={session.toggleCamera}
          onSwitchCamera={() => void session.switchCamera()}
          onHangUp={() => void session.hangUp()}
        />
      )}

      {session.error && (
        <div role="alert" className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-xl bg-status-error px-4 py-3 text-sm text-white shadow-lg motion-safe:animate-slide-up">
          {session.error}
          <button type="button" onClick={session.dismissError} aria-label="Dismiss call error" className="ml-3 font-semibold">
            ×
          </button>
        </div>
      )}
    </>
  );
}
