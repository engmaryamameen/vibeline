import type { IceServer } from '@vibeline/contracts';

export type PeerHandlers = {
  onLocalDescription: (description: RTCSessionDescriptionInit) => void;
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionState: (state: RTCPeerConnectionState) => void;
  onRemoteVideoMuted: (muted: boolean) => void;
  onError: (error: Error) => void;
};

export class CallPeer {
  private readonly connection: RTCPeerConnection;
  private readonly remoteStream = new MediaStream();
  private readonly pendingCandidates: RTCIceCandidateInit[] = [];
  private remoteDescriptionSet = false;
  private negotiating = false;
  private closed = false;

  constructor(
    iceServers: IceServer[],
    private readonly isCaller: boolean,
    private readonly handlers: PeerHandlers
  ) {
    this.connection = new RTCPeerConnection({
      iceServers: iceServers.map((server) => ({
        urls: server.urls,
        ...(server.username ? { username: server.username } : {}),
        ...(server.credential ? { credential: server.credential } : {})
      })),
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    this.connection.onicecandidate = (event) => {
      if (event.candidate) this.handlers.onIceCandidate(event.candidate.toJSON());
    };

    this.connection.ontrack = (event) => {
      this.remoteStream.addTrack(event.track);
      if (event.track.kind === 'video') {
        event.track.onmute = () => this.handlers.onRemoteVideoMuted(true);
        event.track.onunmute = () => this.handlers.onRemoteVideoMuted(false);
        this.handlers.onRemoteVideoMuted(event.track.muted);
      }
      event.track.onended = () => this.remoteStream.removeTrack(event.track);
      this.handlers.onRemoteStream(this.remoteStream);
    };

    this.connection.onconnectionstatechange = () => {
      if (!this.closed) this.handlers.onConnectionState(this.connection.connectionState);
    };

    if (this.isCaller) {
      this.connection.onnegotiationneeded = () => {
        void this.negotiate();
      };
    }
  }

  private async negotiate() {
    if (this.closed || this.negotiating) return;
    this.negotiating = true;
    try {
      const offer = await this.connection.createOffer();
      if (this.connection.signalingState !== 'stable') return;
      await this.connection.setLocalDescription(offer);
      if (this.connection.localDescription) this.handlers.onLocalDescription(this.connection.localDescription.toJSON());
    } catch (error) {
      this.handlers.onError(error instanceof Error ? error : new Error('Call negotiation failed'));
    } finally {
      this.negotiating = false;
    }
  }

  addLocalTracks(stream: MediaStream) {
    for (const track of stream.getTracks()) this.connection.addTrack(track, stream);
  }

  async applyRemoteOffer(description: RTCSessionDescriptionInit) {
    if (this.closed) return;
    try {
      await this.connection.setRemoteDescription(description);
      this.remoteDescriptionSet = true;
      await this.flushCandidates();
      const answer = await this.connection.createAnswer();
      await this.connection.setLocalDescription(answer);
      if (this.connection.localDescription) this.handlers.onLocalDescription(this.connection.localDescription.toJSON());
    } catch (error) {
      this.handlers.onError(error instanceof Error ? error : new Error('Call offer could not be applied'));
    }
  }

  async applyRemoteAnswer(description: RTCSessionDescriptionInit) {
    if (this.closed || this.connection.signalingState !== 'have-local-offer') return;
    try {
      await this.connection.setRemoteDescription(description);
      this.remoteDescriptionSet = true;
      await this.flushCandidates();
    } catch (error) {
      this.handlers.onError(error instanceof Error ? error : new Error('Call answer could not be applied'));
    }
  }

  async addRemoteCandidate(candidate: RTCIceCandidateInit) {
    if (this.closed) return;
    if (!this.remoteDescriptionSet) {
      this.pendingCandidates.push(candidate);
      return;
    }
    await this.connection.addIceCandidate(candidate).catch(() => undefined);
  }

  private async flushCandidates() {
    while (this.pendingCandidates.length) {
      const candidate = this.pendingCandidates.shift()!;
      await this.connection.addIceCandidate(candidate).catch(() => undefined);
    }
  }

  async replaceVideoTrack(track: MediaStreamTrack | null) {
    const sender = this.connection.getSenders().find((item) => item.track?.kind === 'video');
    if (!sender) return false;
    await sender.replaceTrack(track);
    return true;
  }

  restart() {
    if (this.closed || !this.isCaller) return;
    this.connection.restartIce();
    void this.negotiate();
  }

  get connectionState() {
    return this.connection.connectionState;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.connection.onicecandidate = null;
    this.connection.ontrack = null;
    this.connection.onconnectionstatechange = null;
    this.connection.onnegotiationneeded = null;
    this.remoteStream.getTracks().forEach((track) => this.remoteStream.removeTrack(track));
    this.connection.close();
  }
}
