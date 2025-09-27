CREATE OR REPLACE FUNCTION public.handle_product_upvote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.products SET stats = jsonb_set(stats, '{upvotes}', ((stats->>'upvotes')::int + 1)::text::jsonb) WHERE product_id = NEW.product_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER product_upvote_trigger
AFTER INSERT ON public.product_upvotes
FOR EACH ROW EXECUTE FUNCTION public.handle_product_upvote();


CREATE OR REPLACE  FUNCTION public.handle_product_unvote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.products SET stats = jsonb_set(stats, '{upvotes}', ((stats->>'upvotes')::int - 1)::text::jsonb) WHERE product_id = OLD.product_id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER product_unvote_trigger
AFTER DELETE ON public.product_upvotes
FOR EACH ROW EXECUTE FUNCTION public.handle_product_unvote();