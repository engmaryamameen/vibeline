'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { realtimeEventSchema, type RealtimeEvent } from '@vibeline/contracts';
import { env } from '@/src/lib/env';
import { refreshAuthSession } from '@/src/lib/auth-session';
import { useAuthStore } from '@/src/store/auth.store';

type EventHandler = (event: RealtimeEvent) => void;
type ConnectHandler = () => void;

type RealtimeContextValue = {
  connected: boolean;
  subscribe: (handler: EventHandler) => () => void;
  subscribeConnect: (handler: ConnectHandler) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const RECONNECT_DELAY_MS = 1_000;
const FRAME_SEPARATOR = '\n\n';

const parseFrame = (frame: string) => {
  let eventName: string | undefined;
  const dataLines: string[] = [];
  for (const line of frame.split('\n')) {
    if (line.startsWith('event: ')) eventName = line.slice(7);
    else if (line.startsWith('data: ')) dataLines.push(line.slice(6));
  }
  return { eventName, data: dataLines.length ? dataLines.join('\n') : undefined };
};

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const [connected, setConnected] = useState(false);
  const eventHandlers = useRef(new Set<EventHandler>());
  const connectHandlers = useRef(new Set<ConnectHandler>());

  const subscribe = useCallback((handler: EventHandler) => {
    eventHandlers.current.add(handler);
    return () => {
      eventHandlers.current.delete(handler);
    };
  }, []);

  const subscribeConnect = useCallback((handler: ConnectHandler) => {
    connectHandlers.current.add(handler);
    return () => {
      connectHandlers.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setConnected(false);
      return;
    }

    const controller = new AbortController();
    let retryTimer: number | undefined;

    const openStream = async () => {
      const accessToken = useAuthStore.getState().token;
      if (!accessToken) return undefined;
      const request = (bearer: string) =>
        fetch(`${env.apiBaseUrl}/chat/events`, {
          headers: { authorization: `Bearer ${bearer}` },
          credentials: 'include',
          signal: controller.signal
        });
      let response = await request(accessToken);
      if (response.status === 401) {
        const refreshed = await refreshAuthSession();
        response = await request(refreshed.tokens.accessToken);
      }
      if (!response.ok || !response.body) throw new Error('Realtime connection failed');
      return response.body.getReader();
    };

    const run = async () => {
      while (!controller.signal.aborted) {
        try {
          const reader = await openStream();
          if (!reader) return;
          const decoder = new TextDecoder();
          let buffer = '';
          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let boundary = buffer.indexOf(FRAME_SEPARATOR);
            while (boundary >= 0) {
              const frame = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + FRAME_SEPARATOR.length);
              const { eventName, data } = parseFrame(frame);
              if (eventName === 'connected') {
                setConnected(true);
                for (const handler of connectHandlers.current) handler();
              } else if (data) {
                const parsed = realtimeEventSchema.safeParse(JSON.parse(data));
                if (parsed.success) for (const handler of eventHandlers.current) handler(parsed.data);
              }
              boundary = buffer.indexOf(FRAME_SEPARATOR);
            }
          }
        } catch {
          if (controller.signal.aborted) return;
        }
        setConnected(false);
        if (controller.signal.aborted) return;
        await new Promise<void>((resolve) => {
          retryTimer = window.setTimeout(resolve, RECONNECT_DELAY_MS);
        });
      }
    };

    void run();

    return () => {
      controller.abort();
      if (retryTimer) window.clearTimeout(retryTimer);
      setConnected(false);
    };
  }, [token]);

  const value = useMemo<RealtimeContextValue>(() => ({ connected, subscribe, subscribeConnect }), [connected, subscribe, subscribeConnect]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('Realtime hooks require a RealtimeProvider ancestor');
  return context;
};

export const useRealtimeEvents = (handler: EventHandler) => {
  const { subscribe } = useRealtimeContext();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => subscribe((event) => handlerRef.current(event)), [subscribe]);
};

export const useRealtimeConnect = (handler: ConnectHandler) => {
  const { subscribeConnect } = useRealtimeContext();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => subscribeConnect(() => handlerRef.current()), [subscribeConnect]);
};

export const useRealtimeConnected = () => useRealtimeContext().connected;
