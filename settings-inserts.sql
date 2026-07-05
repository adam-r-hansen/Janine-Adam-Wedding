-- Additional site_settings row needed for the /travel page's intro
-- paragraph. seed.sql already covers every other key used across the
-- site; this one key was added after that file was first run.
--
-- Run this in the Supabase SQL Editor. Safe to run once; running it
-- twice will insert a duplicate row for this key.

INSERT INTO site_settings (key, value) VALUES
  (
    'travel_intro',
    'The closest major airport is Seattle-Tacoma International (SEA), about a 40-minute drive from University Place depending on traffic. We''d recommend renting a car or booking a rideshare in advance for the weekend, since venues are spread across town and rideshare availability can be spotty late at night.'
  );
