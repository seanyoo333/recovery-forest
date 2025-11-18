  CREATE OR REPLACE VIEW product_overview_view
  with (security_invoker=on)
  AS
  SELECT
    product_id,
    name,
    tagline,
    description,
    how_it_works,
    picture,
    url,
    stats->>'upvotes' AS upvotes,
    stats->>'views' AS views,
    stats->>'reviews' AS reviews,
    AVG(product_reviews.rating) AS average_rating,
    (SELECT EXISTS (SELECT 1 FROM public.product_upvotes WHERE product_upvotes.product_id = products.product_id AND product_upvotes.profile_id = auth.uid())) AS is_upvoted

FROM public.products
LEFT JOIN public.reviews AS product_reviews USING (product_id)
GROUP BY product_id;