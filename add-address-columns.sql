-- Adds an optional street address to hotels and activities, so their
-- cards can offer the same "Open in Apple Maps" / "Open in Google Maps"
-- buttons the Schedule page's events already have.
--
-- No RLS changes needed — both tables already allow public read and
-- admin write, and a new nullable column doesn't change that.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run: ADD COLUMN
-- IF NOT EXISTS guards against an error on a second run.

ALTER TABLE hotels ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS address text;
