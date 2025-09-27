create or replace view profiles_view as
select
  *,
  (SELECT EXISTS (SELECT 1 FROM public.follows WHERE following_id = profiles.profile_id AND follower_id = auth.uid())) as is_following
from profiles;