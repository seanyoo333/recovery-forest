create or replace function track_event(
    event_type event_type,
    event_data jsonb,
    profile_id uuid default null
) returns void as $$
begin
    insert into events (event_type, event_data, profile_id) 
    values (event_type, event_data, profile_id);
end;
$$ language plpgsql security definer;