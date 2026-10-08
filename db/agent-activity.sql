-- Apply after agent-drafts.sql and agent-projects.sql. Adds owner-visible audit events and review requests.
create table if not exists allot_private.agent_activity (
  id bigint generated always as identity primary key,
  team_id uuid not null references public.allot_teams(id) on delete cascade,
  token_id uuid references allot_private.agent_tokens(id) on delete set null,
  action text not null check (action in ('credential_created', 'credential_revoked', 'agreement_read',
    'agreement_proposed', 'approval_requested', 'project_proposed')),
  target_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists agent_activity_team on allot_private.agent_activity(team_id, id desc);
alter table allot_private.agent_activity enable row level security;
revoke all on allot_private.agent_activity from public, anon, authenticated;

create or replace function allot_private.record_agent_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'agent_tokens' then
    insert into allot_private.agent_activity(team_id, token_id, action)
    values (case when tg_op = 'INSERT' then new.team_id else old.team_id end,
      case when tg_op = 'INSERT' then new.id else null end,
      case when tg_op = 'INSERT' then 'credential_created' else 'credential_revoked' end);
  elsif tg_table_name = 'agent_drafts' then
    insert into allot_private.agent_activity(team_id, token_id, action, target_id)
    values (new.team_id, new.token_id, 'agreement_proposed', new.id);
  else
    insert into allot_private.agent_activity(team_id, token_id, action, target_id)
    values (new.team_id, new.token_id, 'project_proposed', new.id);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function allot_private.record_agent_activity() from public, anon, authenticated;

drop trigger if exists allot_agent_token_activity on allot_private.agent_tokens;
create trigger allot_agent_token_activity after insert or delete on allot_private.agent_tokens
for each row execute function allot_private.record_agent_activity();
drop trigger if exists allot_agent_draft_activity on allot_private.agent_drafts;
create trigger allot_agent_draft_activity after insert on allot_private.agent_drafts
for each row execute function allot_private.record_agent_activity();
drop trigger if exists allot_agent_project_activity on allot_private.agent_project_drafts;
create trigger allot_agent_project_activity after insert on allot_private.agent_project_drafts
for each row execute function allot_private.record_agent_activity();

create or replace function allot_private.agent_get(secret text, team uuid, split uuid) returns jsonb
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

create or replace function allot_private.agent_request_approval(secret text, team uuid, draft uuid) returns boolean
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

create or replace function allot_private.agent_activity(team uuid) returns jsonb
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

create or replace function public.allot_agent_get(secret text, team uuid, split uuid) returns jsonb
language sql security invoker set search_path = '' as $$
  select allot_private.agent_get(secret, team, split);
$$;
revoke all on function public.allot_agent_get(text, uuid, uuid) from public, authenticated;
grant execute on function public.allot_agent_get(text, uuid, uuid) to anon;

create or replace function public.allot_agent_request_approval(secret text, team uuid, draft uuid) returns boolean
language sql security invoker set search_path = '' as $$
  select allot_private.agent_request_approval(secret, team, draft);
$$;
revoke all on function public.allot_agent_request_approval(text, uuid, uuid) from public, authenticated;
grant execute on function public.allot_agent_request_approval(text, uuid, uuid) to anon;

create or replace function public.allot_agent_activity(team uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select allot_private.agent_activity(team);
$$;
revoke all on function public.allot_agent_activity(uuid) from public, anon;
grant execute on function public.allot_agent_activity(uuid) to authenticated;
