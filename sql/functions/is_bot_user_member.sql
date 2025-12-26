create or replace function public.is_bot_user_member(p_room_id bigint, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.bot_message_room_members bmrm
    where bmrm.bot_message_room_id = p_room_id
      and bmrm.profile_id = p_profile_id
  );
$$;

