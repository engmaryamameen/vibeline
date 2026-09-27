type ChatEvent = { type: 'message.created'|'message.updated'|'message.deleted'|'conversation.updated'; conversationId: string; payload: unknown };
type Listener = (event: ChatEvent) => void;
const listeners = new Map<string, Set<Listener>>();
export const chatEvents = {
  subscribe(userId: string, listener: Listener) { const set = listeners.get(userId) ?? new Set(); set.add(listener); listeners.set(userId, set); return () => { set.delete(listener); if (!set.size) listeners.delete(userId); }; },
  publish(userIds: string[], event: ChatEvent) { for (const id of new Set(userIds)) for (const listener of listeners.get(id) ?? []) listener(event); }
};
