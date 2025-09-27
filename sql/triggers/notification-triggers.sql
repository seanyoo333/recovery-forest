CREATE FUNCTION public.notify_follow()
RETURNS TRIGGER
SECURITY DEFINER SET search_path =''
LANGUAGE plpgsql
AS $$
BEGIN 
    INSERT INTO public.notifications (type, source_id, target_id)
    VALUES ('follow', NEW.follower_id, NEW.following_id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER notify_follow_trigger
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE PROCEDURE public.notify_follow();


CREATE FUNCTION public.notify_review()
RETURNS TRIGGER
SECURITY DEFINER SET search_path =''
LANGUAGE plpgsql
AS $$
DECLARE
    product_owner uuid;
BEGIN 
    SELECT profile_id INTO product_owner FROM public.products WHERE product_id = NEW.product_id;
    INSERT INTO public.notifications (type, source_id, target_id)
    VALUES ('review', NEW.profile_id, product_owner);
    RETURN NEW;
EMD;
$$;

CREATE TRIGGER notify_review_trigger
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE PROCEDURE public.notify_review();


CREATE OR REPLACE FUNCTION public.notify_reply()
RETURNS TRIGGER
SECURITY DEFINER SET search_path =''
LANGUAGE plpgsql
AS $$
DECLARE
    post_owner uuid;
    parent_reply_owner uuid;
BEGIN
    -- 대댓글인 경우 (parent_id가 있음)
    IF NEW.parent_id IS NOT NULL THEN
        -- 부모 댓글의 작성자를 찾음
        SELECT profile_id INTO parent_reply_owner 
        FROM public.post_replies 
        WHERE post_reply_id = NEW.parent_id;
        
        -- 부모 댓글 작성자에게 알림
        IF parent_reply_owner IS NOT NULL THEN
            INSERT INTO public.notifications (type, source_id, target_id)
            VALUES ('reply', NEW.profile_id, parent_reply_owner);
        END IF;
    ELSE
        -- 최상위 댓글인 경우 (post_id가 있음)
        SELECT profile_id INTO post_owner FROM public.posts WHERE post_id = NEW.post_id;
        
        -- 게시글 작성자에게 알림 (자신이 아닌 경우에만)
        IF post_owner IS NOT NULL AND post_owner != NEW.profile_id THEN
            INSERT INTO public.notifications (type, source_id, target_id)
            VALUES ('reply', NEW.profile_id, post_owner);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER notify_reply_trigger
AFTER INSERT ON public.post_replies
FOR EACH ROW
EXECUTE PROCEDURE public.notify_reply();