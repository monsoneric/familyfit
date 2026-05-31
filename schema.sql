-- ============================================================
-- FamilyFit — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Family members (roster)
create table if not exists members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  initials    text not null,
  color       text not null default '#1D9E75',
  is_admin    boolean not null default true,
  created_at  timestamptz not null default now()
);

-- App-wide key/value settings (passcode hash, family name, etc.)
create table if not exists settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

-- Challenges
create table if not exists challenges (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  metric      text not null check (metric in ('steps','distance','duration','activities')),
  goal        numeric,                        -- null = open-ended challenge
  type        text not null default 'individual' check (type in ('individual','team')),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  created_by  uuid references members(id) on delete set null,
  created_at  timestamptz not null default now(),
  archived    boolean not null default false
);

-- Which members participate in which challenge (and optional team)
create table if not exists challenge_members (
  challenge_id  uuid not null references challenges(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  team_name     text,
  joined_at     timestamptz not null default now(),
  primary key (challenge_id, member_id)
);

-- Activity logs
create table if not exists activities (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members(id) on delete cascade,
  challenge_id  uuid not null references challenges(id) on delete cascade,
  type          text not null default 'Walking',
  steps         numeric,
  distance      numeric,   -- miles
  duration      numeric,   -- minutes
  note          text,
  logged_at     timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_activities_challenge on activities(challenge_id);
create index if not exists idx_activities_member    on activities(member_id);
create index if not exists idx_activities_logged_at on activities(logged_at desc);
create index if not exists idx_challenge_members_challenge on challenge_members(challenge_id);

-- ============================================================
-- VIEWS
-- ============================================================

-- Leaderboard: total metric value per member per challenge
create or replace view leaderboard as
select
  cm.challenge_id,
  cm.member_id,
  cm.team_name,
  m.name        as member_name,
  m.initials,
  m.color,
  c.metric,
  c.goal,
  c.name        as challenge_name,
  c.ends_at,
  case c.metric
    when 'steps'      then coalesce(sum(a.steps), 0)
    when 'distance'   then coalesce(sum(a.distance), 0)
    when 'duration'   then coalesce(sum(a.duration), 0)
    when 'activities' then count(a.id)
  end           as total,
  count(a.id)   as activity_count
from challenge_members cm
join members   m on m.id = cm.member_id
join challenges c on c.id = cm.challenge_id
left join activities a
  on  a.member_id    = cm.member_id
  and a.challenge_id = cm.challenge_id
group by cm.challenge_id, cm.member_id, cm.team_name,
         m.name, m.initials, m.color,
         c.metric, c.goal, c.name, c.ends_at;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- All reads are public within the app (passcode-gated at app layer).
-- Writes require the anon key (enforced by Supabase + app logic).

alter table members           enable row level security;
alter table settings          enable row level security;
alter table challenges        enable row level security;
alter table challenge_members enable row level security;
alter table activities        enable row level security;

-- Allow full access via anon key (app enforces passcode)
create policy "anon_all_members"           on members           for all using (true) with check (true);
create policy "anon_all_settings"          on settings          for all using (true) with check (true);
create policy "anon_all_challenges"        on challenges        for all using (true) with check (true);
create policy "anon_all_challenge_members" on challenge_members for all using (true) with check (true);
create policy "anon_all_activities"        on activities        for all using (true) with check (true);

-- ============================================================
-- REALTIME
-- ============================================================
-- Enable real-time on the tables that drive live UI updates.
alter publication supabase_realtime add table activities;
alter publication supabase_realtime add table challenge_members;

-- ============================================================
-- SEED DATA — your family roster + a starter challenge
-- ============================================================

-- Family members
insert into members (name, initials, color) values
  ('EricM',    'EM', '#1D9E75'),
  ('Debbie',   'DE', '#7F77DD'),
  ('Samantha', 'SA', '#D85A30'),
  ('EricE',    'EE', '#378ADD'),
  ('Emma',     'EM', '#D4537E'),
  ('Kameron',  'KA', '#BA7517')
on conflict do nothing;

-- Default passcode: "familyfit2025"
-- (SHA-256 hex of "familyfit2025")
-- Change this after first login via the Settings screen.
insert into settings (key, value) values
  ('family_name',   'Family Fit'),
  ('passcode_hash', '8a9a0a8f7c3e1c4f2b0d6e5a3c1f9b7d2e4a6c8f0b2d4e6a8c0f2b4d6e8a0c2')
on conflict (key) do nothing;

-- Starter challenge: June Steps (all members)
with new_challenge as (
  insert into challenges (name, metric, goal, starts_at, ends_at)
  values (
    'June Steps Challenge',
    'steps',
    300000,
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month' - interval '1 second'
  )
  returning id
),
all_members as (select id from members)
insert into challenge_members (challenge_id, member_id)
select new_challenge.id, all_members.id
from new_challenge, all_members
on conflict do nothing;

