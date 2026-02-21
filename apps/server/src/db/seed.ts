import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../../.env') });

import { hash } from 'bcryptjs';

import { eq } from 'drizzle-orm';

import { db } from './client';
import { users } from './schema';

const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? 'Admin123!';

async function seed() {
  const adminExists = await db.query.users.findFirst({
    where: eq(users.email, 'admin@vibeline.dev')
  });

  if (!adminExists) {
    const passwordHash = await hash(ADMIN_PASSWORD, 12);
    await db.insert(users).values({
      id: 'u_admin',
      email: 'admin@vibeline.dev',
      displayName: 'Workspace Admin',
      role: 'admin',
      emailVerified: true,
      passwordHash
    });
    console.log('Created admin user (admin@vibeline.dev)');
  } else {
    console.log('Admin user already exists');
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
