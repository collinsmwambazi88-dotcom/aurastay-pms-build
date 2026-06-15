-- AuraStay Admin & IAM
-- Adds property branding (logo) and staff/role management.

-- 1. Property branding
ALTER TABLE properties ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Staff & IAM
CREATE TABLE IF NOT EXISTS staff (
  id                   SERIAL PRIMARY KEY,
  property_id          INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  full_name            VARCHAR(120) NOT NULL,
  email                VARCHAR(160) NOT NULL,
  role                 VARCHAR(16) NOT NULL DEFAULT 'front_desk'
                       CHECK (role IN ('admin','front_desk')),
  status               VARCHAR(12) NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','invited')),
  can_view_revenue     BOOLEAN NOT NULL DEFAULT false,
  can_manage_rates     BOOLEAN NOT NULL DEFAULT false,
  can_manage_inventory BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, email)
);
CREATE INDEX IF NOT EXISTS idx_staff_property ON staff(property_id);

-- 3. Seed staff for existing properties (idempotent)
INSERT INTO staff (property_id, full_name, email, role, status, can_view_revenue, can_manage_rates, can_manage_inventory)
SELECT p.id, 'Amara Okafor', 'amara@' || lower(replace(p.name, ' ', '')) || '.com', 'admin', 'active', true, true, true
FROM properties p
ON CONFLICT (property_id, email) DO NOTHING;

INSERT INTO staff (property_id, full_name, email, role, status, can_view_revenue, can_manage_rates, can_manage_inventory)
SELECT p.id, 'Liam Bennett', 'liam@' || lower(replace(p.name, ' ', '')) || '.com', 'front_desk', 'active', false, false, true
FROM properties p
ON CONFLICT (property_id, email) DO NOTHING;

INSERT INTO staff (property_id, full_name, email, role, status, can_view_revenue, can_manage_rates, can_manage_inventory)
SELECT p.id, 'Sofia Rossi', 'sofia@' || lower(replace(p.name, ' ', '')) || '.com', 'front_desk', 'invited', false, false, false
FROM properties p
ON CONFLICT (property_id, email) DO NOTHING;
