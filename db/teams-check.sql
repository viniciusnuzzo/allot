begin;
do $$
declare
  boss uuid := gen_random_uuid();
  employee uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  team uuid;
  original uuid;
  revised uuid;
  share uuid;
  code text;
  old_code text;
  payload jsonb := '{"v":1,"title":"Approval regression","amount":"100.00","recipients":[{"name":"Owner","address":"11111111111111111111111111111111","bps":9000},{"name":"Designer","address":"So11111111111111111111111111111111111111112","bps":1000}]}';
  failed boolean;
  visible integer;
  bad jsonb;
begin
  insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
    (boss,boss::text || '@example.test',now(),'{"name":"Owner"}'),
    (employee,employee::text || '@example.test',now(),'{"name":"Designer"}'),
    (outsider,outsider::text || '@example.test',now(),'{"name":"Outsider"}');
  perform set_config('request.jwt.claim.sub',boss::text,true);
  execute 'set local role authenticated';
  team := (public.allot_action('create', data => '{"name":"Regression team"}')->>'id')::uuid;
  old_code := public.allot_action('invite',team)->>'code';
  code := public.allot_action('invite',team)->>'code';
  perform set_config('request.jwt.claim.sub',employee::text,true);
  failed := false;
  begin perform public.allot_action('join',data=>jsonb_build_object('code',old_code)); exception when raise_exception then failed := true; end;
  assert failed, 'Rotated invitation must fail';
  perform public.allot_action('join',data=>jsonb_build_object('code',code));
  perform public.allot_action('join',data=>jsonb_build_object('code',code));
  assert (select count(*) from public.allot_members where team_id = team) = 2, 'Joining must be idempotent';
  failed := false;
  begin perform public.allot_action('invite',team); exception when raise_exception then failed := true; end;
  assert failed, 'Member must not invite';
  perform set_config('request.jwt.claim.sub',boss::text,true);
  for bad in select unnest(array[
    jsonb_set(payload,'{title}','123'::jsonb),
    jsonb_set(payload,'{amount}',to_jsonb(repeat('9',33))),
    payload || '{"email":"must-not-be-public@example.test"}'::jsonb,
    jsonb_set(payload,'{recipients,0,email}','"must-not-be-public@example.test"'::jsonb)
  ]) loop
    failed := false;
    begin perform public.allot_action('submit',team,data=>jsonb_build_object('payload',bad,'recipient_ids',jsonb_build_array(boss,employee)));
    exception when raise_exception then failed := true; end;
    assert failed, 'Direct RPC must reject malformed or private extra data';
  end loop;
  original := (public.allot_action('submit',team,data=>jsonb_build_object('payload',payload,'recipient_ids',jsonb_build_array(boss,employee)))->>'id')::uuid;
  failed := false;
  begin perform public.allot_action('publish',team,original); exception when raise_exception then failed := true; end;
  assert failed, 'No publication before all accept';
  perform public.allot_action('decide',team,original,'{"decision":"accepted"}');
  perform set_config('request.jwt.claim.sub',employee::text,true);
  perform public.allot_action('decide',team,original,'{"decision":"rejected"}');
  perform public.allot_action('decide',team,original,'{"decision":"countered","requested_bps":2000}');
  perform set_config('request.jwt.claim.sub',boss::text,true);
  failed := false;
  begin perform public.allot_action('publish',team,original); exception when raise_exception then failed := true; end;
  assert failed, 'Counterproposal must block publication';
  payload := jsonb_set(jsonb_set(payload,'{recipients,0,bps}','8000'),'{recipients,1,bps}','2000');
  revised := (public.allot_action('submit',team,data=>jsonb_build_object('payload',payload,'recipient_ids',jsonb_build_array(boss,employee)))->>'id')::uuid;
  assert (select count(*) from public.allot_decisions where split_id = revised) = 0, 'Revision must have fresh approvals';
  failed := false;
  begin perform public.allot_action('decide',team,original,'{"decision":"accepted"}'); exception when raise_exception then failed := true; end;
  assert failed, 'Stale acceptance must fail';
  perform public.allot_action('decide',team,revised,'{"decision":"accepted"}');
  perform set_config('request.jwt.claim.sub',outsider::text,true);
  select count(*) into visible from public.allot_splits;
  assert visible = 0, 'RLS must hide other teams';
  failed := false;
  begin perform public.allot_action('decide',team,revised,'{"decision":"accepted"}'); exception when raise_exception then failed := true; end;
  assert failed, 'Outsider cannot forge acceptance';
  failed := false;
  begin insert into public.allot_decisions values (revised,employee,'accepted',null); exception when insufficient_privilege then failed := true; end;
  assert failed, 'Direct table writes must fail';
  perform set_config('request.jwt.claim.sub',employee::text,true);
  perform public.allot_action('decide',team,revised,'{"decision":"accepted"}');
  failed := false;
  begin perform public.allot_action('publish',team,revised); exception when raise_exception then failed := true; end;
  assert failed, 'Only owner can publish';
  perform set_config('request.jwt.claim.sub',boss::text,true);
  share := (public.allot_action('publish',team,revised)->>'share_id')::uuid;
  assert (public.allot_action('publish',team,revised)->>'share_id')::uuid = share, 'Repeated publication must reuse same link';
  original := (public.allot_action('submit',team,data=>jsonb_build_object('payload',payload,'recipient_ids',jsonb_build_array(boss,employee)))->>'id')::uuid;
  perform public.allot_action('remove',team,data=>jsonb_build_object('user_id',employee));
  assert (select state from public.allot_splits where id = original) = 'superseded', 'Removal must invalidate pending recipient approvals';
  perform set_config('request.jwt.claim.sub',employee::text,true);
  failed := false;
  begin perform public.allot_action('join',data=>jsonb_build_object('code',code)); exception when raise_exception then failed := true; end;
  assert failed, 'Removal must revoke the shared invitation';
  failed := false;
  begin perform public.allot_action('decide',team,original,'{"decision":"accepted"}'); exception when raise_exception then failed := true; end;
  assert failed, 'Removed member must lose access';
  execute 'reset role';
  execute 'set local role anon';
  assert public.allot_payment(share) = payload, 'Public read must return approved payload only';
  assert public.allot_payment(gen_random_uuid()) is null, 'Unknown share must return nothing';
  failed := false;
  begin perform public.allot_action('create',data=>'{"name":"Unauthorized"}'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'Anonymous writes must fail';
  execute 'reset role';
end;
$$;
select 'Team access, invitation rotation, 10-to-20 negotiation, version reset, and publication checks passed.' as result;
rollback;
