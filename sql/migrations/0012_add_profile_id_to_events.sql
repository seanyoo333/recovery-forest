-- Add profile_id column to events table
ALTER TABLE events ADD COLUMN profile_id uuid;

-- Add foreign key constraint
ALTER TABLE events ADD CONSTRAINT events_profile_id_profiles_profile_id_fk 
FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE;

-- Update track_event function to include profile_id parameter
CREATE OR REPLACE FUNCTION track_event(
    event_type event_type,
    event_data jsonb,
    profile_id uuid default null
) returns void as $$
begin
    insert into events (event_type, event_data, profile_id) 
    values (event_type, event_data, profile_id);
end;
$$ language plpgsql security definer;

-- Update view trigger to handle profile_id
CREATE OR REPLACE FUNCTION public.handle_new_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN 
    -- product_view 이벤트만 처리
    IF NEW.event_type = 'product_view' THEN
        -- 로그인한 사용자만 처리 (profile_id가 있는 경우)
        IF NEW.profile_id IS NOT NULL THEN
            -- 같은 사용자가 같은 제품을 오늘 이미 조회했는지 확인
            IF NOT EXISTS (
                SELECT 1 FROM public.events 
                WHERE event_type = 'product_view' 
                AND profile_id = NEW.profile_id 
                AND event_data->>'product_id' = NEW.event_data->>'product_id'
                AND created_at >= CURRENT_DATE
                AND event_id != NEW.event_id
            ) THEN
                -- 하루에 한 번만 조회수 증가
                UPDATE public.products
                SET stats = jsonb_set(
                    stats,
                    '{views}',
                    ((stats->>'views')::int + 1)::text::jsonb
                )
                WHERE product_id = (NEW.event_data->>'product_id')::bigint;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$; 