-- ============================================
-- PHI TRADING DATABASE SCHEMA
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    tier VARCHAR(50) DEFAULT 'Bronze' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile (optional)
CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- RLS Policy: Allow INSERT when user registers (triggered automatically)
CREATE POLICY "Enable insert for authenticated users"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ============================================
-- PREDICTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('Forex', 'Crypto', 'Stocks', 'ML')),
    asset VARCHAR(100) NOT NULL,
    prediction_text TEXT NOT NULL,
    required_tier VARCHAR(50) DEFAULT 'Bronze' CHECK (required_tier IN ('Bronze', 'Silver', 'Gold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can SELECT predictions
CREATE POLICY "Authenticated users can view predictions"
    ON predictions
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policy: Only admins can INSERT predictions
CREATE POLICY "Only admins can insert predictions"
    ON predictions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policy: Only admins can UPDATE predictions
CREATE POLICY "Only admins can update predictions"
    ON predictions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policy: Only admins can DELETE predictions
CREATE POLICY "Only admins can delete predictions"
    ON predictions
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, tier)
    VALUES (NEW.id, 'user', 'Bronze');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- OPTIONAL: Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to predictions
CREATE TRIGGER update_predictions_updated_at
    BEFORE UPDATE ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_predictions_category ON predictions(category);
CREATE INDEX IF NOT EXISTS idx_predictions_tier ON predictions(required_tier);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);

-- ============================================
-- NEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read news
CREATE POLICY "Anyone can view news"
    ON news
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- RLS Policy: Only admins can INSERT news
CREATE POLICY "Admins can insert news"
    ON news
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policy: Only admins can UPDATE news
CREATE POLICY "Admins can update news"
    ON news
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policy: Only admins can DELETE news
CREATE POLICY "Admins can delete news"
    ON news
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================
-- Uncomment below to add sample predictions
/*
INSERT INTO predictions (category, asset, prediction_text, required_tier) VALUES
('Crypto', 'BTC/USD', 'Our ML model predicts a bullish breakout above $98,500 in the next 48 hours based on institutional order flow.', 'Bronze'),
('Forex', 'EUR/USD', 'Technical analysis shows a potential reversal at 1.0520. Entry zone: 1.0520-1.0550, Stop Loss: 1.0480, Target: 1.0650', 'Silver'),
('Stocks', 'AAPL', 'Mid-cap tech stocks showing 12% improvement in volatility prediction. Watch key support at $175.', 'Gold'),
('ML', 'General Market', 'Deployed Oberon-7 model now live. Backtesting shows significant improvement in equity prediction accuracy.', 'Bronze');
*/
