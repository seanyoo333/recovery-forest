create function public.increment_follow_counters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

    update public.profiles
    set stats = jsonb_set(stats, '{followers}', ((stats->>'followers')::int + 1)::text::jsonb)
    where profile_id = new.following_id;

    update public.profiles
    set stats = jsonb_set(stats, '{following}', ((stats->>'following')::int + 1)::text::jsonb)
    where profile_id = new.follower_id;

    return new;
end;
$$;

create trigger follow_trigger
after insert on public.follows
for each row execute function public.increment_follow_counters();


create function public.decrement_follow_counters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

    update public.profiles
    set stats = jsonb_set(stats, '{followers}', ((stats->>'followers')::int - 1)::text::jsonb)
    where profile_id = old.following_id;

    update public.profiles
    set stats = jsonb_set(stats, '{following}', ((stats->>'following')::int - 1)::text::jsonb)
    where profile_id = old.follower_id;

    return old;
end;
$$;

create trigger unfollow_trigger
after delete on public.follows
for each row execute function public.decrement_follow_counters();



