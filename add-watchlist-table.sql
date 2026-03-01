-- ============================================
-- MIGRATION: Add Watchlist Table
-- PHI TRADING — 4th Database Table
-- Relationship: One-to-Many (profiles → watchlist)
-- ============================================

-- ============================================
-- WATCHLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS watchlist (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    asset_symbol  VARCHAR(50) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Prevent the same user from adding the same asset twice
    CONSTRAINT uq_user_asset UNIQUE (user_id, asset_symbol)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index: fast lookups of a user's watchlist
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id
    ON watchlist(user_id);

-- Index: filter/sort predictions by category (query optimisation)
CREATE INDEX IF NOT EXISTS idx_predictions_category
    ON predictions(category);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only see their own watchlist rows
CREATE POLICY "Users can view own watchlist"
    ON watchlist
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- INSERT: users can only add rows for themselves
CREATE POLICY "Users can insert into own watchlist"
    ON watchlist
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- DELETE: users can only remove their own rows
CREATE POLICY "Users can delete own watchlist entries"
    ON watchlist
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
