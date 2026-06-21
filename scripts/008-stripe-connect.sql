-- Add Stripe Connect fields to properties table
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS stripe_account_id         VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN      NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_properties_stripe_account ON properties(stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;
