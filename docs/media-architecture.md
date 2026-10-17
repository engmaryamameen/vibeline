# Camera, editor and media messaging

## Pipeline

```txt
camera or library -> draft File -> editor state -> export -> upload -> message/story
```

The draft is always the raw capture. Effects, crops, rotation and overlays live in
`EditState` and are applied once, at export. Recording captures the unmodified
camera stream rather than a filtered canvas, so the chosen effect is never baked
in twice and can still be changed after recording.

## One renderer

`lib/render-frame.ts` is the only code that draws a frame. The preview canvas, the
image export and the video export all call `renderFrame` with the same
`EditState`, so what the preview shows is what the export writes. The preview is a
canvas (not a CSS-filtered element) specifically to remove the class of bug where
a DOM preview and a canvas export disagree.

`createRenderPlan` resolves output dimensions and decides how colour is applied:

| Condition | Colour path |
| --- | --- |
| `ctx.filter` supported | Native canvas filter |
| Not supported, single frame | `lib/color-matrix.ts` pixel pass |
| Not supported, video | Refused with an explanation (see below) |

Effects are declared as filter operations in `lib/editor-model.ts` and serialised
to a CSS filter string for the live camera preview. The CSS string and the pixel
matrices derive from the same declarations, so the two paths cannot drift.

## Video export

`exportVideo` plays the draft in a detached `<video>`, paints each frame through
`renderFrame` onto a canvas, captures the canvas with `captureStream(30)`, bridges
the source audio through an `AudioContext` into the same `MediaStream`, and records
the result with `MediaRecorder`. Export therefore takes about as long as the clip.

Limitations are reported, never hidden:

- No `MediaRecorder` or no supported container: refuse and offer to send the
  original, explicitly.
- No `ctx.filter` (older Safari): colour effects are refused for video; text,
  stickers, crop and rotation still export. Images are unaffected.
- `createMediaElementSource` unavailable: the edited video is silent and the
  editor says so.

## Shared limits

`packages/contracts/src/media.ts` holds the accepted MIME types, per-kind size
limits and the attachment classifiers. The upload content-type parser, the upload
service, the chat composer and the sidebar previews all read from it, so a file
the client accepts is a file the server accepts.

## Authorization

`GET /v1/media/assets/:id/content` resolves access in one SQL predicate. A
requester may read an asset when they own it, when it is attached to a
non-deleted message in a conversation where they are an active member at or after
their joined sequence and have not deleted it for themselves, or when it backs a
live story visible to them. Asset ids are server-generated UUIDs and are also the
storage keys; the storage layer rejects any key that is not a UUID.
