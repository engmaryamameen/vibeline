import type { ChatEvent } from '@vibeline/contracts';
type Listener=(event:ChatEvent)=>void;
const listeners=new Map<string,Set<Listener>>();

// In-process delivery only. PostgreSQL remains authoritative; this boundary may
// gain another transport later without changing chat application behavior.
export const realtimePublisher={
  subscribe(userId:string,listener:Listener){const set=listeners.get(userId)??new Set<Listener>();set.add(listener);listeners.set(userId,set);return()=>{set.delete(listener);if(!set.size)listeners.delete(userId);};},
  publish(userIds:string[],event:ChatEvent){for(const id of new Set(userIds))for(const listener of listeners.get(id)??[])listener(event);}
};
