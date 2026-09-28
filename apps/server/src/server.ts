import 'dotenv/config';
import { env } from '@/config/env';
import { closeDatabase } from '@/db/client';
import { buildApp } from '@/app';
const start=async()=>{const app=buildApp();let closing=false;const shutdown=async(signal:string)=>{if(closing)return;closing=true;app.log.info({signal},'graceful shutdown started');const force=setTimeout(()=>process.exit(1),10000);force.unref();try{await app.close();await closeDatabase();clearTimeout(force);process.exit(0);}catch(error){app.log.error({error},'graceful shutdown failed');process.exit(1);}};process.on('SIGTERM',()=>void shutdown('SIGTERM'));process.on('SIGINT',()=>void shutdown('SIGINT'));try{await app.listen({port:env.PORT,host:'0.0.0.0'});app.log.info({port:env.PORT},'HTTP server listening');}catch(error){app.log.error(error);process.exit(1);}};void start();
