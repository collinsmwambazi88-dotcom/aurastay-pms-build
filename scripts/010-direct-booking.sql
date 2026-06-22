-- Add custom_slug to properties for public URLs
ALTER TABLE properties ADD COLUMN custom_slug VARCHAR(80) UNIQUE;
CREATE INDEX idx_properties_custom_slug ON properties(custom_slug);

-- Add image_url to room_groups for the storefront gallery
ALTER TABLE room_groups ADD COLUMN image_url TEXT;

-- Track room group images separately for fine-grained control
CREATE TABLE room_group_images (
  id SERIAL PRIMARY KEY,
  room_group_id INT NOT NULL REFERENCES room_groups(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_room_group_images_room_group ON room_group_images(room_group_id);
