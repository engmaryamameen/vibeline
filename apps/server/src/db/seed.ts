import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../../.env') });

import { hash } from 'bcryptjs';

import { eq } from 'drizzle-orm';

import { db } from './client';
import { users } from './schema';

const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD ?? 'Demo123!';
const DEMO_EMAIL = 'demo@vibeline.dev';

async function seed() {
  const demoUserExists = await db.query.users.findFirst({
    where: eq(users.email, DEMO_EMAIL)
  });

  if (!demoUserExists) {
    const passwordHash = await hash(DEMO_PASSWORD, 12);
    await db.insert(users).values({
      id: 'u_demo',
      email: DEMO_EMAIL,
      displayName: 'Demo User',
      role: 'user',
      emailVerified: true,
      passwordHash
    });
    console.log(`Created demo user (${DEMO_EMAIL})`);
  } else {
    console.log('Demo user already exists');
  }
}

seed()
  .then(() => {
    console.log('Seed complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
