-- Add website configuration storage to properties table
ALTER TABLE properties ADD COLUMN website_config JSONB DEFAULT NULL;

-- Index for filtering properties with website config
CREATE INDEX idx_properties_website_config ON properties(id) WHERE website_config IS NOT NULL;
