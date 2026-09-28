import pg from 'pg';
import type { FastifyBaseLogger } from 'fastify';
import type { ChatEvent,ChatEventType,Message } from '@vibeline/contracts';
import { env } from '@/config/env';
import { pool } from '@/db/client';

type Listener=(event:ChatEvent)=>void;
type RealtimeEnvelope={memberIds:string[];type:ChatEventType;conversationId:string;messageId:string};
type MessageLoader=(conversationId:string,messageId:string)=>Promise<Message|undefined>;
const CHANNEL='vibeline_chat_events';
const listeners=new Map<string,Set<Listener>>();
let subscriber:pg.Client|null=null;
let reconnectTimer:NodeJS.Timeout|undefined;
let stopped=true;
let loadMessage:MessageLoader|undefined;
let logger:FastifyBaseLogger|undefined;

const deliver=(memberIds:string[],event:ChatEvent)=>{
  for(const id of new Set(memberIds))for(const listener of listeners.get(id)??[])listener(event);
};
const parseEnvelope=(payload:string|undefined):RealtimeEnvelope|null=>{
  if(!payload)return null;
  try{
    const value=JSON.parse(payload) as Partial<RealtimeEnvelope>;
    const validTypes:ChatEventType[]=['message.created','message.updated','message.deleted','conversation.updated'];
    if(!Array.isArray(value.memberIds)||!value.memberIds.every(id=>typeof id==='string')||!validTypes.includes(value.type as ChatEventType)||typeof value.conversationId!=='string'||typeof value.messageId!=='string')return null;
    return value as RealtimeEnvelope;
  }catch{return null;}
};
const scheduleReconnect=()=>{
  if(stopped||reconnectTimer)return;
  reconnectTimer=setTimeout(()=>{reconnectTimer=undefined;void connect();},5_000);
  reconnectTimer.unref();
};
const connect=async()=>{
  if(stopped||subscriber)return;
  const client=new pg.Client({connectionString:env.DATABASE_URL,application_name:'vibeline-realtime'});
  client.on('notification',notification=>{void(async()=>{
    const envelope=parseEnvelope(notification.payload);if(!envelope||!loadMessage)return;
    if(!envelope.memberIds.some(id=>listeners.has(id)))return;
    const message=await loadMessage(envelope.conversationId,envelope.messageId);if(!message)return;
    deliver(envelope.memberIds,{type:envelope.type,conversationId:envelope.conversationId,payload:message});
  })().catch(error=>logger?.error({error,operation:'chat.realtime.consume'},'realtime event consumption failed'));});
  client.on('error',error=>{logger?.error({error,operation:'chat.realtime.listen'},'realtime database listener failed');if(subscriber===client)subscriber=null;void client.end().catch(()=>undefined);scheduleReconnect();});
  client.on('end',()=>{if(subscriber===client)subscriber=null;scheduleReconnect();});
  try{await client.connect();await client.query(`LISTEN ${CHANNEL}`);subscriber=client;logger?.info({operation:'chat.realtime.listen'},'realtime database listener connected');}
  catch(error){logger?.error({error,operation:'chat.realtime.listen'},'realtime database listener connection failed');await client.end().catch(()=>undefined);scheduleReconnect();}
};

export const realtimePublisher={
  subscribe(userId:string,listener:Listener){const set=listeners.get(userId)??new Set<Listener>();set.add(listener);listeners.set(userId,set);return()=>{set.delete(listener);if(!set.size)listeners.delete(userId);};},
  subscriberCount(){let count=0;for(const set of listeners.values())count+=set.size;return count;},
  start(loader:MessageLoader,appLogger:FastifyBaseLogger){loadMessage=loader;logger=appLogger;stopped=false;void connect();},
  async stop(){stopped=true;if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=undefined;}const client=subscriber;subscriber=null;if(client)await client.end();},
  async publish(memberIds:string[],event:ChatEvent & {payload:Message}){
    deliver(memberIds,event);
    const envelope:RealtimeEnvelope={memberIds:[...new Set(memberIds)],type:event.type,conversationId:event.conversationId,messageId:event.payload.id};
    await pool.query('SELECT pg_notify($1, $2)',[CHANNEL,JSON.stringify(envelope)]);
  }
};
