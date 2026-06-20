-- Add creator_email to properties so the Portal can scope "Your Properties"
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS creator_email VARCHAR(160);

-- Index for portal query: find properties by creator email quickly
CREATE INDEX IF NOT EXISTS idx_properties_creator_email ON properties(creator_email);
