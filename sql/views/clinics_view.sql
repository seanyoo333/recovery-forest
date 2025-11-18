DROP VIEW IF EXISTS clinics_view;
CREATE OR REPLACE VIEW clinics_view
with (security_invoker=on)
AS
SELECT
    c.clinic_id,
    c.clinic_boss,
    c.clinic_name,
    c.clinic_logo,
    c.clinic_location,
    c.clinic_type,
    c.location,
    c.level,
    c.position,
    c.overview,
    c.responsibilities,
    c.qualifications,
    c.benefits,
    c.skills,
    c.apply_url,
    c.created_at,
    c.updated_at,
    -- Primary photo information
    cp_primary.photo_url AS primary_photo_url,
    cp_primary.photo_title AS primary_photo_title,
    cp_primary.photo_description AS primary_photo_description,
    cp_primary.photo_type AS primary_photo_type,
    -- Photo count
    (SELECT COUNT(*) FROM clinic_photos WHERE clinic_id = c.clinic_id) AS photo_count
FROM clinics c
LEFT JOIN clinic_photos cp_primary ON c.clinic_id = cp_primary.clinic_id AND cp_primary.is_primary = true;


