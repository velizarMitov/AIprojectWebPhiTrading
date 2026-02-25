-- ============================================
-- ADD TITLE FIELD TO NEWS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Add title column to news table
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS title TEXT;

-- Set a default title for existing news items (optional)
UPDATE public.news 
SET title = LEFT(content, 80) || '...'
WHERE title IS NULL AND LENGTH(content) > 80;

UPDATE public.news 
SET title = content
WHERE title IS NULL AND LENGTH(content) <= 80;

-- After this, you can make title NOT NULL if you want:
-- ALTER TABLE public.news ALTER COLUMN title SET NOT NULL;
