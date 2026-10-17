import type { SVGProps } from 'react';

export function PhotoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H5V5h14v14Zm-10.5-5.5 2.5 3.01L14.5 12l4.5 6H5l3.5-4.5Z" />
    </svg>
  );
}
