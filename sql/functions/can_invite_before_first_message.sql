create or replace function public.can_invite_before_first_message(p_room_id bigint, p_inviter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    public.is_user_member(p_room_id, p_inviter_id)
    and not exists (
      select 1 from public.messages msg
      where msg.message_room_id = p_room_id
    );
$$;