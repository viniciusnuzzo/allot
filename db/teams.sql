create schema if not exists allot_private;
revoke all on schema allot_private from public, anon;
grant usage on schema allot_private to authenticated;

create table public.allot_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.allot_members (
  team_id uuid not null references public.allot_teams(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  name text not null check (char_length(name) between 1 and 30),
  primary key (team_id, user_id)
);
create index allot_members_user on public.allot_members(user_id);
create table allot_private.invites (
  team_id uuid primary key references public.allot_teams(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz not null
);
create table public.allot_splits (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.allot_teams(id),
  payload jsonb not null,
  recipient_ids uuid[] not null,
  state text not null default 'pending' check (state in ('pending', 'superseded', 'published')),
  share_id uuid unique,
  created_at timestamptz not null default now(),
  check ((state = 'published') = (share_id is not null))
);
create index allot_splits_team on public.allot_splits(team_id);
create unique index allot_one_pending on public.allot_splits(team_id) where state = 'pending';
create table public.allot_decisions (
  split_id uuid not null references public.allot_splits(id),
  user_id uuid not null references auth.users(id),
  decision text not null check (decision in ('accepted', 'rejected', 'countered')),
  requested_bps integer check (requested_bps between 1 and 10000),
  primary key (split_id, user_id),
  check ((decision = 'countered') = (requested_bps is not null))
);
create index allot_decisions_user on public.allot_decisions(user_id);

create function allot_private.is_member(team uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.allot_members where team_id = team and user_id = auth.uid()
  );
$$;
revoke all on function allot_private.is_member(uuid) from public, anon;
grant execute on function allot_private.is_member(uuid) to authenticated;

alter table public.allot_teams enable row level security;
alter table public.allot_members enable row level security;
alter table public.allot_splits enable row level security;
alter table public.allot_decisions enable row level security;
alter table allot_private.invites enable row level security;
revoke all on public.allot_teams, public.allot_members, public.allot_splits, public.allot_decisions from anon, authenticated;
grant select on public.allot_teams, public.allot_members, public.allot_splits, public.allot_decisions to authenticated;
create policy team_read on public.allot_teams for select to authenticated using (allot_private.is_member(id));
create policy member_read on public.allot_members for select to authenticated using (allot_private.is_member(team_id));
create policy split_read on public.allot_splits for select to authenticated using (allot_private.is_member(team_id));
create policy decision_read on public.allot_decisions for select to authenticated using (
  exists (select 1 from public.allot_splits s where s.id = split_id and allot_private.is_member(s.team_id))
);

create function allot_private.run_action(action text, team uuid, split uuid, data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  owner uuid;
  code text;
  result_id uuid;
  current_split public.allot_splits;
  person jsonb;
  ids uuid[] := '{}';
  addresses text[] := '{}';
  total integer := 0;
  display_name text;
  payload jsonb;
  decision text;
  requested integer;
begin
  if actor is null or not exists (select 1 from auth.users where id = actor and email_confirmed_at is not null)
  then raise exception 'Confirm your email and log in to continue.'; end if;
  select left(coalesce(nullif(trim(raw_user_meta_data->>'name'), ''), 'Member'), 30)
    into display_name from auth.users where id = actor;

  if action = 'create' then
    if jsonb_typeof(data->'name') is distinct from 'string' or coalesce(char_length(trim(data->>'name')), 0) not between 1 and 60 then raise exception 'Enter a team name.'; end if;
    if (select count(*) from public.allot_teams where owner_id = actor) >= 50 then raise exception 'Team limit reached.'; end if;
    insert into public.allot_teams(name, owner_id) values (trim(data->>'name'), actor) returning id into result_id;
    insert into public.allot_members values (result_id, actor, display_name);
    return jsonb_build_object('id', result_id);
  end if;

  if action = 'join' then
    code := lower(trim(data->>'code'));
    if code is null or code !~ '^[a-f0-9]{32}$' then raise exception 'Invalid or expired invitation.'; end if;
    select team_id into team from allot_private.invites where token_hash = encode(extensions.digest(code, 'sha256'), 'hex');
    if team is null then raise exception 'Invalid or expired invitation.'; end if;
  end if;

  -- ponytail: mutations serialize per team; use per-proposal locks if team throughput requires it.
  select owner_id into owner from public.allot_teams where id = team for update;
  if owner is null then raise exception 'Team unavailable.'; end if;
  if action = 'join' then
    if not exists (select 1 from allot_private.invites where team_id = team
      and token_hash = encode(extensions.digest(code, 'sha256'), 'hex') and expires_at > now())
    then raise exception 'Invalid or expired invitation.'; end if;
    insert into public.allot_members values (team, actor, display_name) on conflict do nothing;
    return jsonb_build_object('id', team);
  end if;
  if not allot_private.is_member(team) then raise exception 'Team unavailable.'; end if;
  if action in ('invite', 'submit', 'publish', 'remove') and owner <> actor then raise exception 'Only the team owner can do this.'; end if;

  if action = 'invite' then
    code := encode(extensions.gen_random_bytes(16), 'hex');
    insert into allot_private.invites values (team, encode(extensions.digest(code, 'sha256'), 'hex'), now() + interval '7 days')
      on conflict (team_id) do update set token_hash = excluded.token_hash, expires_at = excluded.expires_at;
    return jsonb_build_object('code', code, 'expires_at', now() + interval '7 days');
  elsif action = 'remove' then
    if (data->>'user_id')::uuid = owner then raise exception 'The owner cannot be removed.'; end if;
    delete from public.allot_members where team_id = team and user_id = (data->>'user_id')::uuid;
    delete from allot_private.invites where team_id = team;
    update public.allot_splits set state = 'superseded' where team_id = team and state = 'pending' and (data->>'user_id')::uuid = any(recipient_ids);
    return '{}'::jsonb;
  elsif action = 'submit' then
    payload := data->'payload';
    if jsonb_typeof(payload) is distinct from 'object' then raise exception 'Invalid split.'; end if;
    if (select count(*) from jsonb_object_keys(payload)) <> 4 or not (payload ?& array['v','title','amount','recipients'])
      or payload->'v' is distinct from '1'::jsonb
      or jsonb_typeof(payload->'title') is distinct from 'string'
      or coalesce(char_length(trim(payload->>'title')), 0) not between 1 and 60
      or jsonb_typeof(payload->'recipients') is distinct from 'array'
      or jsonb_typeof(data->'recipient_ids') is distinct from 'array'
    then raise exception 'Invalid split.'; end if;
    if jsonb_array_length(payload->'recipients') not between 2 and 5
      or jsonb_array_length(data->'recipient_ids') <> jsonb_array_length(payload->'recipients')
    then raise exception 'Choose 2 to 5 recipients.'; end if;
    if not (payload ? 'amount') then raise exception 'Invalid amount.'; end if;
    if payload->'amount' <> 'null'::jsonb then
      if jsonb_typeof(payload->'amount') <> 'string' or char_length(payload->>'amount') > 32 or (payload->>'amount') !~ '^[0-9]+(\.[0-9]{1,6})?$'
        then raise exception 'Invalid amount.'; end if;
      if (payload->>'amount')::numeric < 1 or (payload->>'amount')::numeric > 1000000000 then raise exception 'Invalid amount.'; end if;
    end if;
    select array_agg(value::uuid) into ids from jsonb_array_elements_text(data->'recipient_ids');
    if cardinality(ids) <> (select count(distinct id) from unnest(ids) id)
      or exists (select 1 from unnest(ids) id where not exists (select 1 from public.allot_members m where m.team_id = team and m.user_id = id))
    then raise exception 'Recipients must be distinct active team members.'; end if;
    for person in select value from jsonb_array_elements(payload->'recipients') loop
      if jsonb_typeof(person) <> 'object' then raise exception 'Invalid recipient.'; end if;
      if (select count(*) from jsonb_object_keys(person)) <> 3 or not (person ?& array['name','address','bps'])
        or jsonb_typeof(person->'name') is distinct from 'string'
        or jsonb_typeof(person->'address') is distinct from 'string'
        or char_length(person->>'name') > 30 or coalesce(person->>'address','') !~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'
        or jsonb_typeof(person->'bps') is distinct from 'number' or (person->>'bps') !~ '^[0-9]{1,5}$'
      then raise exception 'Invalid recipient.'; end if;
      if (person->>'bps')::integer not between 1 and 10000 then raise exception 'Invalid percentage.'; end if;
      total := total + (person->>'bps')::integer;
      addresses := array_append(addresses, person->>'address');
    end loop;
    if total <> 10000 or cardinality(addresses) <> (select count(distinct a) from unnest(addresses) a)
    then raise exception 'Use unique addresses and a total of 100%%.'; end if;
    update public.allot_splits set state = 'superseded' where team_id = team and state = 'pending';
    insert into public.allot_splits(team_id, payload, recipient_ids) values (team, payload, ids) returning id into result_id;
    return jsonb_build_object('id', result_id);
  end if;

  select * into current_split from public.allot_splits where id = split and team_id = team for update;
  if current_split.id is null then raise exception 'Split unavailable.'; end if;
  if action = 'publish' and current_split.state = 'published' then return jsonb_build_object('share_id', current_split.share_id); end if;
  if current_split.state <> 'pending' then raise exception 'This version is no longer open for approval.'; end if;
  if action = 'decide' then
    if not (actor = any(current_split.recipient_ids)) then raise exception 'You are not a recipient of this split.'; end if;
    decision := data->>'decision';
    if decision is null or decision not in ('accepted', 'rejected', 'countered') then raise exception 'Invalid decision.'; end if;
    if decision = 'countered' then
      if coalesce(data->>'requested_bps','') !~ '^[0-9]{1,5}$' then raise exception 'Invalid requested percentage.'; end if;
      requested := (data->>'requested_bps')::integer;
      if requested not between 1 and 10000 then raise exception 'Invalid requested percentage.'; end if;
    end if;
    insert into public.allot_decisions values (split, actor, decision, requested)
      on conflict (split_id, user_id) do update set decision = excluded.decision, requested_bps = excluded.requested_bps;
    return '{}'::jsonb;
  elsif action = 'publish' then
    if exists (select 1 from unnest(current_split.recipient_ids) id where
      not exists (select 1 from public.allot_members m where m.team_id = team and m.user_id = id)
      or not exists (select 1 from public.allot_decisions d where d.split_id = split and d.user_id = id and d.decision = 'accepted'))
    then raise exception 'Every recipient must accept this exact version before publishing.'; end if;
    update public.allot_splits set state = 'published', share_id = gen_random_uuid() where id = split returning share_id into result_id;
    return jsonb_build_object('share_id', result_id);
  end if;
  raise exception 'Unknown action.';
end;
$$;
revoke all on function allot_private.run_action(text, uuid, uuid, jsonb) from public, anon;
grant execute on function allot_private.run_action(text, uuid, uuid, jsonb) to authenticated;
create function public.allot_action(action text, team uuid default null, split uuid default null, data jsonb default '{}')
returns jsonb language sql security invoker set search_path = '' as $$
  select allot_private.run_action(action, team, split, data);
$$;
revoke all on function public.allot_action(text, uuid, uuid, jsonb) from public, anon;
grant execute on function public.allot_action(text, uuid, uuid, jsonb) to authenticated;

create function allot_private.read_payment(share uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select payload from public.allot_splits where share_id = share and state = 'published';
$$;
revoke all on function allot_private.read_payment(uuid) from public;
grant usage on schema allot_private to anon;
grant execute on function allot_private.read_payment(uuid) to anon, authenticated;
create function public.allot_payment(share uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select allot_private.read_payment(share);
$$;
revoke all on function public.allot_payment(uuid) from public;
grant execute on function public.allot_payment(uuid) to anon, authenticated;
