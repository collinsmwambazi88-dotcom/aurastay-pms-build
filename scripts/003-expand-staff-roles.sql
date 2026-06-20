-- Migration: expand staff.role CHECK constraint to support all seven roles.
-- Run once; safe to re-run (constraint drop is idempotent with IF EXISTS).

BEGIN;

-- 1. Drop the old two-value constraint.
ALTER TABLE staff
  DROP CONSTRAINT IF EXISTS staff_role_check;

-- 2. Add the expanded constraint covering all seven roles.
ALTER TABLE staff
  ADD CONSTRAINT staff_role_check
  CHECK (role IN (
    'admin',
    'manager',
    'front_desk',
    'housekeeping',
    'maintenance',
    'revenue_manager',
    'accounting'
  ));

COMMIT;
