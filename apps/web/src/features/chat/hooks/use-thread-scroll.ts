'use client';

import { useCallback, useEffect, useRef } from 'react';

const NEAR_BOTTOM_PX = 120;

type Options = {
  conversationId: string | undefined;
  latestMessageId: string | undefined;
  latestIsOwn: boolean;
  messageCount: number;
  pending: boolean;
};

export type ThreadScroll = {
  viewportRef: (node: HTMLDivElement | null) => void;
  onScroll: () => void;
  captureBeforeLoadOlder: () => void;
};

export const useThreadScroll = ({ conversationId, latestMessageId, latestIsOwn, messageCount, pending }: Options): ThreadScroll => {
  const viewport = useRef<HTMLDivElement | null>(null);
  const nearBottom = useRef(true);
  const heightBeforeOlder = useRef<number | null>(null);
  const lastSeenLatestId = useRef<string>();
  const lastConversationId = useRef<string>();

  const viewportRef = useCallback((node: HTMLDivElement | null) => {
    viewport.current = node;
  }, []);

  const onScroll = useCallback(() => {
    const node = viewport.current;
    if (!node) return;
    nearBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight <= NEAR_BOTTOM_PX;
  }, []);

  const captureBeforeLoadOlder = useCallback(() => {
    heightBeforeOlder.current = viewport.current?.scrollHeight ?? null;
  }, []);

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;

    const jump = () => {
      node.scrollTop = node.scrollHeight;
      nearBottom.current = true;
    };

    if (conversationId !== lastConversationId.current) {
      lastConversationId.current = conversationId;
      lastSeenLatestId.current = latestMessageId;
      heightBeforeOlder.current = null;
      jump();
      return;
    }

    if (heightBeforeOlder.current !== null) {
      const delta = node.scrollHeight - heightBeforeOlder.current;
      heightBeforeOlder.current = null;
      if (delta > 0) {
        node.scrollTop += delta;
        return;
      }
    }

    const latestChanged = latestMessageId !== lastSeenLatestId.current;
    lastSeenLatestId.current = latestMessageId;

    if (!latestChanged && !pending) return;
    if (latestChanged && !latestIsOwn && !nearBottom.current) return;
    if (!latestChanged && !nearBottom.current) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      jump();
      return;
    }
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
    nearBottom.current = true;
  }, [conversationId, latestMessageId, latestIsOwn, messageCount, pending]);

  return { viewportRef, onScroll, captureBeforeLoadOlder };
};
