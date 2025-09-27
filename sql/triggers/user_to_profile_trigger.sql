create function public.handle_new_user()
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
            values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'username', 'patient', (new.raw_user_meta_data ->> 'marketing_consent')::boolean);
           else
            insert into public.profiles (profile_id, name, username, role, marketing_consent)
            values (new.id, 'Anonymous', 'mr.' || substr(md5(random()::text), 1, 8), 'patient', true);
        end if;
    end if;

        if new.raw_app_meta_data ? 'provider' AND new.raw_app_meta_data ->> 'provider' = 'kakao' then
            insert into public.profiles (profile_id, name, username, role, avatar, marketing_consent)
            values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'preferred_username', || substr(md5(random()::text), 1, 5), 'patient', new.raw_user_meta_data ->> 'avatar_url', true);
        end if;

        if new.raw_app_meta_data ? 'provider' AND new.raw_app_meta_data ->> 'provider' = 'github' then
            insert into public.profiles (profile_id, name, username, role, avatar)
            values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'user_name' || substr(md5(random()::text), 1, 5), 'patient', new.raw_user_meta_data ->> 'avatar_url', true);
        end if;
   
    end if;
    return new;
end;
$$;

create trigger user_to_profile_trigger
after insert on auth.users
for each row execute function public.handle_new_user();