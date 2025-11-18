-- 포스트 작성 시 프로필의 작성글 수를 증가시키는 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_post_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- 프로필의 post_count를 1 증가
    UPDATE public.profiles
    SET post_count = post_count + 1
    WHERE profile_id = NEW.profile_id;
    RETURN NEW;
END;
$$;

-- 포스트 삭제 시 프로필의 작성글 수를 감소시키는 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_post_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- 프로필의 post_count를 1 감소 (최소값은 0)
    UPDATE public.profiles
    SET post_count = GREATEST(post_count - 1, 0)
    WHERE profile_id = OLD.profile_id;
    RETURN OLD;
END;
$$;

-- 포스트 INSERT 트리거
CREATE TRIGGER post_insert_trigger
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.handle_post_insert();

-- 포스트 DELETE 트리거
CREATE TRIGGER post_delete_trigger
AFTER DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.handle_post_delete();

