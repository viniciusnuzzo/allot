-- Apply after teams.sql and teams-input-limits.sql. Agent credentials cannot approve or pay.
create table allot_private.agent_tokens (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.allot_teams(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table allot_private.agent_drafts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.allot_teams(id) on delete cascade,
  token_id uuid references allot_private.agent_tokens(id) on delete set null,
  base_split_id uuid references public.allot_splits(id),
  payload jsonb not null,
  recipient_ids uuid[] not null,
  created_at timestamptz not null default now()
);
create table allot_private.agent_activity (
  id bigint generated always as identity primary key,
  team_id uuid not null references public.allot_teams(id) on delete cascade,
  token_id uuid references allot_private.agent_tokens(id) on delete set null,
  action text not null check (action in ('credential_created', 'credential_revoked', 'agreement_read',
    'agreement_proposed', 'approval_requested', 'project_proposed')),
  target_id uuid,
  created_at timestamptz not null default now()
);
create index agent_drafts_team on allot_private.agent_drafts(team_id, created_at desc);
create index agent_activity_team on allot_private.agent_activity(team_id, id desc);
alter table allot_private.agent_tokens enable row level security;
alter table allot_private.agent_drafts enable row level security;
alter table allot_private.agent_activity enable row level security;
revoke all on allot_private.agent_tokens, allot_private.agent_drafts, allot_private.agent_activity from public, anon, authenticated;

create function allot_private.agent_token_create(team uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare secret text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams t where t.id = team and t.owner_id = auth.uid()
  ) then raise exception 'Only the team owner can create an agent credential.'; end if;
  perform 1 from public.allot_teams where id = team for update;
  if (select count(*) from allot_private.agent_tokens where team_id = team and expires_at > now()) >= 5
  then raise exception 'Active agent credential limit reached.'; end if;
  secret := encode(extensions.gen_random_bytes(32), 'hex');
  insert into allot_private.agent_tokens(team_id, token_hash, expires_at)
  values (team, encode(extensions.digest(secret, 'sha256'), 'hex'), now() + interval '7 days');
  return secret;
end;
$$;
revoke all on function allot_private.agent_token_create(uuid) from public, anon;
grant execute on function allot_private.agent_token_create(uuid) to authenticated;

create function allot_private.agent_token_revoke(team uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams t where t.id = team and t.owner_id = auth.uid()
  ) then raise exception 'Only the team owner can revoke agent credentials.'; end if;
  delete from allot_private.agent_tokens where team_id = team;
end;
$$;
revoke all on function allot_private.agent_token_revoke(uuid) from public, anon;
grant execute on function allot_private.agent_token_revoke(uuid) to authenticated;

create function allot_private.agent_token_id(secret text, team uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from allot_private.agent_tokens
  where team_id = team and token_hash = encode(extensions.digest(secret, 'sha256'), 'hex')
    and expires_at > now();
$$;
revoke all on function allot_private.agent_token_id(text, uuid) from public, anon, authenticated;

create function allot_private.agent_propose(secret text, team uuid, payload jsonb, recipient_ids uuid[], base uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare key_id uuid; draft_id uuid;
begin
  if secret !~ '^[a-f0-9]{64}$' then raise exception 'Invalid agent credential.'; end if;
  key_id := allot_private.agent_token_id(secret, team);
  if key_id is null then raise exception 'Invalid agent credential.'; end if;
  perform 1 from public.allot_teams where id = team for update;
  if base is not null and not exists (select 1 from public.allot_splits where id = base and team_id = team)
  then raise exception 'Base agreement unavailable.'; end if;
  if jsonb_typeof(payload) <> 'object' or octet_length(payload::text) > 4096
    or jsonb_typeof(payload->'recipients') <> 'array'
    or jsonb_array_length(payload->'recipients') not between 2 and 5
    or cardinality(recipient_ids) <> jsonb_array_length(payload->'recipients')
    or cardinality(recipient_ids) <> (select count(distinct id) from unnest(recipient_ids) id)
    or exists (select 1 from unnest(recipient_ids) id where not exists (
      select 1 from public.allot_members m where m.team_id = team and m.user_id = id))
  then raise exception 'Invalid proposal.'; end if;
  -- ponytail: hard cap until a reviewed archival flow exists; do not silently delete audit drafts.
  if (select count(*) from allot_private.agent_drafts where team_id = team) >= 100
  then raise exception 'Agent draft limit reached.'; end if;
  insert into allot_private.agent_drafts(team_id, token_id, base_split_id, payload, recipient_ids)
  values (team, key_id, base, payload, recipient_ids) returning id into draft_id;
  return draft_id;
end;
$$;
revoke all on function allot_private.agent_propose(text, uuid, jsonb, uuid[], uuid) from public, authenticated;
grant execute on function allot_private.agent_propose(text, uuid, jsonb, uuid[], uuid) to anon;

create function allot_private.agent_get(secret text, team uuid, split uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb; key_id uuid;
begin
  if secret !~ '^[a-f0-9]{64}$' then raise exception 'Invalid agent credential.'; end if;
  key_id := allot_private.agent_token_id(secret, team);
  if key_id is null then raise exception 'Invalid agent credential.'; end if;
  select jsonb_build_object('id', s.id, 'teamId', s.team_id, 'state', s.state,
    'payload', s.payload, 'recipientIds', s.recipient_ids, 'createdAt', s.created_at,
    'decisions', coalesce((select jsonb_agg(jsonb_build_object('userId', d.user_id,
      'decision', d.decision, 'requestedBps', d.requested_bps))
      from public.allot_decisions d where d.split_id = s.id), '[]'::jsonb))
  into result from public.allot_splits s where s.id = split and s.team_id = team;
  insert into allot_private.agent_activity(team_id, token_id, action, target_id)
  values (team, key_id, 'agreement_read', split);
  return result;
end;
$$;
revoke all on function allot_private.agent_get(text, uuid, uuid) from public, authenticated;
grant execute on function allot_private.agent_get(text, uuid, uuid) to anon;

create function allot_private.agent_request_approval(secret text, team uuid, draft uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare key_id uuid;
begin
  if secret !~ '^[a-f0-9]{64}$' then raise exception 'Invalid agent credential.'; end if;
  key_id := allot_private.agent_token_id(secret, team);
  if key_id is null then raise exception 'Invalid agent credential.'; end if;
  if not exists (select 1 from allot_private.agent_drafts where id = draft and team_id = team)
  then raise exception 'Agent draft unavailable.'; end if;
  insert into allot_private.agent_activity(team_id, token_id, action, target_id)
  values (team, key_id, 'approval_requested', draft);
  return true;
end;
$$;
revoke all on function allot_private.agent_request_approval(text, uuid, uuid) from public, authenticated;
grant execute on function allot_private.agent_request_approval(text, uuid, uuid) to anon;

create function allot_private.agent_drafts(team uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams t where t.id = team and t.owner_id = auth.uid()
  ) then raise exception 'Only the team owner can read agent drafts.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'payload', d.payload,
    'recipientIds', d.recipient_ids, 'baseAgreementId', d.base_split_id,
    'createdAt', d.created_at) order by d.created_at desc), '[]'::jsonb)
  into result from allot_private.agent_drafts d where d.team_id = team;
  return result;
end;
$$;
revoke all on function allot_private.agent_drafts(uuid) from public, anon;
grant execute on function allot_private.agent_drafts(uuid) to authenticated;

create function allot_private.agent_activity(team uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams t where t.id = team and t.owner_id = auth.uid()
  ) then raise exception 'Only the team owner can read agent activity.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'action', e.action,
    'targetId', e.target_id, 'createdAt', e.created_at) order by e.id desc), '[]'::jsonb)
  into result from (select * from allot_private.agent_activity where team_id = team order by id desc limit 100) e;
  return result;
end;
$$;
revoke all on function allot_private.agent_activity(uuid) from public, anon;
grant execute on function allot_private.agent_activity(uuid) to authenticated;

create function public.allot_agent_token_create(team uuid) returns text
language sql security invoker set search_path = '' as $$
  select allot_private.agent_token_create(team);
$$;
revoke all on function public.allot_agent_token_create(uuid) from public, anon;
grant execute on function public.allot_agent_token_create(uuid) to authenticated;

create function public.allot_agent_token_revoke(team uuid) returns void
language sql security invoker set search_path = '' as $$
  select allot_private.agent_token_revoke(team);
$$;
revoke all on function public.allot_agent_token_revoke(uuid) from public, anon;
grant execute on function public.allot_agent_token_revoke(uuid) to authenticated;

create function public.allot_agent_propose(secret text, team uuid, payload jsonb, recipient_ids uuid[], base uuid default null) returns uuid
language sql security invoker set search_path = '' as $$
  select allot_private.agent_propose(secret, team, payload, recipient_ids, base);
$$;
revoke all on function public.allot_agent_propose(text, uuid, jsonb, uuid[], uuid) from public, authenticated;
grant execute on function public.allot_agent_propose(text, uuid, jsonb, uuid[], uuid) to anon;

create function public.allot_agent_get(secret text, team uuid, split uuid) returns jsonb
language sql security invoker set search_path = '' as $$
  select allot_private.agent_get(secret, team, split);
$$;
revoke all on function public.allot_agent_get(text, uuid, uuid) from public, authenticated;
grant execute on function public.allot_agent_get(text, uuid, uuid) to anon;

create function public.allot_agent_request_approval(secret text, team uuid, draft uuid) returns boolean
language sql security invoker set search_path = '' as $$
  select allot_private.agent_request_approval(secret, team, draft);
$$;
revoke all on function public.allot_agent_request_approval(text, uuid, uuid) from public, authenticated;
grant execute on function public.allot_agent_request_approval(text, uuid, uuid) to anon;

create function public.allot_agent_drafts(team uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select allot_private.agent_drafts(team);
$$;
revoke all on function public.allot_agent_drafts(uuid) from public, anon;
grant execute on function public.allot_agent_drafts(uuid) to authenticated;

create function public.allot_agent_activity(team uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select allot_private.agent_activity(team);
$$;
revoke all on function public.allot_agent_activity(uuid) from public, anon;
grant execute on function public.allot_agent_activity(uuid) to authenticated;
