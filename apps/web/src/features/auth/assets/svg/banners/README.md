# VibeLine auth banner assets

Both SVG scenes are original, self-contained vector artwork created for VibeLine.
They contain fictional names, messages, portraits, and an original landscape illustration.
They do not contain Facebook or Messenger branding, screenshots, stock photos,
external image references, scripts, animation, or embedded fonts.

The files are decorative sample conversations, not functional chat widgets.

- `login-conversation.svg`: desktop conversation plus a phone-sized voice note.
- `signup-connection.svg`: phone conversation with surrounding greeting/voice cards.
- `index.ts`: static Next.js image imports, consistent with this application's SVG imports.

The global layout references were Messenger's conversation-led promotional compositions.
No artwork was copied from those references:
https://www.messenger.com/
https://www.meta.com/messenger/

The visible page headline and description live in `components/auth-visual.tsx`,
not in the SVG image. You can update the JSX copy without editing the illustration.
SVG text uses the system Arial/Helvetica/sans-serif stack; no font assets are shipped.
