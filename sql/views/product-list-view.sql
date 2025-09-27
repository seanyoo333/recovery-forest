CREATE OR REPLACE VIEW product_list_view AS
SELECT
    product_id,
    name,
    tagline,
    stats->>'upvotes' as upvotes,
    stats->>'views' as views,
    stats->>'reviews' as reviews,
    (SELECT EXISTS (SELECT 1 FROM public.product_upvotes WHERE product_upvotes.product_id = products.product_id AND product_upvotes.profile_id = auth.uid())) AS is_upvoted,
    created_at,
    stats,
    promoted_from
FROM products;