-- Apply after teams.sql. Planning budgets are test-USDC only; no funds are reserved or spent here.
create table public.allot_projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.allot_teams(id) on delete cascade,
  parent_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 60),
  budget_units bigint check (budget_units between 1000000 and 1000000000000000),
  created_at timestamptz not null default now(),
  unique (team_id, id),
  foreign key (team_id, parent_id) references public.allot_projects(team_id, id)
);
create index allot_projects_team on public.allot_projects(team_id, created_at);
alter table public.allot_projects enable row level security;
revoke all on public.allot_projects from public, anon, authenticated;
grant select on public.allot_projects to authenticated;
create policy project_read on public.allot_projects for select to authenticated
  using (allot_private.is_member(team_id));

alter table public.allot_splits add column project_id uuid;
alter table public.allot_splits add constraint allot_split_project_team
  foreign key (team_id, project_id) references public.allot_projects(team_id, id);

create function allot_private.create_project(team uuid, parent uuid, title text, budget_units bigint)
returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid; parent_budget bigint;
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams where id = team and owner_id = auth.uid()
  ) then raise exception 'Only the team owner can create a project.'; end if;
  perform 1 from public.allot_teams where id = team for update;
  if title is null or char_length(trim(title)) not between 1 and 60
  then raise exception 'Enter a project title.'; end if;
  if budget_units is not null and budget_units not between 1000000 and 1000000000000000
  then raise exception 'Invalid test-USDC budget.'; end if;
  if (select count(*) from public.allot_projects where team_id = team) >= 100
  then raise exception 'Project limit reached.'; end if;
  if parent is not null then
    select p.budget_units into parent_budget from public.allot_projects p
      where p.id = parent and p.team_id = team;
    if not found then raise exception 'Parent project unavailable.'; end if;
    if parent_budget is not null and (
      budget_units is null or budget_units > parent_budget - coalesce((
        select sum(p.budget_units) from public.allot_projects p where p.parent_id = parent
      ), 0)
    ) then raise exception 'Child budgets exceed the parent budget.'; end if;
  end if;
  insert into public.allot_projects(team_id, parent_id, title, budget_units)
    values (team, parent, trim(title), budget_units) returning id into result;
  return result;
end;
$$;
revoke all on function allot_private.create_project(uuid, uuid, text, bigint) from public, anon;
grant execute on function allot_private.create_project(uuid, uuid, text, bigint) to authenticated;
create function public.allot_project_create(team uuid, parent uuid, title text, budget_units bigint)
returns uuid language sql security invoker set search_path = '' as $$
  select allot_private.create_project(team, parent, title, budget_units);
$$;
revoke all on function public.allot_project_create(uuid, uuid, text, bigint) from public, anon;
grant execute on function public.allot_project_create(uuid, uuid, text, bigint) to authenticated;

create function allot_private.link_project(team uuid, split uuid, project uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.allot_teams where id = team and owner_id = auth.uid()
  ) then raise exception 'Only the team owner can link an agreement.'; end if;
  perform 1 from public.allot_teams where id = team for update;
  if not exists (select 1 from public.allot_splits where id = split and team_id = team and state = 'pending')
    or exists (select 1 from public.allot_decisions where split_id = split)
  then raise exception 'Link a pending agreement before recipient decisions.'; end if;
  if project is not null and not exists (
    select 1 from public.allot_projects where id = project and team_id = team
  ) then raise exception 'Project unavailable.'; end if;
  update public.allot_splits set project_id = project where id = split and team_id = team;
end;
$$;
revoke all on function allot_private.link_project(uuid, uuid, uuid) from public, anon;
grant execute on function allot_private.link_project(uuid, uuid, uuid) to authenticated;
create function public.allot_project_link(team uuid, split uuid, project uuid)
returns void language sql security invoker set search_path = '' as $$
  select allot_private.link_project(team, split, project);
$$;
revoke all on function public.allot_project_link(uuid, uuid, uuid) from public, anon;
grant execute on function public.allot_project_link(uuid, uuid, uuid) to authenticated;
