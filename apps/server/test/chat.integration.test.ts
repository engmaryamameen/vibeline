import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { eq, inArray } from 'drizzle-orm';
import { db, pool } from '../src/db/client';
import { conversationMembers, conversations, messages, users } from '../src/db/schema';
import { chatService } from '../src/modules/chat/chat.service';
import { sessionService } from '../src/modules/auth/session.service';

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
  const first=await chatService.deleteMessage(ids.a,conversationId,sent.message.id);
  const retry=await chatService.deleteMessage(ids.a,conversationId,sent.message.id);
  assert.equal(first.id,retry.id);assert.ok(retry.deletedAt);assert.equal(retry.body,'');
  await assert.rejects(()=>chatService.editMessage(ids.a,conversationId,sent.message.id,'resurrect'),(e:any)=>e.code==='MESSAGE_DELETED');
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
