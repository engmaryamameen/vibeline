'use client';

import { useMemo } from 'react';
import { useAuthorizedRequest } from '@/src/lib/authorized-request';
import { mediaApi, type MediaApi } from '../api/media-api';

export const useMediaApi = (): MediaApi => {
  const request = useAuthorizedRequest();
  return useMemo(() => mediaApi(request), [request]);
};
