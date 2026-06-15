-- Advanced tax logic: per-property tax rate (percentage applied to room + add-on charges)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0;

-- Seed a sensible default for existing properties that have not configured one.
UPDATE properties SET tax_rate = 12.00 WHERE tax_rate = 0;
