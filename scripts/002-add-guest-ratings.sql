-- Migration: add guest_ratings table for post-stay feedback
-- Reservations link to guests via guest_id; this table records per-reservation ratings.

CREATE TABLE IF NOT EXISTS guest_ratings (
  id             SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  property_id    INT NOT NULL REFERENCES properties(id)  ON DELETE CASCADE,
  rating_type    VARCHAR(12) NOT NULL CHECK (rating_type IN ('check_in', 'stay')),
  stars          INT         NOT NULL CHECK (stars >= 1 AND stars <= 5),
  feedback_tags  TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  comment        TEXT,
  email_sent_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one rating per (reservation, type) is allowed
CREATE UNIQUE INDEX IF NOT EXISTS uq_guest_ratings_res_type
  ON guest_ratings(reservation_id, rating_type);

CREATE INDEX IF NOT EXISTS idx_guest_ratings_property
  ON guest_ratings(property_id);

CREATE INDEX IF NOT EXISTS idx_guest_ratings_created
  ON guest_ratings(created_at);

