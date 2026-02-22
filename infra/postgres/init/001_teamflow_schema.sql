BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE membership_status AS ENUM ('active', 'invited', 'suspended', 'left');
CREATE TYPE channel_type AS ENUM ('public', 'private');
CREATE TYPE message_type AS ENUM ('user', 'system', 'bot');
CREATE TYPE task_status AS ENUM ('open', 'in_progress', 'blocked', 'done', 'canceled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE notification_type AS ENUM (
  'mention',
  'thread_reply',
  'task_assigned',
  'task_updated',
  'channel_invite',
  'ai_summary_ready',
  'system'
);
CREATE TYPE ai_summary_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE ai_summary_kind AS ENUM ('thread_summary', 'action_items', 'decisions');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION set_row_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- TENANTS / IDENTITY / RBAC
-- ============================================================================

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  plan_tier text NOT NULL DEFAULT 'free',
  is_active boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT organizations_name_not_blank CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT organizations_slug_not_blank CHECK (char_length(btrim(slug)) > 0)
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text NOT NULL,
  avatar_url text NULL,
  time_zone text NOT NULL DEFAULT 'UTC',
  locale text NOT NULL DEFAULT 'en-US',
  last_seen_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT users_email_not_blank CHECK (char_length(btrim(email)) > 0),
  CONSTRAINT users_display_name_not_blank CHECK (char_length(btrim(display_name)) > 0)
);

CREATE TABLE rbac_permissions (
  permission_key text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT rbac_permissions_key_not_blank CHECK (char_length(btrim(permission_key)) > 0)
);

CREATE TABLE organization_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  role_key text NOT NULL,
  role_name text NOT NULL,
  description text NULL,
  is_system_role boolean NOT NULL DEFAULT false,
  priority_rank smallint NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT organization_roles_priority_rank_positive CHECK (priority_rank > 0),
  CONSTRAINT organization_roles_role_key_not_blank CHECK (char_length(btrim(role_key)) > 0),
  CONSTRAINT organization_roles_role_name_not_blank CHECK (char_length(btrim(role_name)) > 0),
  CONSTRAINT fk_organization_roles_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT uq_organization_roles_org_id_id UNIQUE (organization_id, id)
);

CREATE TABLE organization_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  role_id uuid NOT NULL,
  permission_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT fk_org_role_permissions_role
    FOREIGN KEY (organization_id, role_id)
    REFERENCES organization_roles (organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_org_role_permissions_permission
    FOREIGN KEY (permission_key) REFERENCES rbac_permissions(permission_key) ON DELETE RESTRICT,
  CONSTRAINT uq_org_role_permissions UNIQUE (organization_id, role_id, permission_key),
  CONSTRAINT uq_org_role_permissions_org_id_id UNIQUE (organization_id, id)
);

CREATE TABLE organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  status membership_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NULL,
  invited_by_user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT fk_organization_memberships_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_organization_memberships_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_organization_memberships_role
    FOREIGN KEY (organization_id, role_id)
    REFERENCES organization_roles (organization_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_organization_memberships_invited_by_user
    FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT uq_organization_memberships_org_user UNIQUE (organization_id, user_id),
  CONSTRAINT uq_organization_memberships_org_id_id UNIQUE (organization_id, id)
);

-- ============================================================================
-- CHANNELS / MESSAGES / THREADS
-- ============================================================================

CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  channel_type channel_type NOT NULL,
  topic text NULL,
  created_by_user_id uuid NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT channels_name_not_blank CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT fk_channels_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_channels_created_by_membership
    FOREIGN KEY (organization_id, created_by_user_id)
    REFERENCES organization_memberships (organization_id, user_id)
    ON DELETE RESTRICT,
  CONSTRAINT uq_channels_org_id_id UNIQUE (organization_id, id)
);

CREATE TABLE channel_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  channel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  is_muted boolean NOT NULL DEFAULT false,
  last_read_message_id uuid NULL,
  last_read_at timestamptz NULL,
  joined_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT fk_channel_memberships_channel
    FOREIGN KEY (organization_id, channel_id)
    REFERENCES channels (organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_channel_memberships_membership
    FOREIGN KEY (organization_id, user_id)
    REFERENCES organization_memberships (organization_id, user_id)
    ON DELETE RESTRICT,
  CONSTRAINT uq_channel_memberships_org_channel_user UNIQUE (organization_id, channel_id, user_id),
  CONSTRAINT uq_channel_memberships_org_id_id UNIQUE (organization_id, id)
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  channel_id uuid NOT NULL,
  sender_user_id uuid NOT NULL,
  parent_message_id uuid NULL,
  thread_root_message_id uuid NULL,
  message_type message_type NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_edited boolean NOT NULL DEFAULT false,
  edited_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT messages_content_or_metadata_present CHECK (
    char_length(content) > 0 OR metadata <> '{}'::jsonb
  ),
  CONSTRAINT messages_thread_consistency CHECK (
    (parent_message_id IS NULL AND thread_root_message_id IS NULL)
    OR (thread_root_message_id IS NOT NULL)
  ),
  CONSTRAINT messages_parent_not_self CHECK (
    parent_message_id IS NULL OR parent_message_id <> id
  ),
  CONSTRAINT messages_thread_root_not_self CHECK (
    thread_root_message_id IS NULL OR thread_root_message_id <> id
  ),
  CONSTRAINT fk_messages_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_channel
    FOREIGN KEY (organization_id, channel_id)
    REFERENCES channels (organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender_membership
    FOREIGN KEY (organization_id, sender_user_id)
    REFERENCES organization_memberships (organization_id, user_id)
    ON DELETE RESTRICT,
  CONSTRAINT uq_messages_org_id_id UNIQUE (organization_id, id),
  CONSTRAINT uq_messages_org_channel_id_id UNIQUE (organization_id, channel_id, id)
);

ALTER TABLE messages
  ADD CONSTRAINT fk_messages_parent
  FOREIGN KEY (organization_id, channel_id, parent_message_id)
  REFERENCES messages (organization_id, channel_id, id)
  ON DELETE SET NULL;

ALTER TABLE messages
  ADD CONSTRAINT fk_messages_thread_root
  FOREIGN KEY (organization_id, channel_id, thread_root_message_id)
  REFERENCES messages (organization_id, channel_id, id)
  ON DELETE SET NULL;

ALTER TABLE channel_memberships
  ADD CONSTRAINT fk_channel_memberships_last_read_message
  FOREIGN KEY (organization_id, channel_id, last_read_message_id)
  REFERENCES messages (organization_id, channel_id, id)
  ON DELETE SET NULL;

-- ============================================================================
-- TASKS / NOTIFICATIONS / AI SUMMARIES
-- ============================================================================

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  channel_id uuid NOT NULL,
  source_message_id uuid NOT NULL,
  title text NOT NULL,
  description text NULL,
  status task_status NOT NULL DEFAULT 'open',
  priority task_priority NOT NULL DEFAULT 'medium',
  creator_user_id uuid NOT NULL,
  assignee_user_id uuid NULL,
  due_at timestamptz NULL,
  completed_at timestamptz NULL,
  completed_by_user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT tasks_title_not_blank CHECK (char_length(btrim(title)) > 0),
  CONSTRAINT tasks_completed_at_requires_done CHECK (
    completed_at IS NULL OR status = 'done'
  ),
  CONSTRAINT tasks_completed_by_requires_completed_at CHECK (
    completed_by_user_id IS NULL OR completed_at IS NOT NULL
  ),
  CONSTRAINT fk_tasks_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_channel
    FOREIGN KEY (organization_id, channel_id)
    REFERENCES channels (organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_tasks_source_message
    FOREIGN KEY (organization_id, channel_id, source_message_id)
    REFERENCES messages (organization_id, channel_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_tasks_creator_membership
    FOREIGN KEY (organization_id, creator_user_id)
    REFERENCES organization_memberships (organization_id, user_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_tasks_assignee_membership
    FOREIGN KEY (organization_id, assignee_user_id)
    REFERENCES organization_memberships (organization_id, user_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_tasks_completed_by_membership
    FOREIGN KEY (organization_id, completed_by_user_id)
    REFERENCES organization_memberships (organization_id, user_id)
    ON DELETE RESTRICT,
  CONSTRAINT uq_tasks_org_source_message UNIQUE (organization_id, source_message_id),
  CONSTRAINT uq_tasks_org_id_id UNIQUE (organization_id, id)
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  recipient_user_id uuid NOT NULL,
  actor_user_id uuid NULL,
  notification_type notification_type NOT NULL,
  title text NOT NULL,
  body text NULL,
  channel_id uuid NULL,
  message_id uuid NULL,
  task_id uuid NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT notifications_title_not_blank CHECK (char_length(btrim(title)) > 0),
  CONSTRAINT notifications_read_at_consistency CHECK (
    (is_read = false AND read_at IS NULL) OR (is_read = true)
  ),
  CONSTRAINT fk_notifications_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_recipient_membership
    FOREIGN KEY (organization_id, recipient_user_id)
    REFERENCES organization_memberships (organization_id, user_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_notifications_actor_membership
    FOREIGN KEY (organization_id, actor_user_id)
    REFERENCES organization_memberships (organization_id, user_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_notifications_channel
    FOREIGN KEY (organization_id, channel_id)
    REFERENCES channels (organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_notifications_message
    FOREIGN KEY (organization_id, message_id)
    REFERENCES messages (organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT fk_notifications_task
    FOREIGN KEY (organization_id, task_id)
    REFERENCES tasks (organization_id, id)
    ON DELETE SET NULL,
  CONSTRAINT uq_notifications_org_id_id UNIQUE (organization_id, id)
);

CREATE TABLE ai_thread_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  channel_id uuid NOT NULL,
  thread_root_message_id uuid NOT NULL,
  summary_kind ai_summary_kind NOT NULL DEFAULT 'thread_summary',
  status ai_summary_status NOT NULL DEFAULT 'pending',
  model_provider text NOT NULL,
  model_name text NOT NULL,
  prompt_version text NOT NULL DEFAULT 'v1',
  version_no integer NOT NULL DEFAULT 1,
  summary_text text NULL,
  summary_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  message_count integer NOT NULL DEFAULT 0,
  input_token_count integer NULL,
  output_token_count integer NULL,
  requested_by_user_id uuid NULL,
  generated_at timestamptz NULL,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz NULL,
  CONSTRAINT ai_thread_summaries_version_positive CHECK (version_no > 0),
  CONSTRAINT ai_thread_summaries_message_count_non_negative CHECK (message_count >= 0),
  CONSTRAINT ai_thread_summaries_completed_has_text CHECK (
    status <> 'completed' OR summary_text IS NOT NULL
  ),
  CONSTRAINT fk_ai_thread_summaries_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_thread_summaries_channel
    FOREIGN KEY (organization_id, channel_id)
    REFERENCES channels (organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_ai_thread_summaries_thread_root
    FOREIGN KEY (organization_id, channel_id, thread_root_message_id)
    REFERENCES messages (organization_id, channel_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_ai_thread_summaries_requested_by_membership
    FOREIGN KEY (organization_id, requested_by_user_id)
    REFERENCES organization_memberships (organization_id, user_id)
    ON DELETE RESTRICT,
  CONSTRAINT uq_ai_thread_summaries_version UNIQUE (
    organization_id, thread_root_message_id, summary_kind, version_no
  ),
  CONSTRAINT uq_ai_thread_summaries_org_id_id UNIQUE (organization_id, id)
);

-- ============================================================================
-- INDEXES (TENANT-SCOPED / PAGINATION / HOT PATHS)
-- ============================================================================

CREATE UNIQUE INDEX ux_organizations_slug_active
  ON organizations (lower(slug))
  WHERE deleted_at IS NULL;

CREATE INDEX ix_organizations_active_created_at_desc
  ON organizations (is_active, created_at DESC);

CREATE UNIQUE INDEX ux_users_email_active
  ON users (lower(email))
  WHERE deleted_at IS NULL;

CREATE INDEX ix_users_last_seen_at_desc
  ON users (last_seen_at DESC NULLS LAST)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX ux_organization_roles_org_role_key_active
  ON organization_roles (organization_id, lower(role_key))
  WHERE deleted_at IS NULL;

CREATE INDEX ix_organization_roles_org_priority
  ON organization_roles (organization_id, priority_rank ASC, created_at ASC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_org_role_permissions_role
  ON organization_role_permissions (organization_id, role_id)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_organization_memberships_org_status_joined_desc
  ON organization_memberships (organization_id, status, joined_at DESC NULLS LAST, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_organization_memberships_user_org_created_desc
  ON organization_memberships (user_id, organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX ux_channels_org_name_active
  ON channels (organization_id, lower(name))
  WHERE deleted_at IS NULL;

CREATE INDEX ix_channels_org_type_created_desc
  ON channels (organization_id, channel_type, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_channels_org_archived
  ON channels (organization_id, is_archived, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_channel_memberships_org_user_created_desc
  ON channel_memberships (organization_id, user_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_channel_memberships_org_channel_created_desc
  ON channel_memberships (organization_id, channel_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_messages_org_channel_created_desc
  ON messages (organization_id, channel_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_messages_org_thread_created_asc
  ON messages (organization_id, thread_root_message_id, created_at ASC, id ASC)
  WHERE deleted_at IS NULL AND thread_root_message_id IS NOT NULL;

CREATE INDEX ix_messages_org_parent_created_asc
  ON messages (organization_id, parent_message_id, created_at ASC, id ASC)
  WHERE deleted_at IS NULL AND parent_message_id IS NOT NULL;

CREATE INDEX ix_messages_org_sender_created_desc
  ON messages (organization_id, sender_user_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_tasks_org_status_updated_desc
  ON tasks (organization_id, status, updated_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_tasks_org_assignee_status_created_desc
  ON tasks (organization_id, assignee_user_id, status, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_tasks_org_channel_created_desc
  ON tasks (organization_id, channel_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_tasks_org_due_at
  ON tasks (organization_id, due_at ASC NULLS LAST, priority DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_notifications_org_recipient_unread_created_desc
  ON notifications (organization_id, recipient_user_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL AND is_read = false;

CREATE INDEX ix_notifications_org_recipient_created_desc
  ON notifications (organization_id, recipient_user_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_notifications_org_type_created_desc
  ON notifications (organization_id, notification_type, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_ai_thread_summaries_org_thread_kind_created_desc
  ON ai_thread_summaries (organization_id, thread_root_message_id, summary_kind, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX ix_ai_thread_summaries_org_status_created_desc
  ON ai_thread_summaries (organization_id, status, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_organizations_set_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_rbac_permissions_set_updated_at
BEFORE UPDATE ON rbac_permissions
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_organization_roles_set_updated_at
BEFORE UPDATE ON organization_roles
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_organization_role_permissions_set_updated_at
BEFORE UPDATE ON organization_role_permissions
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_organization_memberships_set_updated_at
BEFORE UPDATE ON organization_memberships
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_channels_set_updated_at
BEFORE UPDATE ON channels
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_channel_memberships_set_updated_at
BEFORE UPDATE ON channel_memberships
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_messages_set_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_tasks_set_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_notifications_set_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_ai_thread_summaries_set_updated_at
BEFORE UPDATE ON ai_thread_summaries
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE organizations IS 'Top-level tenant container. All tenant-scoped data belongs to one organization.';
COMMENT ON TABLE users IS 'Global user identity table. Users can belong to multiple organizations via memberships.';
COMMENT ON TABLE rbac_permissions IS 'Global RBAC permission catalog.';
COMMENT ON TABLE organization_roles IS 'Tenant-scoped RBAC roles.';
COMMENT ON TABLE organization_role_permissions IS 'Mapping of tenant roles to permissions.';
COMMENT ON TABLE organization_memberships IS 'Links a user to an organization and assigns a role.';
COMMENT ON TABLE channels IS 'Organization-scoped public/private collaboration channels.';
COMMENT ON TABLE channel_memberships IS 'Many-to-many user-channel membership scoped by organization.';
COMMENT ON TABLE messages IS 'Channel messages and threaded replies using self-references.';
COMMENT ON TABLE tasks IS 'Tasks created from messages (optional one-to-one by source message).';
COMMENT ON TABLE notifications IS 'Tenant-scoped user notifications for app events.';
COMMENT ON TABLE ai_thread_summaries IS 'AI-generated summaries for thread roots with versioning.';

COMMENT ON COLUMN messages.organization_id IS 'Tenant scope key used for isolation and query filtering.';
COMMENT ON COLUMN messages.parent_message_id IS 'Immediate parent reply in thread (NULL for top-level messages).';
COMMENT ON COLUMN messages.thread_root_message_id IS 'Thread root message id for all replies in a thread.';
COMMENT ON COLUMN tasks.source_message_id IS 'Unique source message that originated this task.';
COMMENT ON COLUMN notifications.recipient_user_id IS 'Membership user receiving the notification.';
COMMENT ON COLUMN ai_thread_summaries.thread_root_message_id IS 'Root message of the summarized thread.';

COMMIT;
