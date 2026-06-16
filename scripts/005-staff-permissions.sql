-- AuraStay: granular staff permissions
-- Replaces the three coarse boolean flags with a JSONB permission map.

ALTER TABLE staff ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Admins get full access.
UPDATE staff SET permissions = jsonb_build_object(
  'reservations.view', true, 'reservations.create', true, 'reservations.modify', true, 'reservations.cancel', true,
  'billing.invoices', true, 'billing.payments', true, 'billing.custom_charges', true,
  'stays.check_in', true, 'stays.check_out', true, 'stays.room_changes', true,
  'housekeeping.cleaning', true,
  'revenue.kpis', true, 'revenue.market', true,
  'rates.calendar', true, 'rates.plans', true
)
WHERE role = 'admin' AND permissions = '{}'::jsonb;

-- Front desk: baseline operations + mapping of the legacy boolean flags.
UPDATE staff SET permissions = jsonb_build_object(
  'reservations.view', true,
  'reservations.create', true,
  'reservations.modify', true,
  'reservations.cancel', false,
  'billing.invoices', true,
  'billing.payments', false,
  'billing.custom_charges', true,
  'stays.check_in', true,
  'stays.check_out', true,
  'stays.room_changes', COALESCE(can_manage_inventory, false),
  'housekeeping.cleaning', COALESCE(can_manage_inventory, true),
  'revenue.kpis', COALESCE(can_view_revenue, false),
  'revenue.market', COALESCE(can_view_revenue, false),
  'rates.calendar', COALESCE(can_manage_rates, false),
  'rates.plans', COALESCE(can_manage_rates, false)
)
WHERE role = 'front_desk' AND permissions = '{}'::jsonb;
