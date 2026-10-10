# Calling

One-to-one audio and video calls share every layer. `media` (`audio` | `video`) only
decides the initial `getUserMedia` constraints and whether a video track is added;
lifecycle, signalling, authorization and persistence are identical.

## State machine

```txt
ringing ──accept──> accepted ──ICE connected──> connected ──end──> ended(completed)
   │                    │                           │
   ├─decline──────> ended(rejected)                 └─heartbeat lost─> ended(failed)
   ├─caller cancel─> ended(canceled)
   └─ring timeout──> ended(missed)
```

`calls.status` is the single source of truth. Check constraints keep the terminal
shape honest: `status = 'ended'` if and only if both `ended_at` and `end_reason`
are set.

## Busy state

`call_participants` carries a denormalised `active` flag with
`CREATE UNIQUE INDEX ... ON (user_id) WHERE active`. A user can therefore be in at
most one live call, enforced by Postgres rather than by application checks. Two
people calling each other at the same instant resolve deterministically: the
losing insert hits the unique violation, which the repository translates to
`CALL_BUSY` (HTTP 409).

## Signalling

Signalling rides the existing realtime channel; media never touches the API.

SDP offers routinely exceed the 8 kB `pg_notify` payload limit, so signals are
written to `call_signals` and the notification carries only `{kind: 'call-signal', id}`.
The receiving instance loads the row and delivers it to that recipient. `sequence`
is a `bigserial`, which gives clients a replay cursor: on reconnect the client
calls `GET /v1/calls/:id/signals?afterSequence=<cursor>` and applies whatever it
missed. Signals are deleted when the call ends.

The caller is the only offerer. It negotiates from `onnegotiationneeded`, which
covers both the initial offer and ICE restarts; the callee only ever answers. That
removes offer glare without needing perfect-negotiation rollback. Candidates that
arrive before the remote description are buffered and flushed afterwards.

Camera on/off and camera switching deliberately avoid renegotiation: toggling sets
`track.enabled`, switching uses `sender.replaceTrack`. The remote side reports the
peer's camera state from the receiver track's `mute`/`unmute` events, which is
best-effort and browser-dependent.

## Failure handling

| Failure | Handling |
| --- | --- |
| Microphone denied | Call is not created; the reason is shown |
| Camera denied on a video call | Falls back to audio only and says so |
| No answer within `CALL_RING_TIMEOUT_MS` (45s) | Server sweeper ends the call as `missed` |
| Not connected within `CALL_CONNECT_TIMEOUT_MS` (30s) | Client ends the call as `failed` |
| `connectionState: 'disconnected'` | UI shows reconnecting; the caller restarts ICE |
| `connectionState: 'failed'` | Call ends as `failed` |
| Client crash or tab close mid-call | Heartbeats stop; the sweeper ends the call after 60s so neither party stays busy |

Reloading the page during an in-progress call ends that call rather than showing a
dead session, because the peer connection cannot be restored. A still-ringing
incoming call survives a reload.

## TURN credentials

`GET /v1/calls/ice-servers` requires authentication and returns STUN URLs plus, when
TURN is configured, a credential pair minted per request: username `<expiry>:<userId>`
and credential `base64(HMAC-SHA1(CALL_TURN_SECRET, username))`, matching coturn's
`use-auth-secret` scheme. The shared secret never leaves the server.
