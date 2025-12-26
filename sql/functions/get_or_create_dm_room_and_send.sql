create or replace function public.get_or_create_dm_room_and_send(
  p_to_user_id uuid,
  p_content text
)
returns table (message_room_id bigint, message_id bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from uuid := auth.uid();
  v_room_id bigint;
  v_message_id bigint;
begin
  if v_from is null then
    raise exception 'Not authenticated';
  end if;

  if p_to_user_id is null then
    raise exception 'to_user_id is required';
  end if;

  if p_content is null or length(trim(p_content)) = 0 then
    raise exception 'content is required';
  end if;

  -- 1) 기존 DM 방 찾기 (두 멤버가 모두 있는 방)
  select m1.message_room_id into v_room_id
  from public.message_room_members m1
  join public.message_room_members m2
    on m1.message_room_id = m2.message_room_id
  where m1.profile_id = v_from
    and m2.profile_id = p_to_user_id
  limit 1;

  -- 2) 없으면 생성 + 멤버 2명 추가
  if v_room_id is null then
    insert into public.message_rooms default values
    returning message_room_id into v_room_id;

    insert into public.message_room_members(message_room_id, profile_id, is_hidden, is_read)
    values
      (v_room_id, v_from, false, true),
      (v_room_id, p_to_user_id, false, false);
  else
    -- 3) 있으면 내 멤버십만 활성화/읽음 처리(본인 row만 건드림: RLS-friendly)
    update public.message_room_members
    set is_hidden = false,
        is_read = true
    where message_room_id = v_room_id
      and profile_id = v_from;
  end if;

  -- 4) 메시지 insert
  insert into public.messages(message_room_id, sender_id, content)
  values (v_room_id, v_from, p_content)
  returning message_id into v_message_id;

  return query select v_room_id, v_message_id;
end;
$$;

grant execute on function public.get_or_create_dm_room_and_send(uuid, text) to authenticated;