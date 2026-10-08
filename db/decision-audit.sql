-- Apply after teams.sql. Records future decision changes; cannot reconstruct past changes.
create table public.allot_decision_events (
  id bigint generated always as identity primary key,
  split_id uuid not null references public.allot_splits(id),
  user_id uuid not null references auth.users(id),
  decision text not null check (decision in ('accepted', 'rejected', 'countered')),
  requested_bps integer check (requested_bps between 1 and 10000),
  recorded_at timestamptz not null default now()
);
create index allot_decision_events_split on public.allot_decision_events(split_id, id);
alter table public.allot_decision_events enable row level security;
revoke all on public.allot_decision_events from public, anon, authenticated;
grant select on public.allot_decision_events to authenticated;
create policy decision_event_read on public.allot_decision_events for select to authenticated using (
  exists (select 1 from public.allot_splits s where s.id = split_id and allot_private.is_member(s.team_id))
);

create function allot_private.record_decision_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.allot_decision_events(split_id, user_id, decision, requested_bps)
  values (new.split_id, new.user_id, new.decision, new.requested_bps);
  return new;
end;
$$;
revoke all on function allot_private.record_decision_event() from public, anon, authenticated;
create trigger allot_decision_event after insert or update on public.allot_decisions
for each row execute function allot_private.record_decision_event();
