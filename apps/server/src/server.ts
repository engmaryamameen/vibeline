import 'dotenv/config';

import { env } from '@/config/env';
import { buildApp } from '@/app';

const start = async () => {
  const app = buildApp();

  try {
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0'
    });

    app.log.info(`HTTP listening on :${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
