import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { and, eq, inArray } from 'drizzle-orm';
import { db, pool } from '../src/db/client';
import { conversationMembers, conversations, messages, users } from '../src/db/schema';
import { chatService } from '../src/modules/chat/chat.service';
import { sessionService } from '../src/modules/auth/session.service';
import { assistantService } from '../src/modules/assistant/assistant.service';
import type { ModelGateway } from '../src/modules/assistant/model.gateway';

const ids={a:randomUUID(),b:randomUUID(),outsider:randomUUID()};
let conversationId='';
before(async()=>{if(process.env.RUN_DB_TESTS!=='1')return;await db.insert(users).values(Object.values(ids).map((id,i)=>({id,email:`chat-test-${id}@example.com`,displayName:`Test ${i}`,emailVerified:true})));const c=await chatService.createConversation(ids.a,[ids.b],'direct');conversationId=c.id;});
after(async()=>{if(process.env.RUN_DB_TESTS!=='1')return;await db.delete(conversations).where(inArray(conversations.id,(await db.select({id:conversations.id}).from(conversations)).map(r=>r.id)));await db.delete(users).where(inArray(users.id,Object.values(ids)));await pool.end();});
const dbTest=(name:string,fn:()=>Promise<void>)=>test(name,{skip:process.env.RUN_DB_TESTS!=='1'},fn);
dbTest('non-member cannot read a conversation',async()=>{await assert.rejects(()=>chatService.getConversation(ids.outsider,conversationId),(e:any)=>e.code==='CONVERSATION_NOT_FOUND');});
dbTest('same clientMessageId is idempotent',async()=>{const clientMessageId=randomUUID();const first=await chatService.sendMessage(ids.a,conversationId,clientMessageId,'hello');const retry=await chatService.sendMessage(ids.a,conversationId,clientMessageId,'hello');assert.equal(first.message.id,retry.message.id);assert.equal(retry.created,false);});
dbTest('concurrent sends allocate unique ordered sequences',async()=>{const results=await Promise.all(Array.from({length:12},(_,i)=>chatService.sendMessage(ids.a,conversationId,randomUUID(),`m${i}`)));const seq=results.map(r=>r.message.sequence);assert.equal(new Set(seq).size,seq.length);const sorted=[...seq].sort((a,b)=>a-b);for(let i=1;i<sorted.length;i++)assert.equal(sorted[i],sorted[i-1]+1);});
dbTest('concurrent duplicate retries create one durable message',async()=>{const clientMessageId=randomUUID();const results=await Promise.all(Array.from({length:8},()=>chatService.sendMessage(ids.a,conversationId,clientMessageId,'once')));assert.equal(new Set(results.map(r=>r.message.id)).size,1);const rows=await db.select().from(messages).where(eq(messages.clientMessageId,clientMessageId));assert.equal(rows.length,1);});
dbTest('cursor history does not overlap',async()=>{const first=await chatService.listMessages(ids.a,conversationId,undefined,undefined,5);assert.ok(first.length>0);const older=await chatService.listMessages(ids.a,conversationId,first[0]!.sequence,undefined,5);assert.ok(older.every(m=>m.sequence<first[0]!.sequence));});

dbTest('conversation list exposes peer identity and latest visible message without extra client queries',async()=>{
  await chatService.sendMessage(ids.b,conversationId,randomUUID(),'latest list preview');
  const list=await chatService.listConversations(ids.a);
  const direct=list.find(c=>c.id===conversationId);
  assert.equal(direct?.displayTitle,'Test 1');
  assert.equal(direct?.lastMessage,'latest list preview');
  assert.equal(direct?.lastMessageSenderId,ids.b);
  assert.ok(direct?.lastMessageAt);
});

dbTest('direct conversation creation converges under concurrency',async()=>{const results=await Promise.all(Array.from({length:6},()=>chatService.createConversation(ids.a,[ids.b],'direct')));assert.equal(new Set(results.map(c=>c.id)).size,1);});

dbTest('refresh rotation detects reuse and revokes the account sessions',async()=>{const first=await sessionService.create(ids.a);const second=await sessionService.rotate(first);assert.notEqual(second.refreshToken,first);await assert.rejects(()=>sessionService.rotate(first),(e:any)=>e.code==='REFRESH_TOKEN_REUSED');});

dbTest('direct conversations reject anything other than exactly one peer',async()=>{await assert.rejects(()=>chatService.createConversation(ids.a,[],'direct'),(e:any)=>e.code==='INVALID_DIRECT_PARTICIPANTS');await assert.rejects(()=>chatService.createConversation(ids.a,[ids.b,ids.outsider],'direct'),(e:any)=>e.code==='INVALID_DIRECT_PARTICIPANTS');});

dbTest('concurrent send and removal serialize without post-removal writes',async()=>{
  const g=await chatService.createConversation(ids.a,[ids.b],'group','race');
  await Promise.allSettled([chatService.sendMessage(ids.b,g.id,randomUUID(),'racing'),chatService.removeMember(ids.a,g.id,ids.b)]);
  await assert.rejects(()=>chatService.sendMessage(ids.b,g.id,randomUUID(),'after removal'),(e:any)=>e.code==='CONVERSATION_NOT_FOUND');
});

dbTest('owner leave transfers ownership deterministically and preserves one owner',async()=>{
  const g=await chatService.createConversation(ids.a,[ids.b,ids.outsider],'group','owners');
  await chatService.updateMemberRole(ids.a,g.id,ids.b,'admin');
  await chatService.leaveConversation(ids.a,g.id);
  const view=await chatService.getConversation(ids.b,g.id);
  assert.equal(view.members.filter(m=>m.role==='owner').length,1);
  assert.equal(view.members.find(m=>m.userId===ids.b)?.role,'owner');
});

dbTest('rejoining starts a new visibility period',async()=>{
  const g=await chatService.createConversation(ids.a,[ids.b],'group','history');
  await chatService.sendMessage(ids.a,g.id,randomUUID(),'before leave');
  await chatService.removeMember(ids.a,g.id,ids.b);
  await chatService.sendMessage(ids.a,g.id,randomUUID(),'while away');
  await chatService.addMember(ids.a,g.id,ids.b);
  const visible=await chatService.listMessages(ids.b,g.id,undefined,undefined,50);
  assert.equal(visible.some(m=>m.body==='before leave'),false);
  assert.equal(visible.some(m=>m.body==='while away'),false);
  await chatService.sendMessage(ids.a,g.id,randomUUID(),'after rejoin');
  const after=await chatService.listMessages(ids.b,g.id,undefined,undefined,50);
  assert.equal(after.some(m=>m.body==='after rejoin'),true);
});

dbTest('message delete is idempotent and edit cannot resurrect a tombstone',async()=>{
  const sent=await chatService.sendMessage(ids.a,conversationId,randomUUID(),'delete me');
  const first=await chatService.deleteMessage(ids.a,conversationId,sent.message.id,'everyone');
  const retry=await chatService.deleteMessage(ids.a,conversationId,sent.message.id,'everyone');
  assert.equal(first.id,retry.id);assert.ok(retry.deletedAt);assert.equal(retry.body,'');
  await assert.rejects(()=>chatService.editMessage(ids.a,conversationId,sent.message.id,'resurrect'),(e:any)=>e.code==='MESSAGE_DELETED');
});

dbTest('delete for me hides only the requesting member copy',async()=>{
  const sent=await chatService.sendMessage(ids.a,conversationId,randomUUID(),'private delete');
  await chatService.deleteMessage(ids.b,conversationId,sent.message.id,'me');
  const hidden=await chatService.listMessages(ids.b,conversationId,undefined,undefined,100);
  const retained=await chatService.listMessages(ids.a,conversationId,undefined,undefined,100);
  assert.equal(hidden.some(message=>message.id===sent.message.id),false);
  assert.equal(retained.some(message=>message.id===sent.message.id),true);
});

dbTest('conversation list keeps global deletion as a tombstone preview',async()=>{
  const sent=await chatService.sendMessage(ids.a,conversationId,randomUUID(),'global delete preview');
  await chatService.deleteMessage(ids.a,conversationId,sent.message.id,'everyone');
  const list=await chatService.listConversations(ids.b);
  const direct=list.find(conversation=>conversation.id===conversationId);
  assert.equal(direct?.lastMessage,'');
  assert.ok(direct?.lastMessageDeletedAt);
  assert.equal(direct?.lastMessageSenderId,ids.a);
});

dbTest('catch-up after a sequence returns committed messages in ascending order',async()=>{
  const marker=await chatService.sendMessage(ids.a,conversationId,randomUUID(),'catch-up marker');
  const created=await Promise.all(Array.from({length:6},(_,i)=>chatService.sendMessage(ids.a,conversationId,randomUUID(),`catch-up ${i}`)));
  const caughtUp=await chatService.listMessages(ids.a,conversationId,undefined,marker.message.sequence,100);
  assert.deepEqual(caughtUp.map(message=>message.sequence),created.map(result=>result.message.sequence).sort((a,b)=>a-b));
});

dbTest('rejoined members are not realtime recipients for messages outside their visibility period',async()=>{
  const g=await chatService.createConversation(ids.a,[ids.b],'group','realtime visibility');
  const before=await chatService.sendMessage(ids.a,g.id,randomUUID(),'before realtime rejoin');
  await chatService.removeMember(ids.a,g.id,ids.b);
  await chatService.addMember(ids.a,g.id,ids.b);
  const { chatRepository }=await import('../src/modules/chat/chat.repository');
  const recipients=await chatRepository.listMessageRecipientIds(g.id,before.message.sequence);
  assert.equal(recipients.some(member=>member.userId===ids.b),false);
});


dbTest('assistant generation is durable, sequenced, and idempotent',async()=>{
  const g=await chatService.createConversation(ids.a,[ids.b],'group','assistant');
  await assistantService.enable(ids.a,g.id,'Helper');
  await chatService.sendMessage(ids.a,g.id,randomUUID(),'summarize this point');
  let calls=0;
  const gateway:ModelGateway={describe:()=>({provider:'test',model:'test-model'}),generate:async()=>{calls++;return {text:'A deterministic response',provider:'test',model:'test-model',inputTokens:12,outputTokens:4,totalTokens:16};}};
  assistantService.setGatewayForTests(gateway);
  const requestId=randomUUID();
  const [first,retry]=await Promise.all([assistantService.requestResponse(ids.a,g.id,requestId),assistantService.requestResponse(ids.a,g.id,requestId)]);
  assert.equal(calls,1);
  const completed=first.message?first:retry;
  assert.ok(completed.message);
  assert.equal(completed.message!.assistantId!==undefined,true);
  assert.equal(completed.message!.senderId??undefined,undefined);
  const later=await assistantService.requestResponse(ids.a,g.id,requestId);
  assert.equal(later.message?.id,completed.message!.id);
  assert.equal(calls,1);
});

dbTest('assistant context respects the invoking membership visibility period',async()=>{
  const g=await chatService.createConversation(ids.a,[ids.b],'group','assistant visibility');
  await assistantService.enable(ids.a,g.id,'Helper');
  await chatService.sendMessage(ids.a,g.id,randomUUID(),'hidden before rejoin');
  await chatService.removeMember(ids.a,g.id,ids.b);
  await chatService.addMember(ids.a,g.id,ids.b);
  await chatService.sendMessage(ids.a,g.id,randomUUID(),'visible after rejoin');
  let context='';
  assistantService.setGatewayForTests({describe:()=>({provider:'test',model:'test-model'}),generate:async({messages})=>{context=messages.map(m=>m.content).join('|');return {text:'ok',provider:'test',model:'test-model'};}});
  await assistantService.requestResponse(ids.b,g.id,randomUUID());
  assert.equal(context.includes('hidden before rejoin'),false);
  assert.equal(context.includes('visible after rejoin'),true);
});

dbTest('provider failure records failure without creating an assistant message',async()=>{
  const g=await chatService.createConversation(ids.a,[ids.b],'group','assistant failure');
  await assistantService.enable(ids.a,g.id,'Helper');
  const before=await chatService.listMessages(ids.a,g.id,undefined,undefined,100);
  assistantService.setGatewayForTests({describe:()=>({provider:'test',model:'test-model'}),generate:async()=>{throw new Error('provider down');}});
  await assert.rejects(()=>assistantService.requestResponse(ids.a,g.id,randomUUID()),(e:any)=>e.code==='ASSISTANT_GENERATION_FAILED');
  const after=await chatService.listMessages(ids.a,g.id,undefined,undefined,100);
  assert.equal(after.length,before.length);
});

dbTest('assistant result is rejected when requester is removed while provider is running',async()=>{
  const g=await chatService.createConversation(ids.a,[ids.b],'group','assistant revoke');
  await assistantService.enable(ids.a,g.id,'Helper');
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  assistantService.setGatewayForTests({describe:()=>({provider:'test',model:'test-model'}),generate:async()=>{await gate;return {text:'must not persist',provider:'test',model:'test-model'};}});
  const request=assistantService.requestResponse(ids.b,g.id,randomUUID());
  await new Promise(resolve=>setTimeout(resolve,10));
  await chatService.removeMember(ids.a,g.id,ids.b);release();
  await assert.rejects(()=>request,(e:any)=>e.code==='ASSISTANT_GENERATION_FAILED');
  const visible=await chatService.listMessages(ids.a,g.id,undefined,undefined,100);
  assert.equal(visible.some(m=>m.body==='must not persist'),false);
});

dbTest('assistant context is not exported after access has already been revoked',async()=>{
  const g=await chatService.createConversation(ids.a,[ids.b],'group','assistant pre revoke');
  await assistantService.enable(ids.a,g.id,'Helper');
  await chatService.removeMember(ids.a,g.id,ids.b);
  let calls=0;assistantService.setGatewayForTests({describe:()=>({provider:'test',model:'test-model'}),generate:async()=>{calls++;return {text:'no',provider:'test',model:'test-model'};}});
  await assert.rejects(()=>assistantService.requestResponse(ids.b,g.id,randomUUID()),(e:any)=>e.code==='CONVERSATION_NOT_FOUND');
  assert.equal(calls,0);
});

dbTest('expired generation ownership is reclaimed and stale owner cannot finalize',async()=>{
  const { assistantRepository }=await import('../src/modules/assistant/assistant.repository');
  const { assistantGenerations }=await import('../src/db/schema');
  const g=await chatService.createConversation(ids.a,[ids.b],'group','assistant reclaim');await assistantService.enable(ids.a,g.id,'Helper');
  const requestId=randomUUID();const first=await assistantRepository.claimGeneration(g.id,ids.a,requestId,{provider:'test',model:'test-model'});assert.equal(first.kind,'claimed');if(first.kind!=='claimed')return;
  await db.update(assistantGenerations).set({leaseExpiresAt:new Date(Date.now()-1000)}).where(eq(assistantGenerations.id,first.generation.id));
  const second=await assistantRepository.claimGeneration(g.id,ids.a,requestId,{provider:'test',model:'test-model'});assert.equal(second.kind,'claimed');if(second.kind!=='claimed')return;
  assert.notEqual(second.ownerToken,first.ownerToken);
  const stale=await assistantRepository.completeGeneration(g.id,first.generation.id,first.ownerToken,'stale',{provider:'test',model:'test-model',latencyMs:1});assert.equal(stale.kind,'ownership-lost');
  const current=await assistantRepository.completeGeneration(g.id,second.generation.id,second.ownerToken,'current',{provider:'test',model:'test-model',latencyMs:1});assert.equal(current.kind,'completed');
  const rows=await db.select().from(messages).where(eq(messages.clientMessageId,first.generation.id));assert.equal(rows.length,1);assert.equal(rows[0]?.body,'current');
});

dbTest('provider timeout is classified without creating an assistant message',async()=>{
  const { assistantGenerations }=await import('../src/db/schema');
  const g=await chatService.createConversation(ids.a,[ids.b],'group','assistant timeout');await assistantService.enable(ids.a,g.id,'Helper');
  const requestId=randomUUID();assistantService.setGatewayForTests({describe:()=>({provider:'test',model:'slow-model'}),generate:({signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}))},5);
  await assert.rejects(()=>assistantService.requestResponse(ids.a,g.id,requestId),(e:any)=>e.code==='ASSISTANT_GENERATION_FAILED');
  const [generation]=await db.select().from(assistantGenerations).where(eq(assistantGenerations.clientRequestId,requestId));assert.equal(generation?.errorCode,'PROVIDER_TIMEOUT');assert.equal(generation?.provider,'test');assert.equal(generation?.model,'slow-model');
});

dbTest('archiving a conversation while generation runs prevents final assistant persistence',async()=>{
  const g=await chatService.createConversation(ids.a,[],'group','assistant archive');await assistantService.enable(ids.a,g.id,'Helper');
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});assistantService.setGatewayForTests({describe:()=>({provider:'test',model:'test-model'}),generate:async()=>{await gate;return {text:'after archive',provider:'test',model:'test-model'};}});
  const request=assistantService.requestResponse(ids.a,g.id,randomUUID());await new Promise(resolve=>setTimeout(resolve,10));await chatService.leaveConversation(ids.a,g.id);release();
  await assert.rejects(()=>request,(e:any)=>e.code==='CONVERSATION_NOT_FOUND');
  const rows=await db.select().from(messages).where(and(eq(messages.conversationId,g.id),eq(messages.body,'after archive')));assert.equal(rows.length,0);
});

dbTest('assistant success records one attempt usage row and reconnect catch-up sees the final message',async()=>{
  const { assistantGenerationAttempts }=await import('../src/db/schema');
  const g=await chatService.createConversation(ids.a,[ids.b],'group','assistant usage');await assistantService.enable(ids.a,g.id,'Helper');
  const marker=await chatService.sendMessage(ids.a,g.id,randomUUID(),'before assistant usage');
  assistantService.setGatewayForTests({describe:()=>({provider:'test',model:'usage-model'}),generate:async()=>({text:'usage result',provider:'test',model:'usage-model',inputTokens:7,outputTokens:3,totalTokens:10})});
  const result=await assistantService.requestResponse(ids.a,g.id,randomUUID());assert.ok(result.message);
  const attempts=await db.select().from(assistantGenerationAttempts).where(eq(assistantGenerationAttempts.generationId,result.generation.id));assert.equal(attempts.length,1);assert.equal(attempts[0]?.totalTokens,10);assert.equal(attempts[0]?.status,'succeeded');
  const caughtUp=await chatService.listMessages(ids.a,g.id,undefined,marker.message.sequence,100);assert.equal(caughtUp.some(message=>message.id===result.message?.id),true);
});

dbTest('assistant final message uses the normal realtime publication path',async()=>{
  const { realtimePublisher }=await import('../src/modules/chat/realtime.publisher');
  const g=await chatService.createConversation(ids.a,[ids.b],'group','assistant realtime');await assistantService.enable(ids.a,g.id,'Helper');
  assistantService.setGatewayForTests({describe:()=>({provider:'test',model:'test-model'}),generate:async()=>({text:'realtime assistant',provider:'test',model:'test-model'})});
  const events:any[]=[];const unsubscribe=realtimePublisher.subscribe(ids.b,event=>events.push(event));
  try{const result=await assistantService.requestResponse(ids.a,g.id,randomUUID());assert.ok(result.message);assert.equal(events.some(event=>event.type==='message.created'&&event.payload.id===result.message?.id),true);}finally{unsubscribe();}
});

dbTest('assistant state restores the latest durable generation for the requester',async()=>{
  const g=await chatService.createConversation(ids.a,[ids.b],'group','assistant state');const assistant=await assistantService.enable(ids.a,g.id,'Helper');
  assistantService.setGatewayForTests({describe:()=>({provider:'test',model:'test-model'}),generate:async()=>({text:'state result',provider:'test',model:'test-model'})});
  const requestId=randomUUID();const result=await assistantService.requestResponse(ids.b,g.id,requestId);const state=await assistantService.getState(ids.b,g.id);
  assert.equal(state.assistant?.id,assistant.id);assert.equal(state.generation?.id,result.generation.id);assert.equal(state.generation?.status,'completed');
});

dbTest('provider invocation revalidates membership after a generation claim',async()=>{
  const { assistantRepository }=await import('../src/modules/assistant/assistant.repository');
  const g=await chatService.createConversation(ids.a,[ids.b],'group','assistant prepare auth');await assistantService.enable(ids.a,g.id,'Helper');
  const claimed=await assistantRepository.claimGeneration(g.id,ids.b,randomUUID(),{provider:'test',model:'test-model'});assert.equal(claimed.kind,'claimed');if(claimed.kind!=='claimed')return;
  await chatService.removeMember(ids.a,g.id,ids.b);
  const prepared=await assistantRepository.prepareProviderInvocation(g.id,claimed.generation.id,claimed.ownerToken);assert.equal(prepared.kind,'authorization-revoked');
});
