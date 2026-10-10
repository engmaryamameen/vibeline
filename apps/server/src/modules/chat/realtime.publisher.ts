import { randomUUID } from 'node:crypto';
import pg from 'pg';
import type { FastifyBaseLogger } from 'fastify';
import type { ChatEvent, ChatEventType } from '@vibeline/contracts';
import { env } from '@/config/env';
import { pool } from '@/db/client';

type Listener = (event: ChatEvent) => void;
type PayloadRef = { kind: string; id: string };
type PayloadLoader = (id: string, conversationId: string) => Promise<unknown | undefined>;
type Envelope = {
  origin: string;
  memberIds: string[];
  type: ChatEventType;
  conversationId: string;
  ref?: PayloadRef;
  payload?: unknown;
};

const CHANNEL = 'vibeline_chat_events';
const RECONNECT_DELAY_MS = 5_000;
const INSTANCE_ID = randomUUID();

const listeners = new Map<string, Set<Listener>>();
const loaders = new Map<string, PayloadLoader>();

let subscriber: pg.Client | null = null;
let reconnectTimer: NodeJS.Timeout | undefined;
let stopped = true;
let logger: FastifyBaseLogger | undefined;

const deliver = (ids: string[], event: ChatEvent) => {
  for (const id of new Set(ids)) for (const listener of listeners.get(id) ?? []) listener(event);
};

const schedule = () => {
  if (stopped || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    void connect();
  }, RECONNECT_DELAY_MS);
  reconnectTimer.unref();
};

const consume = async (raw: string) => {
  const envelope = JSON.parse(raw) as Envelope;
  if (envelope.origin === INSTANCE_ID) return;
  if (!envelope.memberIds?.some((id) => listeners.has(id))) return;
  let payload = envelope.payload;
  if (envelope.ref) {
    const loader = loaders.get(envelope.ref.kind);
    if (!loader) return;
    payload = await loader(envelope.ref.id, envelope.conversationId);
  }
  if (payload === undefined) return;
  deliver(envelope.memberIds, { type: envelope.type, conversationId: envelope.conversationId, payload });
};

const connect = async () => {
  if (stopped || subscriber) return;
  const client = new pg.Client({ connectionString: env.DATABASE_URL, application_name: 'vibeline-realtime' });
  client.on('notification', (notification) => {
    if (!notification.payload) return;
    void consume(notification.payload).catch((error) => logger?.error({ error, operation: 'realtime.consume' }, 'realtime consume failed'));
  });
  client.on('error', () => {
    if (subscriber === client) subscriber = null;
    void client.end().catch(() => undefined);
    schedule();
  });
  client.on('end', () => {
    if (subscriber === client) subscriber = null;
    schedule();
  });
  try {
    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
    subscriber = client;
  } catch {
    await client.end().catch(() => undefined);
    schedule();
  }
};

export const realtimePublisher = {
  subscribe(userId: string, listener: Listener) {
    const set = listeners.get(userId) ?? new Set<Listener>();
    set.add(listener);
    listeners.set(userId, set);
    return () => {
      set.delete(listener);
      if (!set.size) listeners.delete(userId);
    };
  },

  registerLoader(kind: string, loader: PayloadLoader) {
    loaders.set(kind, loader);
  },

  start(log: FastifyBaseLogger) {
    logger = log;
    stopped = false;
    void connect();
  },

  async stop() {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
    const client = subscriber;
    subscriber = null;
    if (client) await client.end().catch(() => undefined);
  },

  async publish(memberIds: string[], event: ChatEvent, ref?: PayloadRef) {
    const ids = [...new Set(memberIds)];
    deliver(ids, event);
    const envelope: Envelope = {
      origin: INSTANCE_ID,
      memberIds: ids,
      type: event.type,
      conversationId: event.conversationId,
      ...(ref ? { ref } : { payload: event.payload })
    };
    await pool.query('SELECT pg_notify($1,$2)', [CHANNEL, JSON.stringify(envelope)]);
  }
};
