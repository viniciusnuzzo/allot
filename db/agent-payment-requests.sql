-- Apply after agent-activity.sql. Agents may request payments; only people approve and sign.
create table allot_private.agent_policies (
  team_id uuid primary key references public.allot_teams(id) on delete cascade,
  budget_units bigint not null check (budget_units between 1000000 and 1000000000000000),
  max_transaction_units bigint not null check (max_transaction_units between 1000000 and budget_units),
  human_approval_above_units bigint not null check (human_approval_above_units between 0 and max_transaction_units),
  recipient_addresses text[] not null check (cardinality(recipient_addresses) between 1 and 100),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table allot_private.agent_payment_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.allot_teams(id) on delete cascade,
  token_id uuid references allot_private.agent_tokens(id) on delete set null,
  split_id uuid not null references public.allot_splits(id),
  idempotency_key text not null check (idempotency_key ~ '^[A-Za-z0-9._:-]{1,64}$'),
  amount_units bigint not null check (amount_units > 0),
  state text not null check (state in ('pending_approval', 'ready_to_sign', 'rejected', 'confirmed', 'expired')),
  signature text unique check (signature is null or signature ~ '^[1-9A-HJ-NP-Za-km-z]{64,88}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  confirmed_at timestamptz,
  unique (token_id, idempotency_key)
);

create index agent_payment_requests_team on allot_private.agent_payment_requests(team_id, created_at desc);
create index agent_payment_requests_split on allot_private.agent_payment_requests(split_id);
alter table allot_private.agent_policies enable row level security;
alter table allot_private.agent_payment_requests enable row level security;
revoke all on allot_private.agent_policies, allot_private.agent_payment_requests from public, anon, authenticated;

alter table allot_private.agent_activity drop constraint if exists agent_activity_action_check;
alter table allot_private.agent_activity add constraint agent_activity_action_check check (action in (
  'credential_created', 'credential_revoked', 'agreement_read', 'agreement_proposed',
  'approval_requested', 'project_proposed', 'policy_updated', 'payment_requested',
  'payment_approved', 'payment_rejected', 'payment_confirmed'
));

create function allot_private.agent_policy_set(team uuid, budget_units bigint, max_transaction_units bigint,
  human_approval_above_units bigint, recipient_addresses text[], expires_at timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams where id = team and owner_id = auth.uid()
  ) then raise exception 'Only the team owner can configure agent payments.'; end if;
  perform 1 from public.allot_teams where id = team for update;
  if budget_units not between 1000000 and 1000000000000000
    or max_transaction_units not between 1000000 and budget_units
    or human_approval_above_units not between 0 and max_transaction_units
    or $6 <= now() or $6 > now() + interval '365 days'
    or cardinality(recipient_addresses) not between 1 and 100
    or cardinality(recipient_addresses) <> (select count(distinct address) from unnest(recipient_addresses) address)
    or exists (select 1 from unnest(recipient_addresses) address where address !~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$')
  then raise exception 'Invalid agent payment policy.'; end if;
  update allot_private.agent_payment_requests set state = 'expired'
    where team_id = team and state in ('pending_approval', 'ready_to_sign');
  insert into allot_private.agent_policies values (
    team, budget_units, max_transaction_units, human_approval_above_units, recipient_addresses, $6, now()
  ) on conflict (team_id) do update set budget_units = excluded.budget_units,
    max_transaction_units = excluded.max_transaction_units,
    human_approval_above_units = excluded.human_approval_above_units,
    recipient_addresses = excluded.recipient_addresses, expires_at = excluded.expires_at, updated_at = now();
  insert into allot_private.agent_activity(team_id, action) values (team, 'policy_updated');
end;
$$;
revoke all on function allot_private.agent_policy_set(uuid, bigint, bigint, bigint, text[], timestamptz) from public, anon;
grant execute on function allot_private.agent_policy_set(uuid, bigint, bigint, bigint, text[], timestamptz) to authenticated;

create or replace function allot_private.agent_token_revoke(team uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams where id = team and owner_id = auth.uid()
  ) then raise exception 'Only the team owner can revoke agent credentials.'; end if;
  perform 1 from public.allot_teams where id = team for update;
  update allot_private.agent_payment_requests set state = 'expired'
    where team_id = team and token_id in (select id from allot_private.agent_tokens where team_id = team)
      and state in ('pending_approval', 'ready_to_sign');
  delete from allot_private.agent_tokens where team_id = team;
end;
$$;
revoke all on function allot_private.agent_token_revoke(uuid) from public, anon;
grant execute on function allot_private.agent_token_revoke(uuid) to authenticated;

create function allot_private.agent_payment_request(secret text, team uuid, split uuid, idempotency_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare policy allot_private.agent_policies; agreement public.allot_splits; key_id uuid; result allot_private.agent_payment_requests;
  amount bigint; reserved bigint; next_state text;
begin
  if secret !~ '^[a-f0-9]{64}$' then raise exception 'Invalid agent credential.'; end if;
  key_id := allot_private.agent_token_id(secret, team);
  if key_id is null then raise exception 'Invalid agent credential.'; end if;
  if idempotency_key !~ '^[A-Za-z0-9._:-]{1,64}$' then raise exception 'Invalid idempotency key.'; end if;
  select * into result from allot_private.agent_payment_requests r
    where r.token_id = key_id and r.idempotency_key = $4;
  if found then
    if result.split_id <> split then raise exception 'Idempotency key already used.'; end if;
    return jsonb_build_object('id', result.id, 'state', result.state, 'expiresAt', result.expires_at);
  end if;
  select * into policy from allot_private.agent_policies where team_id = team for update;
  if not found or policy.expires_at <= now() then raise exception 'Agent payment policy unavailable or expired.'; end if;
  update allot_private.agent_payment_requests set state = 'expired'
    where team_id = team and state in ('pending_approval', 'ready_to_sign') and expires_at <= now();
  select * into agreement from public.allot_splits where id = split and team_id = team and state = 'published';
  if not found or agreement.payload->>'amount' is null then raise exception 'A published fixed-amount agreement is required.'; end if;
  amount := ((agreement.payload->>'amount')::numeric * 1000000)::bigint;
  if amount > policy.max_transaction_units then raise exception 'Payment exceeds the transaction limit.'; end if;
  if exists (select 1 from jsonb_array_elements(agreement.payload->'recipients') recipient
    where not (recipient->>'address' = any(policy.recipient_addresses)))
  then raise exception 'Payment includes an unauthorized recipient.'; end if;
  select coalesce(sum(amount_units), 0) into reserved from allot_private.agent_payment_requests
    where team_id = team and (state = 'confirmed' or (state in ('pending_approval', 'ready_to_sign') and expires_at > now()));
  if reserved + amount > policy.budget_units then raise exception 'Payment exceeds the remaining policy budget.'; end if;
  next_state := case when amount > policy.human_approval_above_units then 'pending_approval' else 'ready_to_sign' end;
  insert into allot_private.agent_payment_requests(team_id, token_id, split_id, idempotency_key, amount_units, state, expires_at)
    values (team, key_id, split, $4, amount, next_state, least(policy.expires_at, now() + interval '1 day'))
    returning * into result;
  insert into allot_private.agent_activity(team_id, token_id, action, target_id)
    values (team, key_id, 'payment_requested', result.id);
  return jsonb_build_object('id', result.id, 'state', result.state, 'expiresAt', result.expires_at);
end;
$$;
revoke all on function allot_private.agent_payment_request(text, uuid, uuid, text) from public, authenticated;
grant execute on function allot_private.agent_payment_request(text, uuid, uuid, text) to anon;

create function allot_private.agent_payment_get(secret text, team uuid, request uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare key_id uuid; result jsonb;
begin
  key_id := allot_private.agent_token_id(secret, team);
  if key_id is null then raise exception 'Invalid agent credential.'; end if;
  update allot_private.agent_payment_requests set state = 'expired'
    where id = request and team_id = team and state in ('pending_approval', 'ready_to_sign') and expires_at <= now();
  select jsonb_build_object('id', r.id, 'agreementId', r.split_id, 'state', r.state,
    'amountUnits', r.amount_units::text, 'expiresAt', r.expires_at, 'signature', r.signature,
    'shareId', case when r.state in ('ready_to_sign', 'confirmed') then s.share_id else null end)
  into result from allot_private.agent_payment_requests r join public.allot_splits s on s.id = r.split_id
    where r.id = request and r.team_id = team and r.token_id = key_id;
  return result;
end;
$$;
revoke all on function allot_private.agent_payment_get(text, uuid, uuid) from public, authenticated;
grant execute on function allot_private.agent_payment_get(text, uuid, uuid) to anon;

create function allot_private.agent_payment_review(team uuid, request uuid, decision text) returns void
language plpgsql security definer set search_path = '' as $$
declare item allot_private.agent_payment_requests;
begin
  if auth.uid() is null or not exists (select 1 from public.allot_teams where id = team and owner_id = auth.uid())
  then raise exception 'Only the team owner can review agent payments.'; end if;
  perform 1 from public.allot_teams where id = team for update;
  select * into item from allot_private.agent_payment_requests where id = request and team_id = team for update;
  if not found or item.state <> 'pending_approval' or item.expires_at <= now() then raise exception 'Payment request is unavailable.'; end if;
  if decision not in ('approve', 'reject') then raise exception 'Invalid payment decision.'; end if;
  update allot_private.agent_payment_requests set state = case when decision = 'approve' then 'ready_to_sign' else 'rejected' end,
    reviewed_at = now() where id = request;
  insert into allot_private.agent_activity(team_id, token_id, action, target_id)
    values (team, item.token_id, case when decision = 'approve' then 'payment_approved' else 'payment_rejected' end, request);
end;
$$;
revoke all on function allot_private.agent_payment_review(uuid, uuid, text) from public, anon;
grant execute on function allot_private.agent_payment_review(uuid, uuid, text) to authenticated;

create function allot_private.agent_payment_confirm(team uuid, request uuid, signature text) returns void
language plpgsql security definer set search_path = '' as $$
declare item allot_private.agent_payment_requests;
begin
  if auth.uid() is null or not exists (select 1 from public.allot_teams where id = team and owner_id = auth.uid())
  then raise exception 'Only the team owner can confirm an agent payment.'; end if;
  if signature !~ '^[1-9A-HJ-NP-Za-km-z]{64,88}$' then raise exception 'Invalid signature.'; end if;
  select * into item from allot_private.agent_payment_requests where id = request and team_id = team for update;
  if not found or item.state <> 'ready_to_sign' then raise exception 'Payment request is unavailable.'; end if;
  update allot_private.agent_payment_requests set state = 'confirmed', signature = $3,
    confirmed_at = now() where id = request;
  insert into allot_private.agent_activity(team_id, token_id, action, target_id)
    values (team, item.token_id, 'payment_confirmed', request);
end;
$$;
revoke all on function allot_private.agent_payment_confirm(uuid, uuid, text) from public, anon;
grant execute on function allot_private.agent_payment_confirm(uuid, uuid, text) to authenticated;

create function allot_private.agent_payment_confirmation(request uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('teamId', r.team_id, 'shareId', s.share_id)
  from allot_private.agent_payment_requests r join public.allot_splits s on s.id = r.split_id
  join public.allot_teams t on t.id = r.team_id
  where r.id = request and r.state = 'ready_to_sign' and t.owner_id = auth.uid();
$$;
revoke all on function allot_private.agent_payment_confirmation(uuid) from public, anon;
grant execute on function allot_private.agent_payment_confirmation(uuid) to authenticated;

create function allot_private.agent_payment_state(team uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null or not exists (select 1 from public.allot_teams where id = team and owner_id = auth.uid())
  then raise exception 'Only the team owner can read agent payment state.'; end if;
  select jsonb_build_object(
    'policy', (select jsonb_build_object('budgetUnits', p.budget_units::text, 'maxTransactionUnits', p.max_transaction_units::text,
      'humanApprovalAboveUnits', p.human_approval_above_units::text, 'recipientAddresses', p.recipient_addresses,
      'expiresAt', p.expires_at) from allot_private.agent_policies p where p.team_id = team),
    'requests', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'agreementId', r.split_id,
      'title', s.payload->>'title', 'amountUnits', r.amount_units::text, 'state', case when r.state in ('pending_approval', 'ready_to_sign') and r.expires_at <= now() then 'expired' else r.state end,
      'shareId', case when r.state in ('ready_to_sign', 'confirmed') then s.share_id else null end,
      'signature', r.signature, 'expiresAt', r.expires_at, 'createdAt', r.created_at) order by r.created_at desc)
      from (select * from allot_private.agent_payment_requests where team_id = team order by created_at desc limit 50) r
      join public.allot_splits s on s.id = r.split_id), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function allot_private.agent_payment_state(uuid) from public, anon;
grant execute on function allot_private.agent_payment_state(uuid) to authenticated;

create function public.allot_agent_policy_set(team uuid, budget_units bigint, max_transaction_units bigint,
  human_approval_above_units bigint, recipient_addresses text[], expires_at timestamptz) returns void
language sql security invoker set search_path = '' as $$
  select allot_private.agent_policy_set(team, budget_units, max_transaction_units, human_approval_above_units, recipient_addresses, expires_at);
$$;
create function public.allot_agent_payment_request(secret text, team uuid, split uuid, idempotency_key text) returns jsonb
language sql security invoker set search_path = '' as $$ select allot_private.agent_payment_request(secret, team, split, idempotency_key); $$;
create function public.allot_agent_payment_get(secret text, team uuid, request uuid) returns jsonb
language sql security invoker set search_path = '' as $$ select allot_private.agent_payment_get(secret, team, request); $$;
create function public.allot_agent_payment_review(team uuid, request uuid, decision text) returns void
language sql security invoker set search_path = '' as $$ select allot_private.agent_payment_review(team, request, decision); $$;
create function public.allot_agent_payment_confirm(team uuid, request uuid, signature text) returns void
language sql security invoker set search_path = '' as $$ select allot_private.agent_payment_confirm(team, request, signature); $$;
create function public.allot_agent_payment_confirmation(request uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$ select allot_private.agent_payment_confirmation(request); $$;
create function public.allot_agent_payment_state(team uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$ select allot_private.agent_payment_state(team); $$;

revoke all on function public.allot_agent_policy_set(uuid, bigint, bigint, bigint, text[], timestamptz) from public, anon;
revoke all on function public.allot_agent_payment_request(text, uuid, uuid, text) from public, authenticated;
revoke all on function public.allot_agent_payment_get(text, uuid, uuid) from public, authenticated;
revoke all on function public.allot_agent_payment_review(uuid, uuid, text) from public, anon;
revoke all on function public.allot_agent_payment_confirm(uuid, uuid, text) from public, anon;
revoke all on function public.allot_agent_payment_confirmation(uuid) from public, anon;
revoke all on function public.allot_agent_payment_state(uuid) from public, anon;
grant execute on function public.allot_agent_policy_set(uuid, bigint, bigint, bigint, text[], timestamptz) to authenticated;
grant execute on function public.allot_agent_payment_request(text, uuid, uuid, text) to anon;
grant execute on function public.allot_agent_payment_get(text, uuid, uuid) to anon;
grant execute on function public.allot_agent_payment_review(uuid, uuid, text) to authenticated;
grant execute on function public.allot_agent_payment_confirm(uuid, uuid, text) to authenticated;
grant execute on function public.allot_agent_payment_confirmation(uuid) to authenticated;
grant execute on function public.allot_agent_payment_state(uuid) to authenticated;
