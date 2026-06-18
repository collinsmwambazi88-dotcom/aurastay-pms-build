-- Market Intelligence: extend market_data to support per-hotel scraped rows
-- plus a stored city/date aggregate row.

-- New columns for granular, time-stamped competitor pricing.
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS hotel_name TEXT;
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Per-hotel rows have no "our_price"; only the aggregate row carries it.
ALTER TABLE market_data ALTER COLUMN our_price DROP NOT NULL;

-- Existing seed rows are city/date aggregates: tag them as the aggregate sentinel.
UPDATE market_data SET hotel_name = '__MARKET_AVG__' WHERE hotel_name IS NULL;

-- Enforce one row per hotel per city/date (the sentinel acts as the aggregate).
ALTER TABLE market_data ALTER COLUMN hotel_name SET NOT NULL;
ALTER TABLE market_data DROP CONSTRAINT IF EXISTS market_data_city_date_hotel_key;
ALTER TABLE market_data
  ADD CONSTRAINT market_data_city_date_hotel_key UNIQUE (city, stay_date, hotel_name);

CREATE INDEX IF NOT EXISTS idx_market_data_city_hotel ON market_data(city, stay_date, hotel_name);
