-- Seed data for AuraStay. Dates are relative to CURRENT_DATE so the Gantt
-- and market charts always show a live 14-day window.

-- ---------- Properties ----------
INSERT INTO properties (name, city, currency, timezone) VALUES
  ('AuraStay Downtown', 'New York', 'USD', 'America/New_York'),
  ('AuraStay Resort',   'Miami',    'USD', 'America/New_York');

-- ---------- Room Groups ----------
INSERT INTO room_groups (property_id, name, description, base_capacity, max_capacity)
SELECT id, g.name, g.description, g.base_capacity, g.max_capacity
FROM properties p
CROSS JOIN (VALUES
  ('Standard Queen', 'Comfortable queen room with city views', 2, 3),
  ('Deluxe King',    'Spacious king room with premium amenities', 2, 3),
  ('Executive Suite','Separate living area, complimentary lounge access', 2, 4)
) AS g(name, description, base_capacity, max_capacity)
WHERE p.name = 'AuraStay Downtown';

INSERT INTO room_groups (property_id, name, description, base_capacity, max_capacity)
SELECT id, g.name, g.description, g.base_capacity, g.max_capacity
FROM properties p
CROSS JOIN (VALUES
  ('Garden View',    'Ground floor rooms overlooking the gardens', 2, 3),
  ('Ocean Deluxe',   'Balcony rooms with direct ocean views', 2, 4),
  ('Beach Villa',    'Private villa with plunge pool', 2, 6)
) AS g(name, description, base_capacity, max_capacity)
WHERE p.name = 'AuraStay Resort';

-- ---------- Rooms ----------
-- Downtown: floors 1-3, 4 rooms per group
INSERT INTO rooms (room_group_id, room_number, floor, status)
SELECT rg.id,
       (100 * (1 + (n.i / 4)) + (n.i % 4) + 1)::text,
       1 + (n.i / 4),
       (ARRAY['clean','clean','occupied','dirty'])[1 + (n.i % 4)]
FROM room_groups rg
JOIN properties p ON p.id = rg.property_id AND p.name = 'AuraStay Downtown'
CROSS JOIN generate_series(0, 3) AS n(i);

-- Resort
INSERT INTO rooms (room_group_id, room_number, floor, status)
SELECT rg.id,
       (200 * (1 + (n.i / 4)) + (n.i % 4) + 1)::text,
       1 + (n.i / 4),
       (ARRAY['clean','occupied','clean','dirty'])[1 + (n.i % 4)]
FROM room_groups rg
JOIN properties p ON p.id = rg.property_id AND p.name = 'AuraStay Resort'
CROSS JOIN generate_series(0, 3) AS n(i);

-- ---------- Rate Calendars (14 day window) ----------
INSERT INTO rate_calendars (room_group_id, stay_date, base_rate)
SELECT rg.id,
       d::date,
       CASE rg.name
         WHEN 'Standard Queen'  THEN 159
         WHEN 'Deluxe King'     THEN 219
         WHEN 'Executive Suite' THEN 389
         WHEN 'Garden View'     THEN 189
         WHEN 'Ocean Deluxe'    THEN 299
         WHEN 'Beach Villa'     THEN 549
         ELSE 200
       END
       -- weekend uplift
       + CASE WHEN EXTRACT(DOW FROM d) IN (5,6) THEN 40 ELSE 0 END
FROM room_groups rg
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', INTERVAL '1 day') AS d;

-- ---------- Add-ons ----------
INSERT INTO addons (property_id, name, price)
SELECT id, a.name, a.price
FROM properties p
CROSS JOIN (VALUES
  ('Breakfast Buffet', 28.00),
  ('Spa Access', 65.00),
  ('Airport Transfer', 90.00),
  ('Late Checkout', 45.00)
) AS a(name, price);

-- ---------- Rate Plans ----------
INSERT INTO rate_plans (property_id, name, description, adjustment_type, adjustment_value, includes_breakfast, refundable)
SELECT id, rp.name, rp.description, rp.adjustment_type, rp.adjustment_value, rp.includes_breakfast, rp.refundable
FROM properties p
CROSS JOIN (VALUES
  ('Best Flexible Rate', 'Fully refundable standard rate', 'fixed', 0.00, false, true),
  ('Bed & Breakfast', 'Includes daily breakfast buffet', 'fixed', 25.00, true, true),
  ('Non-Refundable', 'Prepaid, no cancellation. 10% off base.', 'percentage', -10.00, false, false),
  ('Advance Purchase', 'Book 14 days ahead for 15% off', 'percentage', -15.00, false, false)
) AS rp(name, description, adjustment_type, adjustment_value, includes_breakfast, refundable);

-- ---------- Guests ----------
INSERT INTO guests (property_id, full_name, email, phone, id_type, id_number)
SELECT p.id, g.full_name, g.email, g.phone, g.id_type, g.id_number
FROM properties p
CROSS JOIN (VALUES
  ('Eleanor Whitman', 'eleanor.w@example.com', '+1 212 555 0142', 'Passport', 'P8841203'),
  ('Marcus Chen',     'm.chen@example.com',    '+1 415 555 0188', 'Drivers License', 'D5520981'),
  ('Sofia Alvarez',   'sofia.a@example.com',   '+1 305 555 0119', 'Passport', 'P2290845'),
  ('James O''Connor',  'james.oc@example.com', '+1 617 555 0173', 'National ID', 'N7741256'),
  ('Priya Nair',      'priya.nair@example.com','+1 646 555 0150', 'Passport', 'P6610337')
) AS g(full_name, email, phone, id_type, id_number)
WHERE p.name = 'AuraStay Downtown';

-- ---------- Reservations + Stays + Invoices (Downtown) ----------
-- Reservation 1: Eleanor, single room, checked in
DO $$
DECLARE
  v_prop INT;
  v_guest INT;
  v_plan INT;
  v_res INT;
  v_room INT;
  v_group INT;
  v_inv INT;
  v_rate NUMERIC;
BEGIN
  SELECT id INTO v_prop FROM properties WHERE name = 'AuraStay Downtown';

  -- === Reservation 1: Eleanor Whitman, Deluxe King, currently checked-in ===
  SELECT id INTO v_guest FROM guests WHERE full_name = 'Eleanor Whitman' AND property_id = v_prop;
  SELECT id INTO v_plan FROM rate_plans WHERE name = 'Bed & Breakfast' AND property_id = v_prop;
  SELECT rg.id INTO v_group FROM room_groups rg WHERE rg.property_id = v_prop AND rg.name = 'Deluxe King';
  SELECT r.id INTO v_room FROM rooms r WHERE r.room_group_id = v_group ORDER BY r.id LIMIT 1;
  v_rate := 244;

  INSERT INTO reservations (property_id, guest_id, rate_plan_id, status, check_in, check_out)
  VALUES (v_prop, v_guest, v_plan, 'checked_in', CURRENT_DATE - 1, CURRENT_DATE + 2)
  RETURNING id INTO v_res;
  INSERT INTO stays (reservation_id, room_id, room_group_id, check_in, check_out, nightly_rate, guests_count, status)
  VALUES (v_res, v_room, v_group, CURRENT_DATE - 1, CURRENT_DATE + 2, v_rate, 2, 'checked_in');
  INSERT INTO invoices (reservation_id, status, total) VALUES (v_res, 'pending', v_rate*3 + 56) RETURNING id INTO v_inv;
  INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price, amount) VALUES
    (v_inv, 'Deluxe King - 3 nights', 'room', 3, v_rate, v_rate*3),
    (v_inv, 'Breakfast Buffet', 'addon', 2, 28, 56);

  -- === Reservation 2: Marcus Chen, multi-room family (2 stays), confirmed ===
  SELECT id INTO v_guest FROM guests WHERE full_name = 'Marcus Chen' AND property_id = v_prop;
  SELECT id INTO v_plan FROM rate_plans WHERE name = 'Best Flexible Rate' AND property_id = v_prop;
  INSERT INTO reservations (property_id, guest_id, rate_plan_id, status, check_in, check_out)
  VALUES (v_prop, v_guest, v_plan, 'confirmed', CURRENT_DATE + 2, CURRENT_DATE + 6)
  RETURNING id INTO v_res;
  INSERT INTO invoices (reservation_id, status, total) VALUES (v_res, 'pending', 0) RETURNING id INTO v_inv;

  -- stay A: Standard Queen
  SELECT rg.id INTO v_group FROM room_groups rg WHERE rg.property_id = v_prop AND rg.name = 'Standard Queen';
  SELECT r.id INTO v_room FROM rooms r WHERE r.room_group_id = v_group ORDER BY r.id LIMIT 1;
  v_rate := 159;
  INSERT INTO stays (reservation_id, room_id, room_group_id, check_in, check_out, nightly_rate, guests_count, status)
  VALUES (v_res, v_room, v_group, CURRENT_DATE + 2, CURRENT_DATE + 6, v_rate, 2, 'confirmed');
  INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price, amount)
  VALUES (v_inv, 'Standard Queen - 4 nights', 'room', 4, v_rate, v_rate*4);

  -- stay B: Executive Suite
  SELECT rg.id INTO v_group FROM room_groups rg WHERE rg.property_id = v_prop AND rg.name = 'Executive Suite';
  SELECT r.id INTO v_room FROM rooms r WHERE r.room_group_id = v_group ORDER BY r.id LIMIT 1;
  v_rate := 389;
  INSERT INTO stays (reservation_id, room_id, room_group_id, check_in, check_out, nightly_rate, guests_count, status)
  VALUES (v_res, v_room, v_group, CURRENT_DATE + 2, CURRENT_DATE + 6, v_rate, 3, 'confirmed');
  INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price, amount)
  VALUES (v_inv, 'Executive Suite - 4 nights', 'room', 4, v_rate, v_rate*4);
  UPDATE invoices SET total = (SELECT COALESCE(SUM(amount),0) FROM invoice_line_items WHERE invoice_id = v_inv) WHERE id = v_inv;

  -- === Reservation 3: Sofia Alvarez, Standard Queen, checked out + paid ===
  SELECT id INTO v_guest FROM guests WHERE full_name = 'Sofia Alvarez' AND property_id = v_prop;
  SELECT id INTO v_plan FROM rate_plans WHERE name = 'Non-Refundable' AND property_id = v_prop;
  SELECT rg.id INTO v_group FROM room_groups rg WHERE rg.property_id = v_prop AND rg.name = 'Standard Queen';
  SELECT r.id INTO v_room FROM rooms r WHERE r.room_group_id = v_group ORDER BY r.id OFFSET 1 LIMIT 1;
  v_rate := 143;
  INSERT INTO reservations (property_id, guest_id, rate_plan_id, status, check_in, check_out)
  VALUES (v_prop, v_guest, v_plan, 'checked_out', CURRENT_DATE - 3, CURRENT_DATE - 1)
  RETURNING id INTO v_res;
  INSERT INTO stays (reservation_id, room_id, room_group_id, check_in, check_out, nightly_rate, guests_count, status)
  VALUES (v_res, v_room, v_group, CURRENT_DATE - 3, CURRENT_DATE - 1, v_rate, 1, 'checked_out');
  INSERT INTO invoices (reservation_id, status, total) VALUES (v_res, 'paid', v_rate*2) RETURNING id INTO v_inv;
  INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price, amount)
  VALUES (v_inv, 'Standard Queen - 2 nights', 'room', 2, v_rate, v_rate*2);

  -- === Reservation 4: James O'Connor, Executive Suite, confirmed (future) ===
  SELECT id INTO v_guest FROM guests WHERE full_name = 'James O''Connor' AND property_id = v_prop;
  SELECT id INTO v_plan FROM rate_plans WHERE name = 'Advance Purchase' AND property_id = v_prop;
  SELECT rg.id INTO v_group FROM room_groups rg WHERE rg.property_id = v_prop AND rg.name = 'Executive Suite';
  SELECT r.id INTO v_room FROM rooms r WHERE r.room_group_id = v_group ORDER BY r.id OFFSET 1 LIMIT 1;
  v_rate := 330;
  INSERT INTO reservations (property_id, guest_id, rate_plan_id, status, check_in, check_out)
  VALUES (v_prop, v_guest, v_plan, 'confirmed', CURRENT_DATE + 7, CURRENT_DATE + 10)
  RETURNING id INTO v_res;
  INSERT INTO stays (reservation_id, room_id, room_group_id, check_in, check_out, nightly_rate, guests_count, status)
  VALUES (v_res, v_room, v_group, CURRENT_DATE + 7, CURRENT_DATE + 10, v_rate, 2, 'confirmed');
  INSERT INTO invoices (reservation_id, status, total) VALUES (v_res, 'overdue', v_rate*3) RETURNING id INTO v_inv;
  INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price, amount)
  VALUES (v_inv, 'Executive Suite - 3 nights', 'room', 3, v_rate, v_rate*3);

  -- === Reservation 5: Priya Nair, Deluxe King, checked in ===
  SELECT id INTO v_guest FROM guests WHERE full_name = 'Priya Nair' AND property_id = v_prop;
  SELECT id INTO v_plan FROM rate_plans WHERE name = 'Best Flexible Rate' AND property_id = v_prop;
  SELECT rg.id INTO v_group FROM room_groups rg WHERE rg.property_id = v_prop AND rg.name = 'Deluxe King';
  SELECT r.id INTO v_room FROM rooms r WHERE r.room_group_id = v_group ORDER BY r.id OFFSET 2 LIMIT 1;
  v_rate := 219;
  INSERT INTO reservations (property_id, guest_id, rate_plan_id, status, check_in, check_out)
  VALUES (v_prop, v_guest, v_plan, 'checked_in', CURRENT_DATE, CURRENT_DATE + 4)
  RETURNING id INTO v_res;
  INSERT INTO stays (reservation_id, room_id, room_group_id, check_in, check_out, nightly_rate, guests_count, status)
  VALUES (v_res, v_room, v_group, CURRENT_DATE, CURRENT_DATE + 4, v_rate, 2, 'checked_in');
  INSERT INTO invoices (reservation_id, status, total) VALUES (v_res, 'pending', v_rate*4) RETURNING id INTO v_inv;
  INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price, amount)
  VALUES (v_inv, 'Deluxe King - 4 nights', 'room', 4, v_rate, v_rate*4);
END $$;

-- ---------- Market Data (both cities, 14 days) ----------
INSERT INTO market_data (city, stay_date, our_price, competitor_price, source)
SELECT 'New York',
       d::date,
       210 + (EXTRACT(DOW FROM d) IN (5,6))::int * 45 + (random()*20)::numeric(10,2),
       225 + (EXTRACT(DOW FROM d) IN (5,6))::int * 60 + (random()*30)::numeric(10,2),
       'Booking.com'
FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '13 days', INTERVAL '1 day') AS d;

INSERT INTO market_data (city, stay_date, our_price, competitor_price, source)
SELECT 'Miami',
       d::date,
       260 + (EXTRACT(DOW FROM d) IN (5,6))::int * 55 + (random()*25)::numeric(10,2),
       250 + (EXTRACT(DOW FROM d) IN (5,6))::int * 50 + (random()*35)::numeric(10,2),
       'Booking.com'
FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '13 days', INTERVAL '1 day') AS d;
