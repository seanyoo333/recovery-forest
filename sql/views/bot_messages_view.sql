CREATE OR REPLACE VIEW bot_messages_view
with (security_invoker=on)
AS
SELECT
    m1.bot_message_room_id,
    profiles.name,
    (
        SELECT content
        FROM bot_messages
        WHERE bot_message_room_id = m1.bot_message_room_id
        ORDER BY bot_message_id DESC
        LIMIT 1
    ) AS last_message,
    (
        SELECT created_at
        FROM bot_messages
        WHERE bot_message_room_id = m1.bot_message_room_id
        ORDER BY bot_message_id DESC
        LIMIT 1
    ) AS last_time,
    m1.profile_id AS profile_id,
    m2.profile_id AS other_profile_id,
    profiles.avatar
FROM bot_message_room_members m1
INNER JOIN bot_message_room_members m2 ON m1.bot_message_room_id = m2.bot_message_room_id
INNER JOIN profiles ON profiles.profile_id = m2.profile_id
WHERE m1.is_hidden = false;