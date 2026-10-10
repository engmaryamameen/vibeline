'use client';

import { useEffect, useState } from 'react';

export const useObjectUrl = (source: Blob | null | undefined) => {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!source) {
      setUrl(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(source);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(undefined);
    };
  }, [source]);

  return url;
};
