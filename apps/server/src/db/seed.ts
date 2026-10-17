import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
const __dirname=dirname(fileURLToPath(import.meta.url));config({path:resolve(__dirname,'../../../../.env')});
import { eq } from 'drizzle-orm';
import { db } from './client';
import { passwordCredentials, users } from './schema';
import { hashPassword } from '@/utils/hash';
const ADMIN_PASSWORD=process.env.ADMIN_SEED_PASSWORD??'Admin123!';
async function seed(){let admin=await db.query.users.findFirst({where:eq(users.email,'admin@vibeline.dev')});if(!admin){const [created]=await db.insert(users).values({id:'u_admin',email:'admin@vibeline.dev',displayName:'Workspace Admin',role:'admin',emailVerified:true}).returning();admin=created;console.log('Created admin user (admin@vibeline.dev)');}const credential=await db.query.passwordCredentials.findFirst({where:eq(passwordCredentials.userId,admin!.id)});if(!credential)await db.insert(passwordCredentials).values({userId:admin!.id,passwordHash:await hashPassword(ADMIN_PASSWORD)});}
seed().then(()=>{console.log('Seed complete.');process.exit(0);}).catch(err=>{console.error('Seed failed:',err);process.exit(1);});
