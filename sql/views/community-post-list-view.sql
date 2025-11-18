CREATE or REPLACE VIEW community_post_list_view
with (security_invoker=on)
AS
SELECT
    posts.post_id,
    posts.title,
    posts.created_at,
    posts.is_markdown,
    topics.name AS topic,
    profiles.name AS author_name,
    profiles.avatar AS author_avatar,
    profiles.username AS author_username,
    posts.upvotes,
    topics.slug AS topic_slug,
    CASE 
        WHEN auth.uid() IS NULL THEN false
        ELSE EXISTS (
            SELECT 1 FROM public.post_upvotes 
            WHERE post_upvotes.post_id = posts.post_id 
            AND post_upvotes.profile_id = auth.uid()
        )
    END AS is_upvoted
FROM posts
INNER JOIN topics USING (topic_id)
INNER JOIN profiles USING (profile_id)
LEFT JOIN post_upvotes USING (post_id)
GROUP BY posts.post_id, posts.title, posts.created_at, posts.is_markdown, topics.name, topics.slug, profiles.name, profiles.avatar, profiles.username;