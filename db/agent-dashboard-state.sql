-- Apply after agent-draft-submission.sql. Expose exact owner dashboard totals and draft submission history.
alter table allot_private.agent_activity drop constraint agent_activity_action_check;
alter table allot_private.agent_activity add constraint agent_activity_action_check check (action in (
  'credential_created', 'credential_revoked', 'agreement_read', 'agreement_proposed',
  'approval_requested', 'agreement_submitted', 'project_proposed', 'policy_updated',
  'payment_requested', 'payment_approved', 'payment_rejected', 'payment_confirmed'
));

create or replace function allot_private.agent_draft_submit(team uuid, draft uuid, payload jsonb, recipient_ids uuid[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare source allot_private.agent_drafts; result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams t where t.id = team and t.owner_id = auth.uid()
  ) then raise exception 'Only the team owner can submit an agent draft.'; end if;
  perform 1 from public.allot_teams where id = team for update;
  select * into source from allot_private.agent_drafts
    where id = draft and team_id = team and submitted_split_id is null for update;
  if not found then raise exception 'Agent draft unavailable or already submitted.'; end if;
  -- shortcut: published splits have no lineage; add parent-version tracking before rejecting newer published revisions.
  if source.base_split_id is not null and not exists (
    select 1 from public.allot_splits where id = source.base_split_id and team_id = team and state <> 'superseded'
  ) then raise exception 'Base agreement changed. Ask the agent for a new proposal.'; end if;
  result := allot_private.run_action('submit', team, null,
    jsonb_build_object('payload', payload, 'recipient_ids', recipient_ids));
  update allot_private.agent_drafts set submitted_split_id = (result->>'id')::uuid where id = draft;
  insert into allot_private.agent_activity(team_id, token_id, action, target_id)
  values (team, source.token_id, 'agreement_submitted', (result->>'id')::uuid);
  return result;
end;
$$;

create or replace function allot_private.agent_payment_state(team uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null or not exists (select 1 from public.allot_teams where id = team and owner_id = auth.uid())
  then raise exception 'Only the team owner can read agent payment state.'; end if;
  select jsonb_build_object(
    'activeCredentials', (select count(*) from allot_private.agent_tokens where team_id = team and expires_at > now()),
    'committedUnits', (select coalesce(sum(amount_units), 0)::text from allot_private.agent_payment_requests
      where team_id = team and (state = 'confirmed' or (state in ('pending_approval', 'ready_to_sign') and expires_at > now()))),
    'confirmedUnits', (select coalesce(sum(amount_units), 0)::text from allot_private.agent_payment_requests
      where team_id = team and state = 'confirmed'),
    'pendingApprovals', (select count(*) from allot_private.agent_payment_requests
      where team_id = team and state = 'pending_approval' and expires_at > now()),
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
