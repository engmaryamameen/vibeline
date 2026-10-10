'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Call } from '@vibeline/contracts';
import { useAuthorizedRequest } from '@/src/features/chat/hooks/use-authorized-request';
import { callApi } from '../api/call-api';

export const useCallHistory = (conversationId: string | undefined, enabled: boolean) => {
  const request = useAuthorizedRequest();
  const api = useMemo(() => callApi(request), [request]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.history(conversationId, 20);
      setCalls(result.calls);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Call history could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [api, conversationId]);

  useEffect(() => {
    if (!enabled || !conversationId) return;
    void reload();
  }, [enabled, conversationId, reload]);

  return { calls, loading, error, reload };
};
