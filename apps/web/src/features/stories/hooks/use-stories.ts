'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Story, StoryGroup } from '@vibeline/contracts';
import { useAuthorizedRequest } from '@/src/features/chat/hooks/use-authorized-request';
import { storyApi } from '../api/story-api';

const FEED_REFRESH_MS = 60_000;

export type StoriesController = {
  groups: StoryGroup[];
  loading: boolean;
  error: string;
  openAuthorId: string | undefined;
  composerOpen: boolean;
  stories: Story[];
  storiesLoading: boolean;
  storiesError: string;
  publishing: boolean;
  reload: () => Promise<void>;
  openAuthor: (authorUserId: string) => void;
  close: () => void;
  openComposer: () => void;
  closeComposer: () => void;
  publish: (file: File, upload: (file: File) => Promise<{ asset: { id: string } }>, caption?: string) => Promise<void>;
  markViewed: (storyId: string) => void;
  remove: (storyId: string) => Promise<void>;
  dismissError: () => void;
};

export function useStories(): StoriesController {
  const request = useAuthorizedRequest();
  const api = useMemo(() => storyApi(request), [request]);

  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAuthorId, setOpenAuthorId] = useState<string>();
  const [composerOpen, setComposerOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storiesError, setStoriesError] = useState('');
  const [publishing, setPublishing] = useState(false);

  const reload = useCallback(async () => {
    try {
      const result = await api.feed();
      setGroups(result.groups);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Stories could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), FEED_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  useEffect(() => {
    if (!openAuthorId) {
      setStories([]);
      setStoriesError('');
      return;
    }
    let cancelled = false;
    setStoriesLoading(true);
    setStoriesError('');
    void api
      .byAuthor(openAuthorId)
      .then((result) => {
        if (!cancelled) setStories(result.stories);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setStoriesError(caught instanceof Error ? caught.message : 'These stories could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setStoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, openAuthorId]);

  const markViewed = useCallback(
    (storyId: string) => {
      setStories((current) => current.map((story) => (story.id === storyId ? { ...story, seen: true } : story)));
      void api
        .markViewed(storyId)
        .then(({ story }) => setStories((current) => current.map((item) => (item.id === story.id ? story : item))))
        .catch(() => undefined);
    },
    [api]
  );

  const publish = useCallback(
    async (file: File, upload: (file: File) => Promise<{ asset: { id: string } }>, caption?: string) => {
      setPublishing(true);
      try {
        const uploaded = await upload(file);
        await api.create(uploaded.asset.id, caption);
        await reload();
      } finally {
        setPublishing(false);
      }
    },
    [api, reload]
  );

  const remove = useCallback(
    async (storyId: string) => {
      await api.remove(storyId);
      setStories((current) => current.filter((story) => story.id !== storyId));
      await reload();
    },
    [api, reload]
  );

  return {
    groups,
    loading,
    error,
    openAuthorId,
    composerOpen,
    stories,
    storiesLoading,
    storiesError,
    publishing,
    reload,
    openAuthor: setOpenAuthorId,
    close: () => setOpenAuthorId(undefined),
    openComposer: () => setComposerOpen(true),
    closeComposer: () => setComposerOpen(false),
    publish,
    markViewed,
    remove,
    dismissError: () => setError('')
  };
}
