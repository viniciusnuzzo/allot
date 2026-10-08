-- Apply after projects.sql and agent-drafts.sql. Agents propose; owners create.
create table allot_private.agent_project_drafts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.allot_teams(id) on delete cascade,
  token_id uuid references allot_private.agent_tokens(id) on delete set null,
  parent_id uuid,
  title text not null,
  budget_units bigint,
  state text not null default 'pending' check (state in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  foreign key (team_id, parent_id) references public.allot_projects(team_id, id)
);
create index agent_project_drafts_team on allot_private.agent_project_drafts(team_id, created_at desc);
alter table allot_private.agent_project_drafts enable row level security;
revoke all on allot_private.agent_project_drafts from public, anon, authenticated;

create function allot_private.agent_project_propose(secret text, team uuid, parent uuid, title text, budget_units bigint)
returns uuid language plpgsql security definer set search_path = '' as $$
declare key_id uuid; result uuid;
begin
  if secret !~ '^[a-f0-9]{64}$' then raise exception 'Invalid agent credential.'; end if;
  key_id := allot_private.agent_token_id(secret, team);
  if key_id is null then raise exception 'Invalid agent credential.'; end if;
  perform 1 from public.allot_teams where id = team for update;
  if title is null or char_length(trim(title)) not between 1 and 60
    or (budget_units is not null and budget_units not between 1000000 and 1000000000000000)
    or (parent is not null and not exists (select 1 from public.allot_projects where id = parent and team_id = team))
  then raise exception 'Invalid project proposal.'; end if;
  if (select count(*) from allot_private.agent_project_drafts where team_id = team and state = 'pending') >= 100
  then raise exception 'Agent project draft limit reached.'; end if;
  insert into allot_private.agent_project_drafts(team_id, token_id, parent_id, title, budget_units)
    values (team, key_id, parent, trim(title), budget_units) returning id into result;
  return result;
end;
$$;
revoke all on function allot_private.agent_project_propose(text, uuid, uuid, text, bigint) from public, authenticated;
grant execute on function allot_private.agent_project_propose(text, uuid, uuid, text, bigint) to anon;

create function allot_private.agent_project_drafts(team uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams where id = team and owner_id = auth.uid()
  ) then raise exception 'Only the team owner can review project drafts.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'parentId', parent_id,
    'title', title, 'budgetUnits', budget_units, 'createdAt', created_at)
    order by created_at desc), '[]'::jsonb) into result
    from allot_private.agent_project_drafts where team_id = team and state = 'pending';
  return result;
end;
$$;
revoke all on function allot_private.agent_project_drafts(uuid) from public, anon;
grant execute on function allot_private.agent_project_drafts(uuid) to authenticated;

create function allot_private.agent_project_accept(team uuid, draft uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare proposal allot_private.agent_project_drafts; result uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams where id = team and owner_id = auth.uid()
  ) then raise exception 'Only the team owner can accept a project draft.'; end if;
  perform 1 from public.allot_teams where id = team for update;
  select * into proposal from allot_private.agent_project_drafts
    where id = draft and team_id = team for update;
  if proposal.id is null or proposal.state <> 'pending'
  then raise exception 'Project draft unavailable.'; end if;
  result := allot_private.create_project(team, proposal.parent_id, proposal.title, proposal.budget_units);
  update allot_private.agent_project_drafts set state = 'accepted' where id = draft;
  return result;
end;
$$;
revoke all on function allot_private.agent_project_accept(uuid, uuid) from public, anon;
grant execute on function allot_private.agent_project_accept(uuid, uuid) to authenticated;

create function allot_private.agent_project_reject(team uuid, draft uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams where id = team and owner_id = auth.uid()
  ) then raise exception 'Only the team owner can reject a project draft.'; end if;
  update allot_private.agent_project_drafts set state = 'rejected'
    where id = draft and team_id = team and state = 'pending';
  if not found then raise exception 'Project draft unavailable.'; end if;
end;
$$;
revoke all on function allot_private.agent_project_reject(uuid, uuid) from public, anon;
grant execute on function allot_private.agent_project_reject(uuid, uuid) to authenticated;

create function public.allot_agent_project_propose(secret text, team uuid, parent uuid, title text, budget_units bigint)
returns uuid language sql security invoker set search_path = '' as $$
  select allot_private.agent_project_propose(secret, team, parent, title, budget_units);
$$;
revoke all on function public.allot_agent_project_propose(text, uuid, uuid, text, bigint) from public, authenticated;
grant execute on function public.allot_agent_project_propose(text, uuid, uuid, text, bigint) to anon;

create function public.allot_agent_project_drafts(team uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select allot_private.agent_project_drafts(team);
$$;
revoke all on function public.allot_agent_project_drafts(uuid) from public, anon;
grant execute on function public.allot_agent_project_drafts(uuid) to authenticated;

create function public.allot_agent_project_accept(team uuid, draft uuid) returns uuid
language sql security invoker set search_path = '' as $$
  select allot_private.agent_project_accept(team, draft);
$$;
revoke all on function public.allot_agent_project_accept(uuid, uuid) from public, anon;
grant execute on function public.allot_agent_project_accept(uuid, uuid) to authenticated;

create function public.allot_agent_project_reject(team uuid, draft uuid) returns void
language sql security invoker set search_path = '' as $$
  select allot_private.agent_project_reject(team, draft);
$$;
revoke all on function public.allot_agent_project_reject(uuid, uuid) from public, anon;
grant execute on function public.allot_agent_project_reject(uuid, uuid) to authenticated;
