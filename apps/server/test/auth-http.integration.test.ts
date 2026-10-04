import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app';
import { db, pool } from '../src/db/client';
import { externalIdentities, passwordCredentials, sessions, users } from '../src/db/schema';
import { authIdentityRepository } from '../src/repositories/auth-identity.repository';
import { hashPassword } from '../src/utils/hash';
import { authSessionResponseSchema } from '@vibeline/contracts';

const enabled=process.env.RUN_DB_TESTS==='1';
const dbTest=(name:string,fn:()=>Promise<void>)=>test(name,{skip:!enabled},fn);
const userId=randomUUID(); const email=`auth-http-${userId}@example.com`; const password='Correct-Horse-42!';
const app=buildApp();
before(async()=>{if(!enabled)return;await app.ready();await db.insert(users).values({id:userId,email,displayName:'Auth Test',emailVerified:true});await db.insert(passwordCredentials).values({userId,passwordHash:await hashPassword(password)});});
after(async()=>{if(!enabled)return;await db.delete(users).where(eq(users.id,userId));await app.close();await pool.end();});

dbTest('login sets HttpOnly refresh cookie and does not expose refresh token in JSON',async()=>{const response=await app.inject({method:'POST',url:'/v1/auth/login',payload:{email,password}});assert.equal(response.statusCode,200);const cookie=response.headers['set-cookie'];assert.match(String(cookie),/vibeline_rt=/);assert.match(String(cookie),/HttpOnly/);assert.match(String(cookie),/SameSite=Lax/);assert.equal('refreshToken' in response.json().tokens,false);});

dbTest('cookie refresh accepts a bodyless request',async()=>{const login=await app.inject({method:'POST',url:'/v1/auth/login',payload:{email,password}});const cookie=String(login.headers['set-cookie']).split(';')[0]!;const refreshed=await app.inject({method:'POST',url:'/v1/auth/refresh',headers:{cookie}});assert.equal(refreshed.statusCode,200);assert.ok(refreshed.headers['set-cookie']);});

dbTest('Fastify request parsing errors remain 4xx contracts',async()=>{const response=await app.inject({method:'POST',url:'/v1/auth/login',headers:{'content-type':'application/json'},payload:'{'});assert.equal(response.statusCode,400);assert.equal(response.json().code,'BAD_REQUEST');assert.deepEqual(Object.keys(response.json()).sort(),['code','message']);});

dbTest('refresh rotates cookie and reuse revokes active sessions',async()=>{const login=await app.inject({method:'POST',url:'/v1/auth/login',payload:{email,password}});const first=String(login.headers['set-cookie']).split(';')[0]!;const refreshed=await app.inject({method:'POST',url:'/v1/auth/refresh',headers:{cookie:first},payload:{}});assert.equal(refreshed.statusCode,200);const second=String(refreshed.headers['set-cookie']).split(';')[0]!;assert.notEqual(second,first);const reuse=await app.inject({method:'POST',url:'/v1/auth/refresh',headers:{cookie:first},payload:{}});assert.equal(reuse.statusCode,401);const afterReuse=await app.inject({method:'POST',url:'/v1/auth/refresh',headers:{cookie:second},payload:{}});assert.equal(afterReuse.statusCode,401);});

dbTest('OAuth account creation is keyed by provider subject and email conflicts require linking',async()=>{const oauthEmail=`oauth-${randomUUID()}@example.com`;const subject=`subject-${randomUUID()}`;const results=await Promise.all(Array.from({length:4},()=>authIdentityRepository.createOAuthAccount({provider:'google',providerSubject:subject,email:oauthEmail,emailVerified:true,displayName:'OAuth',avatarUrl:null}).catch((error:any)=>({kind:error.code==='23505'?'unique-race':'error'} as const))));const identities=await db.select().from(externalIdentities).where(eq(externalIdentities.providerSubject,subject));assert.equal(identities.length,1);const createdUser=await db.query.users.findFirst({where:eq(users.email,oauthEmail)});assert.ok(createdUser);const conflict=await authIdentityRepository.createOAuthAccount({provider:'google',providerSubject:`other-${randomUUID()}`,email:oauthEmail,emailVerified:true,displayName:'Other',avatarUrl:null});assert.equal(conflict.kind,'email-conflict');await db.delete(users).where(eq(users.id,createdUser.id));});

dbTest('expected HTTP failures expose stable error codes without internal details',async()=>{
  const invalid=await app.inject({method:'POST',url:'/v1/auth/login',payload:{email,password:'definitely-wrong'}});
  assert.equal(invalid.statusCode,401);
  assert.deepEqual(Object.keys(invalid.json()).sort(),['code','message']);
  assert.equal(invalid.json().code,'INVALID_CREDENTIALS');
});

dbTest('chat route parameters are runtime validated at the HTTP boundary',async()=>{
  const login=await app.inject({method:'POST',url:'/v1/auth/login',payload:{email,password}});
  const accessToken=authSessionResponseSchema.parse(login.json()).tokens.accessToken;
  const response=await app.inject({method:'GET',url:'/v1/chat/conversations/not-a-uuid',headers:{authorization:`Bearer ${accessToken}`}});
  assert.equal(response.statusCode,400);
  assert.equal(response.json().code,'VALIDATION_ERROR');
});
