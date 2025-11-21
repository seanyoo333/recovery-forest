drop function if exists public.handle_new_user() CASCADE;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.raw_app_meta_data is not null then
        if new.raw_app_meta_data ? 'provider' AND new.raw_app_meta_data ->> 'provider' = 'email' OR new.raw_app_meta_data ->> 'provider' ='phone' then
           if new.raw_user_meta_data ? 'name' and new.raw_user_meta_data ? 'username' then 
            insert into public.profiles (profile_id, name, username, role, marketing_consent)
            values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'username', (new.raw_user_meta_data ->> 'role')::user_role, (new.raw_user_meta_data ->> 'marketing_consent')::boolean);
           else
            insert into public.profiles (profile_id, name, username, role, marketing_consent)
            values (new.id, 'Anonymous', 'mr.' || substr(md5(random()::text), 1, 8), 'other', true);
        end if;
    end if;

        if new.raw_app_meta_data ? 'provider' AND new.raw_app_meta_data ->> 'provider' = 'kakao' then
            insert into public.profiles (profile_id, name, username, role, avatar, marketing_consent)
            values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'preferred_username' || substr(md5(random()::text), 1, 5), 'other', new.raw_user_meta_data ->> 'avatar_url', true);
        end if;

        if new.raw_app_meta_data ? 'provider' AND new.raw_app_meta_data ->> 'provider' = 'github' then
            insert into public.profiles (profile_id, name, username, role, avatar)
            values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'user_name' || substr(md5(random()::text), 1, 5), 'other', new.raw_user_meta_data ->> 'avatar_url', true);
        end if;

        if new.raw_app_meta_data ? 'provider' AND new.raw_app_meta_data ->> 'provider' = 'google' then
            insert into public.profiles (profile_id, name, username, role, avatar)
            values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'preferred_username' || substr(md5(random()::text), 1, 5), 'other', new.raw_user_meta_data ->> 'avatar_url', true);
        end if;
   
    end if;
    return new;
end;
$$;

create or replace trigger handle_sign_up
after insert on auth.users
for each row execute function public.handle_new_user();