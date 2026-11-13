-- =============================================================================
-- SUPER QUERY: Check ALL Photos from Supabase Storage and Database
-- =============================================================================
-- Run this query in Supabase SQL Editor to verify:
-- 1. Which bucket has photos (dokumentasi vs kegiatan-internal-kantor-photos)
-- 2. How many photos per activity (from table vs bucket)
-- 3. What's the total count of all photos
-- 4. Missing photos explanation

-- =============================================================================
-- SECTION 1: Check Storage Buckets Status
-- =============================================================================

-- Check if buckets exist
SELECT
    b.id as bucket_id,
    b.name,
    b.public,
    b.file_size_limit,
    array_length(b.allowed_mime_types || '[""]', 'cardinality') as mime_count
FROM storage.buckets AS b
ORDER BY b.id;

-- =============================================================================
-- SECTION 2: Check Activities with Photos Count from Bucket
-- =============================================================================

-- Get activities grouped by unitkerja with count from bucket "dokumentasi"
SELECT
    k.id,
    k.judul,
    k.sub_judul,
    k.jenis_kegiatan,
    k.cerita_kegiatan,
    k.image_path as main_image_path,
    k.image_url as main_image_url,
    coalesce(k.photos, '[]')::jsonb as photos_array_from_db,
    COALESCE((SELECT json_agg(json_build_object('path', name)) FROM storage.objects WHERE bucket_id = 'dokumentasi' AND name LIKE '%-' || k.judul || '-' || replace(k.tanggal_kegiatan::text, 'T', '-') || '-'), '[]')::jsonb as photos_from_bucket_dokumentasi
FROM public.kegiatan_internal_kantor AS k
WHERE k.published = true
ORDER BY k.tanggal_kegiatan DESC;

-- =============================================================================
-- SECTION 3: Check Activity Photos Count from Relasi Table
-- =============================================================================

-- Get photo count per activity dari tabel relasi kegiatan_internal_photos
SELECT
    kp.kegiatan_id as activity_uuid,
    (SELECT COALESCE((SELECT COUNT(*) FROM kegiatan_internal_photos WHERE kegiatan_id = k.id), 0)
     FROM kegiatan_internal_kantor AS k
     WHERE k.id = kp.kegiatan_id AND k.published = true) as photo_count_from_relasi,
    kp.storage_path as storage_path,
    kp.storage_url as storage_url,
    kp.urutan as sequence_order
FROM public.kegiatan_internal_photos AS kp
INNER JOIN public.kegiatan_internal_kantor AS k ON kp.kegiatan_id = k.id
WHERE k.published = true
ORDER BY kp.kegiatan_id, kp.urutan;

-- =============================================================================
-- SECTION 4: Check Photos from Both Buckets
-- =============================================================================

-- Get photos from dokumentasi bucket grouped by filename (pattern extract activity name)
SELECT
    f.name as photo_filename,
    f.created_at,
    CASE
        WHEN f.name LIKE '%-%-%' THEN
            SUBSTRING(f.name FROM 1 FOR POSITION('-', f.name) - 1) || '-'
            || SUBSTRING(f.name FROM POSITION('-', f.name)+2 FOR POSITION('-', f.name)-POSITION('-', f.name)-2) || '-'
            || SUBSTRING(f.name FROM POSITION('-', f.name)+3)
        ELSE 'UNKNOWN'
    END as extracted_activity_name
FROM storage.objects AS f
WHERE f.bucket_id = 'dokumentasi'
  AND f.name LIKE '%-%-'
ORDER BY f.created_at DESC;

-- =============================================================================
-- SECTION 5: Find Activities with Photos from Bucket but NOT in Relasi Table
-- =============================================================================

-- Photos exist in bucket but not linked to activity table (potential lost photos!)
SELECT
    s.name as missing_photo_filename,
    s.created_at as photo_timestamp,
    CASE WHEN s.name LIKE '%-%-phot%' THEN 'PHOTO FILE' ELSE 'UNKNOWN' END as photo_type,
    EXTRACT(EPOCH FROM current_timestamp - s.created_at) / 86400 || ' days ago' as upload_ago_days
FROM storage.objects AS s
WHERE s.bucket_id = 'dokumentasi'
  AND NOT EXISTS (SELECT 1 FROM kegiatan_internal_photos WHERE storage_path = s.name)
ORDER BY EXTRACT(EPOCH FROM current_timestamp - s.created_at) DESC;

-- =============================================================================
-- SECTION 6: Find Activities with Photos in Relasi but NOT in Bucket
-- =============================================================================

-- Photos in relasi table but not uploaded to bucket (potential sync failures)
SELECT
    kp.kegiatan_id as activity_uuid,
    (SELECT k.judul FROM kegiatan_internal_kantor AS k WHERE k.id = kp.kegiatan_id) as activity_title,
    kp.storage_path as stored_path,
    EXTRACT(EPOCH FROM current_timestamp - kp.created_at) / 86400 || ' days ago' as storage_ago_days
FROM public.kegiatan_internal_photos AS kp
INNER JOIN public.kegiatan_internal_kantor AS k ON kp.kegiatan_id = k.id
WHERE NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'dokumentasi' AND name = kp.storage_path)
ORDER BY EXTRACT(EPOCH FROM current_timestamp - kp.created_at) DESC;

-- =============================================================================
-- SECTION 7: Total Photo Count Summary per Activity
-- =============================================================================

-- Get total photos per activity (from relasi table + bucket matching logic)
SELECT
    k.id,
    k.judul,
    k.sub_judul,
    k.tanggal_kegiatan as activity_date,
    k.jenis_kegiatan,
    COALESCE((SELECT COUNT(*) FROM kegiatan_internal_photos WHERE kegiatan_id = k.id), 0) +
    (CASE WHEN COALESCE((SELECT jsonb_array_length(p.photos) FROM kegiatan_internal_kantor AS k2 WHERE k2.id = k.id AND k2.published = true)::int, 0) > 0 THEN 1 ELSE 0 END) as total_photos_count,
    'Relasi Table' || CASE WHEN COALESCE((SELECT COUNT(*) FROM kegiatan_internal_photos WHERE kegiatan_id = k.id) > 0 THEN '_YES' ELSE '_NO' END || (CASE WHEN COALESCE((SELECT jsonb_array_length(p.photos) FROM kegiatan_internal_kantor AS k2 WHERE k2.id = k.id AND k2.published = true)::int, 0) > 0 THEN ' + Bucket Array YES' ELSE ' + Bucket Array NO' END) as source_status
FROM public.kegiatan_internal_kantor AS k
WHERE k.published = true
ORDER BY COALESCE((SELECT COUNT(*) FROM kegiatan_internal_photos WHERE kegiatan_id = k.id), 0) DESC, k.tanggal_kegiatan DESC;

-- =============================================================================
-- SECTION 8: Identify Photo Matching Issues
-- =============================================================================

-- Photos in bucket with no matching activity (sync issues or orphan photos)
SELECT
    f.name as orphan_photo_filename,
    f.created_at,
    EXTRACT(EPOCH FROM current_timestamp - f.created_at) / 86400 || ' days ago' as upload_ago
FROM storage.objects AS f
WHERE f.bucket_id = 'dokumentasi'
  AND NOT EXISTS (SELECT k.id
                   FROM kegiatan_internal_kantor AS k
                   WHERE k.judul LIKE '%%' || f.name || '%'
                       OR f.name LIKE '%-%-phot-' || replace(f.name, '-', '%') || '%'
                   LIMIT 1)
ORDER BY EXTRACT(EPOCH FROM current_timestamp - f.created_at) DESC;

-- =============================================================================
-- SECTION 9: Check if Both Buckets Have Photos
-- =============================================================================

-- Verify both buckets have photos and their counts
SELECT
    'dokumentasi' as bucket_name,
    COUNT(*) as photo_count
FROM storage.objects
WHERE bucket_id = 'dokumentasi' AND name LIKE '%-phot-%'
UNION ALL
SELECT
    'kegiatan-internal-kantor-photos' as bucket_name,
    COUNT(*) as photo_count
FROM storage.objects
WHERE bucket_id = 'kegiatan-internal-kantor-photos' AND name LIKE '%-phot-%';

-- =============================================================================
-- SECTION 10: Fix Recommendations (Run AFTER checking issues)
-- =============================================================================

-- If missing photos found, create index for faster matching
CREATE INDEX IF NOT EXISTS fotos_kegiatan_idx ON kegiatan_internal_photos(kegiatan_id);

-- Create trigger to auto-link photos when uploaded
DROP TRIGGER IF EXISTS link_photos_on_upload ON storage.objects;
CREATE OR REPLACE FUNCTION link_photos_to_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_uuid UUID := NULL::uuid;
BEGIN
    -- If photo path contains activity info, try to link it
    IF NEW.name LIKE '%-%-phot-%' THEN
        -- Extract activity name from filename pattern
        -- This is simplified - use proper parsing logic if needed
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER link_photos_on_upload
AFTER INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION link_photos_to_activity();

-- Create index on activity dates for efficient matching
CREATE INDEX IF NOT EXISTS kegiatan_internal_kantor_date_idx
    ON public.kegiatan_internal_kantor (tanggal_kegiatan DESC);

-- =============================================================================
-- SUMMARY: Check and Fix Missing Photos
-- =============================================================================

-- Run the following to ensure both buckets are properly configured:
-- Insert bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('kegiatan-internal-kantor-photos', 'kegiatan-internal-kantor-photos', true, 8388608)
ON CONFLICT DO NOTHING;

-- Grant proper access policies for both buckets
DROP POLICY IF EXISTS "Public can read semua foto kegiatan" ON storage.objects;
CREATE POLICY "Public can read semua foto kegiatan"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id IN ('dokumentasi', 'kegiatan-internal-kantor-photos'));

-- Grant proper access policies for relasi table
DROP POLICY IF EXISTS "Everyone has read and view access" ON public.kegiatan_internal_photos;
CREATE POLICY "Everyone has read and view access"
    ON public.kegiatan_internal_photos FOR SELECT TO anon, authenticated
    USING (true);

-- =============================================================================
-- END OF QUERY
-- =============================================================================
