-- ============================================
-- ADD FULL_NAME AND USERNAME TO PROFILES TABLE
-- ============================================

-- Add full_name column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add username column with UNIQUE constraint
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;

-- Add index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Optional: Add comments for documentation
COMMENT ON COLUMN profiles.full_name IS 'User''s full name for display purposes';
COMMENT ON COLUMN profiles.username IS 'Unique username for identification';
