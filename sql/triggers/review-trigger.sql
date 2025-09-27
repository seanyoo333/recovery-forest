CREATE FUNCTION public.handle_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN 
    UPDATE public.products
    SET stats = jsonb_set(
        stats,
        '{reviews}',
        ((stats->>'reviews')::int + 1)::text::jsonb
    )
WHERE product_id = NEW.product_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER new_review_trigger
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.handle_new_review();