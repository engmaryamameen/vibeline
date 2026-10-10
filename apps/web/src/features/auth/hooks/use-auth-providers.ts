'use client';

import { useEffect, useState } from 'react';
import { authProvidersResponseSchema, type AuthProviders } from '@vibeline/contracts';
import { apiClient } from '@/src/lib/api-client';

const NONE: AuthProviders = { google: false };

let cached: AuthProviders | undefined;
let inFlight: Promise<AuthProviders> | undefined;

const load = () => {
  if (cached) return Promise.resolve(cached);
  inFlight ??= apiClient('/auth/providers', { responseSchema: authProvidersResponseSchema })
    .then((result) => {
      cached = result.providers;
      return cached;
    })
    .catch(() => NONE)
    .finally(() => {
      inFlight = undefined;
    });
  return inFlight;
};

export const useAuthProviders = () => {
  const [providers, setProviders] = useState<AuthProviders>(cached ?? NONE);

  useEffect(() => {
    let active = true;
    void load().then((result) => {
      if (active) setProviders(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return providers;
};
