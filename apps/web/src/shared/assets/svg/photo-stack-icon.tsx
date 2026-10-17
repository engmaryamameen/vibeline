import type { SVGProps } from 'react';

export function PhotoStackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M20 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 14H8V4h12v12Zm-8.5-2.33 1.69 2.26 2.48-3.1L19 15H9l2.5-3.33ZM2 6v14a2 2 0 0 0 2 2h14v-2H4V6H2Z" />
    </svg>
  );
}
