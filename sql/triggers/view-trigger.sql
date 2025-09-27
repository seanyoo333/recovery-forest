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

CREATE TRIGGER new_view_trigger
AFTER INSERT ON public.events
FOR EACH ROW
WHEN (NEW.event_type = 'product_view')
EXECUTE FUNCTION public.handle_new_view();