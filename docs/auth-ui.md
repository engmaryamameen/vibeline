# Authentication interface

[← Project overview](../README.md)

The login and signup experience uses a shared form shell and a route-aware visual
panel. Form behavior and decorative artwork remain separate: changing an
illustration does not change validation, session handling, or provider logic.

![Login and signup visual panels](assets/auth-panels-preview.png)

*Design previews with fictional conversations, not screenshots of live chats.*

## Component boundaries

```text
apps/web/src/features/auth/
  components/
    auth-shell.tsx
    auth-visual.tsx
    auth-visual.module.css
  assets/svg/banners/
    index.ts
    login-conversation.svg
    signup-connection.svg
```

`AuthShell` renders `AuthVisual`. The visual component selects a scene using the
current pathname and loads its illustration from the local banner index.

| Route | Scene |
| --- | --- |
| `/login` | Desktop conversation with an overlapping phone, shared image, and voice note. |
| `/register` | Phone conversation with floating messages, avatars, and voice-note accents. |
| Other routes using the auth shell | The general-purpose login scene. |

`/register` is the signup route in this repository.

## Applying the interface update

For a checkout that still has the original abstract panel, merge the `apps/`
folder from the separate auth-interface update into the repository root.
Replace `components/auth-visual.tsx` and add its CSS module, the banner index,
and both SVGs. All five application files must be copied together; the banner
folder may also include an informational README.

No changes are required to the existing shell, login/register forms,
authentication guards, or Google sign-in components. Do not move the banners into
`shared/assets/svg/chat` or modify that icon index.

The portfolio README bundle contains documentation and a preview only; it does
not install these application files.

## Artwork and rendering

The banner assets are local, self-contained SVG illustrations. They are imported
as static image objects and rendered through `next/image` with `unoptimized`.
They are not React SVG components, so this implementation does not require SVGR,
a custom SVG loader, or `dangerouslyAllowSVG`.

Unlike single-color UI icons, these illustrations must not use a CSS mask: their
individual colors are part of the artwork.

The designs use a conversation-led composition rather than copied product
screenshots. They contain no Facebook logos or remote image URLs. Illustrated
people, names, and messages are fictional.

## Layout and accessibility

The panel is hidden below 1024px. On taller desktop viewports it stays alongside
the form with sticky positioning; compact viewports use reduced spacing without
the sticky behavior.

The illustration is decorative and has an empty alternative text value. The
visible heading and description remain HTML text. Illustrated chat controls are
not interactive elements and do not create keyboard stops.

A one-time 520ms entrance animation is disabled when the user requests reduced
motion. The artwork does not loop or autoplay.

## Customization

| Change | File |
| --- | --- |
| Eyebrow, title, accent line, or description | The `scenes` object in [`auth-visual.tsx`](../apps/web/src/features/auth/components/auth-visual.tsx). |
| Background, spacing, breakpoint, or sticky behavior | [`auth-visual.module.css`](../apps/web/src/features/auth/components/auth-visual.module.css). |
| Login illustration | [`login-conversation.svg`](../apps/web/src/features/auth/assets/svg/banners/login-conversation.svg). |
| Signup illustration | [`signup-connection.svg`](../apps/web/src/features/auth/assets/svg/banners/signup-connection.svg). |
| Static asset imports | [`banners/index.ts`](../apps/web/src/features/auth/assets/svg/banners/index.ts). |

Keep filenames and import paths aligned. Copying the TypeScript import without
its SVG file will cause a module-resolution error.

## Verification

Run from the repository root:

```bash
pnpm --filter @vibeline/web typecheck
pnpm --filter @vibeline/web build
```

Then inspect `/login` and `/register` in the configured application. Check narrow
screens, the 1024px breakpoint, a short desktop viewport, a tall signup form,
keyboard navigation, and reduced-motion mode. Confirm that navigation changes the
scene and that no content is clipped or overlaps the form.

The accompanying image is an isolated design preview. It does not establish a
successful application build, React hydration, OAuth behavior, cross-browser
compatibility, or a completed accessibility audit.
