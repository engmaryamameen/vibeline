# Stories

A story is an existing media asset plus an expiry. Stories reuse the upload and
editor pipeline in `features/media` rather than introducing a second media path,
and `stories.media_asset_id` is unique so one asset backs at most one story.

## Expiry and visibility

Both are enforced in SQL on every read, not in frontend filtering:

```sql
-- live
deleted_at IS NULL AND expires_at > now()

-- visible to the viewer
author_user_id = :viewer OR EXISTS (
  SELECT 1 FROM connection_requests cr
  WHERE cr.status = 'accepted'
    AND ((cr.requester_id = :viewer AND cr.addressee_id = author_user_id)
      OR (cr.addressee_id = :viewer AND cr.requester_id = author_user_id))
)
```

The same predicate guards `GET /v1/media/assets/:id/content`, so an expired story's
media is unreachable by direct URL even to someone who saw it earlier. Expiry is
time-based rather than swept, so there is no window in which an expired story is
still readable.

## Endpoints

| Route | Behaviour |
| --- | --- |
| `GET /v1/stories/feed` | Live visible stories grouped by author, with seen and unseen counts; the viewer's own group sorts first |
| `POST /v1/stories` | Create from an owned asset; expiry is `now() + 24h` |
| `GET /v1/stories/authors/:authorUserId` | One author's live stories in chronological order |
| `POST /v1/stories/:storyId/views` | Record a view; the author viewing their own story does not count |
| `GET /v1/stories/:storyId/viewers` | Author only |
| `DELETE /v1/stories/:storyId` | Author only, soft delete |

## Viewer

`useStoryPlayback` drives progress from `requestAnimationFrame` against the active
story's duration: 5s for images, the real media duration for video. It pauses on
pointer-down, on tab blur, and while the viewers sheet is open, and it only starts
once the media reports itself loaded, so a slow image does not lose its turn.

Left and right thirds of the screen navigate; arrow keys and space work on desktop.
Views are recorded once per story per session, tracked in a ref so re-renders do
not re-post.

## Deliberate scope

Stories are reachable from the rail above the conversation list on every breakpoint
rather than from a separate Timeline tab, because the existing bottom navigation is
mobile-only and adding a desktop-wide tab bar would change the current layout.
Replies to stories are not implemented.
