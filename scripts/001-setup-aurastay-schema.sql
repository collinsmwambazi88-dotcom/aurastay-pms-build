-- AuraStay PMS schema
-- Multi-tenant hotel operating system

DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS stays CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS rate_calendars CASCADE;
DROP TABLE IF EXISTS rate_plans CASCADE;
DROP TABLE IF EXISTS addons CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_groups CASCADE;
DROP TABLE IF EXISTS market_data CASCADE;
DROP TABLE IF EXISTS properties CASCADE;

-- Root tenant entity
CREATE TABLE properties (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  city          VARCHAR(80)  NOT NULL,
  currency      VARCHAR(3)   NOT NULL DEFAULT 'USD',
  timezone      VARCHAR(60)  NOT NULL DEFAULT 'America/New_York',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Room categories (e.g. Deluxe Suite)
CREATE TABLE room_groups (
  id            SERIAL PRIMARY KEY,
  property_id   INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name          VARCHAR(80) NOT NULL,
  description   TEXT,
  base_capacity INT NOT NULL DEFAULT 2,
  max_capacity  INT NOT NULL DEFAULT 4,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_room_groups_property ON room_groups(property_id);

-- Physical units
CREATE TABLE rooms (
  id            SERIAL PRIMARY KEY,
  room_group_id INT NOT NULL REFERENCES room_groups(id) ON DELETE CASCADE,
  room_number   VARCHAR(12) NOT NULL,
  floor         INT NOT NULL DEFAULT 1,
  status        VARCHAR(12) NOT NULL DEFAULT 'clean'
                CHECK (status IN ('clean','occupied','dirty','out_of_order')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rooms_group ON rooms(room_group_id);

-- Date-specific base prices
CREATE TABLE rate_calendars (
  id            SERIAL PRIMARY KEY,
  room_group_id INT NOT NULL REFERENCES room_groups(id) ON DELETE CASCADE,
  stay_date     DATE NOT NULL,
  base_rate     NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_group_id, stay_date)
);
CREATE INDEX idx_rate_calendars_group_date ON rate_calendars(room_group_id, stay_date);

-- Sellable extras (breakfast, spa)
CREATE TABLE addons (
  id            SERIAL PRIMARY KEY,
  property_id   INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name          VARCHAR(80) NOT NULL,
  price         NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_addons_property ON addons(property_id);

-- Derived pricing rules
CREATE TABLE rate_plans (
  id              SERIAL PRIMARY KEY,
  property_id     INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name            VARCHAR(80) NOT NULL,
  description     TEXT,
  adjustment_type VARCHAR(12) NOT NULL CHECK (adjustment_type IN ('percentage','fixed')),
  adjustment_value NUMERIC(10,2) NOT NULL,
  includes_breakfast BOOLEAN NOT NULL DEFAULT false,
  refundable      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rate_plans_property ON rate_plans(property_id);

-- Guests
CREATE TABLE guests (
  id          SERIAL PRIMARY KEY,
  property_id INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  full_name   VARCHAR(120) NOT NULL,
  email       VARCHAR(160),
  phone       VARCHAR(40),
  id_type     VARCHAR(20),
  id_number   VARCHAR(60),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_guests_property ON guests(property_id);

-- Booking header
CREATE TABLE reservations (
  id           SERIAL PRIMARY KEY,
  property_id  INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_id     INT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  rate_plan_id INT REFERENCES rate_plans(id) ON DELETE SET NULL,
  status       VARCHAR(12) NOT NULL DEFAULT 'confirmed'
               CHECK (status IN ('confirmed','checked_in','checked_out','cancelled')),
  check_in     DATE NOT NULL,
  check_out    DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reservations_property ON reservations(property_id);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);

-- Individual room assignment (a reservation can have many stays)
CREATE TABLE stays (
  id             SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  room_id        INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  room_group_id  INT NOT NULL REFERENCES room_groups(id) ON DELETE CASCADE,
  check_in       DATE NOT NULL,
  check_out      DATE NOT NULL,
  nightly_rate   NUMERIC(10,2) NOT NULL,
  guests_count   INT NOT NULL DEFAULT 2,
  status         VARCHAR(12) NOT NULL DEFAULT 'confirmed'
                 CHECK (status IN ('confirmed','checked_in','checked_out','cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stays_reservation ON stays(reservation_id);
CREATE INDEX idx_stays_room ON stays(room_id);
CREATE INDEX idx_stays_dates ON stays(room_id, check_in, check_out);

-- Financial record (one per reservation)
CREATE TABLE invoices (
  id             SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  status         VARCHAR(12) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('paid','overdue','pending')),
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_reservation ON invoices(reservation_id);

CREATE TABLE invoice_line_items (
  id          SERIAL PRIMARY KEY,
  invoice_id  INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(160) NOT NULL,
  item_type   VARCHAR(12) NOT NULL DEFAULT 'room' CHECK (item_type IN ('room','addon','tax','fee')),
  quantity    INT NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);

-- Scraped competitor prices
CREATE TABLE market_data (
  id              SERIAL PRIMARY KEY,
  city            VARCHAR(80) NOT NULL,
  stay_date       DATE NOT NULL,
  our_price       NUMERIC(10,2) NOT NULL,
  competitor_price NUMERIC(10,2) NOT NULL,
  source          VARCHAR(60) NOT NULL DEFAULT 'Booking.com',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_market_data_city_date ON market_data(city, stay_date);

-- Guest ratings and feedback (post-stay reviews)
CREATE TABLE guest_ratings (
  id             SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  property_id    INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  rating_type    VARCHAR(12) NOT NULL CHECK (rating_type IN ('check_in', 'stay')),
  stars          INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  feedback_tags  TEXT[] DEFAULT ARRAY[]::TEXT[],
  comment        TEXT,
  email_sent_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_guest_ratings_reservation ON guest_ratings(reservation_id);
CREATE INDEX idx_guest_ratings_property ON guest_ratings(property_id);
CREATE INDEX idx_guest_ratings_created ON guest_ratings(created_at);
