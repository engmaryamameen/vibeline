'use client';

import {
  useEffect,
  useState,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';

type PortalProps = {
  children: ReactNode;
  containerId?: string;
};

export function Portal({
  children,
  containerId = 'overlay-root'
}: PortalProps) {
  const [
    container,
    setContainer
  ] =
    useState<HTMLElement | null>(
      null
    );

  useEffect(() => {
    setContainer(
      document.getElementById(
        containerId
      ) ??
        document.body
    );
  }, [containerId]);

  if (!container) {
    return null;
  }

  return createPortal(
    children,
    container
  );
}