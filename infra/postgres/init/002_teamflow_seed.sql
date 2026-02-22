BEGIN;

-- Permission catalog
INSERT INTO rbac_permissions (permission_key, description) VALUES
  ('org.manage', 'Manage organization settings and billing'),
  ('member.manage', 'Invite, suspend, and manage memberships'),
  ('channel.manage', 'Create, archive, and manage channels'),
  ('message.write', 'Post messages'),
  ('message.moderate', 'Delete or moderate messages'),
  ('task.manage', 'Create and manage tasks'),
  ('ai.summary.create', 'Request AI thread summaries')
ON CONFLICT (permission_key) DO NOTHING;

-- Organization
INSERT INTO organizations (id, name, slug, plan_tier, settings)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'TeamFlow Demo Org',
  'teamflow-demo',
  'pro',
  '{"timezone":"UTC","features":{"ai_summaries":true,"tasks":true}}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Users
INSERT INTO users (id, email, display_name, time_zone, locale) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'alice@teamflow.dev', 'Alice Admin', 'UTC', 'en-US'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'bob@teamflow.dev', 'Bob Builder', 'UTC', 'en-US'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'cara@teamflow.dev', 'Cara Collaborator', 'UTC', 'en-US')
ON CONFLICT (id) DO NOTHING;

-- Roles
INSERT INTO organization_roles (
  id, organization_id, role_key, role_name, description, is_system_role, priority_rank
) VALUES
  (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    'owner',
    'Owner',
    'Full administrative access',
    true,
    1
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'member',
    'Member',
    'Standard collaboration access',
    true,
    100
  )
ON CONFLICT (id) DO NOTHING;

-- Role permissions
INSERT INTO organization_role_permissions (id, organization_id, role_id, permission_key) VALUES
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'org.manage'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'member.manage'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'channel.manage'),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'message.write'),
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'message.moderate'),
  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'task.manage'),
  ('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'ai.summary.create'),
  ('33333333-3333-3333-3333-333333333308', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'message.write'),
  ('33333333-3333-3333-3333-333333333309', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'task.manage'),
  ('33333333-3333-3333-3333-333333333310', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'ai.summary.create')
ON CONFLICT (organization_id, role_id, permission_key) DO NOTHING;

-- Memberships
INSERT INTO organization_memberships (
  id, organization_id, user_id, role_id, status, joined_at
) VALUES
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222221', 'active', NOW()),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222222', 'active', NOW()),
  ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', '22222222-2222-2222-2222-222222222222', 'active', NOW())
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Channels
INSERT INTO channels (
  id, organization_id, name, channel_type, topic, created_by_user_id
) VALUES
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', 'general', 'public', 'Company-wide announcements and work chat', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', 'engineering', 'private', 'Engineering planning and delivery', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1')
ON CONFLICT (id) DO NOTHING;

-- Channel memberships
INSERT INTO channel_memberships (id, organization_id, channel_id, user_id, is_muted) VALUES
  ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', false),
  ('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', false),
  ('66666666-6666-6666-6666-666666666663', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', false),
  ('66666666-6666-6666-6666-666666666664', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555552', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', false),
  ('66666666-6666-6666-6666-666666666665', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555552', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', false)
ON CONFLICT (organization_id, channel_id, user_id) DO NOTHING;

-- Messages (top-level + reply in thread)
INSERT INTO messages (
  id, organization_id, channel_id, sender_user_id, parent_message_id, thread_root_message_id, message_type, content, metadata
) VALUES
  (
    '77777777-7777-7777-7777-777777777771',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555551',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    NULL,
    NULL,
    'user',
    'We should ship the onboarding checklist this week.',
    '{"mentions":[],"format":"plain"}'::jsonb
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555551',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '77777777-7777-7777-7777-777777777771',
    '77777777-7777-7777-7777-777777777771',
    'user',
    'Agreed. Please create a task and assign it to Cara.',
    '{"mentions":["cccccccc-cccc-cccc-cccc-ccccccccccc3"],"format":"plain"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Task (one-to-one with source message)
INSERT INTO tasks (
  id, organization_id, channel_id, source_message_id, title, description, status, priority,
  creator_user_id, assignee_user_id, due_at
) VALUES
  (
    '88888888-8888-8888-8888-888888888881',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555551',
    '77777777-7777-7777-7777-777777777771',
    'Ship onboarding checklist',
    'Finalize and publish onboarding checklist in #general.',
    'open',
    'high',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    NOW() + INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Notification
INSERT INTO notifications (
  id, organization_id, recipient_user_id, actor_user_id, notification_type,
  title, body, channel_id, message_id, task_id, payload
) VALUES
  (
    '99999999-9999-9999-9999-999999999991',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'task_assigned',
    'You were assigned a task',
    'Ship onboarding checklist',
    '55555555-5555-5555-5555-555555555551',
    '77777777-7777-7777-7777-777777777772',
    '88888888-8888-8888-8888-888888888881',
    '{"task_status":"open","priority":"high"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- AI summary
INSERT INTO ai_thread_summaries (
  id, organization_id, channel_id, thread_root_message_id, summary_kind, status,
  model_provider, model_name, prompt_version, version_no, summary_text, summary_metadata,
  message_count, input_token_count, output_token_count, requested_by_user_id, generated_at
) VALUES
  (
    'aaaaaaaa-9999-9999-9999-999999999999',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555551',
    '77777777-7777-7777-7777-777777777771',
    'thread_summary',
    'completed',
    'openai',
    'gpt-4.1-mini',
    'v1',
    1,
    'Team agreed to ship the onboarding checklist this week and assign follow-up work to Cara.',
    '{"tone":"concise","source":"thread"}'::jsonb,
    2,
    320,
    74,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
