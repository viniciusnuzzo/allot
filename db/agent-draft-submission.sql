-- Apply after agent-activity.sql. Bind human submission to the reviewed agent draft.
alter table allot_private.agent_drafts
  add column submitted_split_id uuid references public.allot_splits(id);

create function allot_private.agent_draft_submit(team uuid, draft uuid, payload jsonb, recipient_ids uuid[])
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
  return result;
end;
$$;
revoke all on function allot_private.agent_draft_submit(uuid, uuid, jsonb, uuid[]) from public, anon;
grant execute on function allot_private.agent_draft_submit(uuid, uuid, jsonb, uuid[]) to authenticated;

create function public.allot_agent_draft_submit(team uuid, draft uuid, payload jsonb, recipient_ids uuid[])
returns jsonb language sql security invoker set search_path = '' as $$
  select allot_private.agent_draft_submit(team, draft, payload, recipient_ids);
$$;
revoke all on function public.allot_agent_draft_submit(uuid, uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.allot_agent_draft_submit(uuid, uuid, jsonb, uuid[]) to authenticated;

create or replace function allot_private.agent_drafts(team uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams t where t.id = team and t.owner_id = auth.uid()
  ) then raise exception 'Only the team owner can read agent drafts.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'payload', d.payload,
    'recipientIds', d.recipient_ids, 'baseAgreementId', d.base_split_id,
    'createdAt', d.created_at) order by d.created_at desc), '[]'::jsonb)
  into result from allot_private.agent_drafts d where d.team_id = team and d.submitted_split_id is null;
  return result;
end;
$$;

create or replace function allot_private.agent_request_approval(secret text, team uuid, draft uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare key_id uuid;
begin
  if secret !~ '^[a-f0-9]{64}$' then raise exception 'Invalid agent credential.'; end if;
  key_id := allot_private.agent_token_id(secret, team);
  if key_id is null then raise exception 'Invalid agent credential.'; end if;
  perform 1 from public.allot_teams where id = team for update;
  if not exists (select 1 from allot_private.agent_drafts
    where id = draft and team_id = team and submitted_split_id is null)
  then raise exception 'Agent draft unavailable.'; end if;
  insert into allot_private.agent_activity(team_id, token_id, action, target_id)
  values (team, key_id, 'approval_requested', draft);
  return true;
end;
$$;
