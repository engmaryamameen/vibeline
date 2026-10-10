import { createHmac } from 'node:crypto';
import type { IceServer } from '@vibeline/contracts';
import { env } from '@/config/env';

const splitUrls = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

export const iceService = {
  ttlSeconds: () => env.CALL_TURN_TTL_SECONDS,

  forUser(userId: string): IceServer[] {
    const servers: IceServer[] = [];
    const stunUrls = splitUrls(env.CALL_STUN_URLS);
    if (stunUrls.length) servers.push({ urls: stunUrls });

    const turnUrls = splitUrls(env.CALL_TURN_URLS);
    if (turnUrls.length && env.CALL_TURN_SECRET) {
      const expiry = Math.floor(Date.now() / 1000) + env.CALL_TURN_TTL_SECONDS;
      const username = `${expiry}:${userId}`;
      const credential = createHmac('sha1', env.CALL_TURN_SECRET).update(username).digest('base64');
      servers.push({ urls: turnUrls, username, credential });
    } else if (turnUrls.length && env.CALL_TURN_USERNAME && env.CALL_TURN_PASSWORD) {
      servers.push({ urls: turnUrls, username: env.CALL_TURN_USERNAME, credential: env.CALL_TURN_PASSWORD });
    }

    return servers;
  }
};
