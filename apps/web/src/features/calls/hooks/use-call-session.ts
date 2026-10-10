'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CALL_CONNECT_TIMEOUT_MS, type Call, type CallMedia, type CallSignal, type IceServer, type RealtimeEvent } from '@vibeline/contracts';
import { useAuthorizedRequest } from '@/src/features/chat/hooks/use-authorized-request';
import { useRealtimeConnect, useRealtimeEvents } from '@/src/features/realtime/realtime-provider';
import { useAuthStore } from '@/src/store/auth.store';
import { callApi } from '../api/call-api';
import { CallMediaError, hasMultipleCameras, requestCameraTrack, requestLocalMedia, stopStream, supportsCalling } from '../lib/call-media';
import { CallPeer } from '../lib/peer-connection';

export type CallPhase = 'idle' | 'starting' | 'outgoing' | 'incoming' | 'connecting' | 'active' | 'ending';
export type CallLinkState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export type CallSession = {
  supported: boolean;
  call: Call | undefined;
  phase: CallPhase;
  link: CallLinkState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  remoteCameraOff: boolean;
  videoFallback: boolean;
  canSwitchCamera: boolean;
  error: string;
  isCaller: boolean;
  start: (conversationId: string, media: CallMedia) => Promise<void>;
  accept: () => Promise<void>;
  decline: () => Promise<void>;
  hangUp: () => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  switchCamera: () => Promise<void>;
  dismissError: () => void;
};

const HEARTBEAT_INTERVAL_MS = 20_000;

export function useCallSession(): CallSession {
  const request = useAuthorizedRequest();
  const api = useMemo(() => callApi(request), [request]);
  const currentUserId = useAuthStore((state) => state.currentUser?.id);

  const [call, setCall] = useState<Call>();
  const [phase, setPhase] = useState<CallPhase>('idle');
  const [link, setLink] = useState<CallLinkState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [videoFallback, setVideoFallback] = useState(false);
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);
  const [error, setError] = useState('');

  const peerRef = useRef<CallPeer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callRef = useRef<Call | undefined>(undefined);
  const cursorRef = useRef(0);
  const pendingRef = useRef<CallSignal[]>([]);
  const facingRef = useRef<'user' | 'environment'>('user');
  const connectedReportedRef = useRef(false);
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supported = useMemo(() => supportsCalling(), []);

  callRef.current = call;
  const isCaller = Boolean(call && currentUserId && call.callerId === currentUserId);

  const clearConnectTimer = useCallback(() => {
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    connectTimerRef.current = null;
  }, []);

  const teardown = useCallback(() => {
    clearConnectTimer();
    peerRef.current?.close();
    peerRef.current = null;
    stopStream(localStreamRef.current);
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setMicEnabled(true);
    setCameraEnabled(true);
    setRemoteCameraOff(false);
    setVideoFallback(false);
    setCanSwitchCamera(false);
    setLink('idle');
    cursorRef.current = 0;
    pendingRef.current = [];
    connectedReportedRef.current = false;
  }, [clearConnectTimer]);

  const reset = useCallback(() => {
    teardown();
    setCall(undefined);
    setPhase('idle');
  }, [teardown]);

  const fail = useCallback(
    async (message: string) => {
      setError(message);
      const active = callRef.current;
      teardown();
      setPhase('idle');
      setCall(undefined);
      if (active) await api.end(active.id, 'failed').catch(() => undefined);
    },
    [api, teardown]
  );

  const applySignal = useCallback(async (signal: CallSignal) => {
    const peer = peerRef.current;
    if (!peer) {
      pendingRef.current.push(signal);
      return;
    }
    if (signal.sequence <= cursorRef.current) return;
    cursorRef.current = signal.sequence;
    if (signal.kind === 'offer') await peer.applyRemoteOffer(signal.payload as RTCSessionDescriptionInit);
    else if (signal.kind === 'answer') await peer.applyRemoteAnswer(signal.payload as RTCSessionDescriptionInit);
    else await peer.addRemoteCandidate(signal.payload as RTCIceCandidateInit);
  }, []);

  const drainPending = useCallback(async () => {
    const queued = pendingRef.current.sort((a, b) => a.sequence - b.sequence);
    pendingRef.current = [];
    for (const signal of queued) await applySignal(signal);
  }, [applySignal]);

  const createPeer = useCallback(
    (activeCall: Call, iceServers: IceServer[], stream: MediaStream, caller: boolean) => {
      const peer = new CallPeer(iceServers, caller, {
        onLocalDescription: (description) => {
          const kind = description.type === 'offer' ? 'offer' : 'answer';
          void api
            .sendSignal(activeCall.id, { kind, payload: { type: description.type as 'offer' | 'answer', sdp: description.sdp ?? '' } })
            .catch(() => undefined);
        },
        onIceCandidate: (candidate) => {
          void api
            .sendSignal(activeCall.id, {
              kind: 'candidate',
              payload: {
                candidate: candidate.candidate ?? '',
                sdpMid: candidate.sdpMid ?? null,
                sdpMLineIndex: candidate.sdpMLineIndex ?? null,
                usernameFragment: candidate.usernameFragment ?? null
              }
            })
            .catch(() => undefined);
        },
        onRemoteStream: (incoming) => setRemoteStream(incoming),
        onRemoteVideoMuted: (muted) => setRemoteCameraOff(muted),
        onConnectionState: (state) => {
          if (state === 'connected') {
            clearConnectTimer();
            setLink('connected');
            setPhase('active');
            if (!connectedReportedRef.current) {
              connectedReportedRef.current = true;
              void api.markConnected(activeCall.id).catch(() => undefined);
            }
            return;
          }
          if (state === 'connecting' || state === 'new') {
            setLink((current) => (current === 'connected' ? 'reconnecting' : 'connecting'));
            return;
          }
          if (state === 'disconnected') {
            setLink('reconnecting');
            peerRef.current?.restart();
            return;
          }
          if (state === 'failed') {
            setLink('failed');
            void fail('The call connection failed.');
          }
        },
        onError: (peerError) => void fail(peerError.message)
      });

      peer.addLocalTracks(stream);
      peerRef.current = peer;
      return peer;
    },
    [api, clearConnectTimer, fail]
  );

  const armConnectTimeout = useCallback(() => {
    clearConnectTimer();
    connectTimerRef.current = setTimeout(() => {
      if (peerRef.current && peerRef.current.connectionState !== 'connected') void fail('The call could not connect. Check your network and try again.');
    }, CALL_CONNECT_TIMEOUT_MS);
  }, [clearConnectTimer, fail]);

  const acquireMedia = useCallback(async (media: CallMedia) => {
    const { stream, videoDenied } = await requestLocalMedia(media, facingRef.current);
    localStreamRef.current = stream;
    setLocalStream(stream);
    setVideoFallback(videoDenied);
    setMicEnabled(stream.getAudioTracks().some((track) => track.enabled));
    setCameraEnabled(stream.getVideoTracks().length > 0);
    if (media === 'video' && !videoDenied) setCanSwitchCamera(await hasMultipleCameras());
    return stream;
  }, []);

  const start = useCallback(
    async (conversationId: string, media: CallMedia) => {
      if (!supported) {
        setError('Calling needs a modern browser served over HTTPS.');
        return;
      }
      if (phase !== 'idle') return;
      setError('');
      setPhase('starting');
      try {
        const [{ call: created }, ice] = await Promise.all([api.start(conversationId, media), api.iceServers()]);
        setCall(created);
        callRef.current = created;
        const stream = await acquireMedia(created.media);
        createPeer(created, ice.iceServers, stream, true);
        setPhase('outgoing');
        setLink('connecting');
        await drainPending();
      } catch (caught) {
        teardown();
        setPhase('idle');
        const current = callRef.current;
        if (current) {
          await api.end(current.id, 'failed').catch(() => undefined);
          setCall(undefined);
        }
        setError(caught instanceof CallMediaError || caught instanceof Error ? caught.message : 'The call could not be started.');
      }
    },
    [acquireMedia, api, createPeer, drainPending, phase, supported, teardown]
  );

  const accept = useCallback(async () => {
    const incoming = callRef.current;
    if (!incoming || phase !== 'incoming') return;
    setError('');
    setPhase('connecting');
    try {
      const [{ call: accepted }, ice] = await Promise.all([api.accept(incoming.id), api.iceServers()]);
      setCall(accepted);
      callRef.current = accepted;
      const stream = await acquireMedia(accepted.media);
      createPeer(accepted, ice.iceServers, stream, false);
      setLink('connecting');
      armConnectTimeout();
      const replay = await api.listSignals(accepted.id, 0).catch(() => ({ signals: [] as CallSignal[] }));
      for (const signal of replay.signals) await applySignal(signal);
      await drainPending();
    } catch (caught) {
      teardown();
      setPhase('idle');
      setCall(undefined);
      await api.end(incoming.id, 'failed').catch(() => undefined);
      setError(caught instanceof CallMediaError || caught instanceof Error ? caught.message : 'The call could not be answered.');
    }
  }, [acquireMedia, api, applySignal, armConnectTimeout, createPeer, drainPending, phase, teardown]);

  const decline = useCallback(async () => {
    const incoming = callRef.current;
    reset();
    if (incoming) await api.decline(incoming.id).catch(() => undefined);
  }, [api, reset]);

  const hangUp = useCallback(async () => {
    const active = callRef.current;
    setPhase('ending');
    teardown();
    setCall(undefined);
    setPhase('idle');
    if (active) await api.end(active.id, 'completed').catch(() => undefined);
  }, [api, teardown]);

  const toggleMic = useCallback(() => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    if (!tracks.length) return;
    const next = !tracks[0]!.enabled;
    tracks.forEach((track) => {
      track.enabled = next;
    });
    setMicEnabled(next);
  }, []);

  const toggleCamera = useCallback(() => {
    const tracks = localStreamRef.current?.getVideoTracks() ?? [];
    if (!tracks.length) return;
    const next = !tracks[0]!.enabled;
    tracks.forEach((track) => {
      track.enabled = next;
    });
    setCameraEnabled(next);
  }, []);

  const switchCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    const peer = peerRef.current;
    const existing = stream?.getVideoTracks()[0];
    if (!stream || !peer || !existing) return;
    const nextFacing = facingRef.current === 'user' ? 'environment' : 'user';
    try {
      const track = await requestCameraTrack(nextFacing);
      track.enabled = existing.enabled;
      const replaced = await peer.replaceVideoTrack(track);
      if (!replaced) {
        track.stop();
        return;
      }
      stream.removeTrack(existing);
      existing.stop();
      stream.addTrack(track);
      facingRef.current = nextFacing;
      setLocalStream(stream);
    } catch {
      setError('The camera could not be switched.');
    }
  }, []);

  useRealtimeEvents(
    useCallback(
      (event: RealtimeEvent) => {
        if (event.type === 'call.signal') {
          void applySignal(event.payload).catch(() => undefined);
          return;
        }
        if (event.type !== 'call.updated') return;

        const incoming = event.payload;
        const active = callRef.current;
        if (active && incoming.id !== active.id) return;

        if (incoming.status === 'ended') {
          if (!active) return;
          teardown();
          setCall(undefined);
          setPhase('idle');
          if (incoming.endReason === 'rejected') setError('Call declined.');
          else if (incoming.endReason === 'missed') setError('No answer.');
          else if (incoming.endReason === 'busy') setError('The person you called is on another call.');
          else if (incoming.endReason === 'failed') setError('The call connection failed.');
          return;
        }

        setCall(incoming);
        callRef.current = incoming;

        if (!active) {
          if (incoming.status === 'ringing' && currentUserId && incoming.calleeId === currentUserId) setPhase('incoming');
          return;
        }

        if (incoming.status === 'accepted' && currentUserId && incoming.callerId === currentUserId) {
          setPhase('connecting');
          armConnectTimeout();
        }
      },
      [applySignal, armConnectTimeout, currentUserId, teardown]
    )
  );

  useRealtimeConnect(
    useCallback(() => {
      const active = callRef.current;
      if (!active || !peerRef.current) return;
      void api
        .listSignals(active.id, cursorRef.current)
        .then(async ({ signals }) => {
          for (const signal of signals) await applySignal(signal);
        })
        .catch(() => undefined);
    }, [api, applySignal])
  );

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    void api
      .active()
      .then(({ call: existing }) => {
        if (cancelled || !existing || callRef.current) return;
        if (existing.status !== 'ringing') {
          void api.end(existing.id, 'failed').catch(() => undefined);
          return;
        }
        setCall(existing);
        callRef.current = existing;
        if (currentUserId && existing.calleeId === currentUserId) setPhase('incoming');
        else if (currentUserId && existing.callerId === currentUserId) void api.end(existing.id, 'canceled').catch(() => undefined);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, currentUserId, supported]);

  useEffect(() => {
    if (!call || phase === 'idle' || phase === 'incoming') return;
    const timer = window.setInterval(() => {
      void api.heartbeat(call.id).catch(() => undefined);
    }, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [api, call, phase]);

  useEffect(() => () => teardown(), [teardown]);

  return {
    supported,
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
    error,
    isCaller,
    start,
    accept,
    decline,
    hangUp,
    toggleMic,
    toggleCamera,
    switchCamera,
    dismissError: () => setError('')
  };
}
