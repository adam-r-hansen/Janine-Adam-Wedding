-- Adds a `sort_order` column to `photos` so admins can drag photos into
-- a custom order in the approval/gallery manager instead of being stuck
-- with created_at order. New photos arrive with a null sort_order and
-- therefore sort to the bottom until an admin drags them — that's
-- intentional, not a bug.
--
-- Backfills existing rows so today's on-screen order (newest first,
-- per album) doesn't visibly change the moment this runs: 'ours' and
-- 'guests' are numbered separately, 1, 2, 3... by created_at descending.
-- Only rows where sort_order is still null are touched, so this is safe
-- to re-run.
--
-- No RLS changes needed — authenticated admins already have full UPDATE
-- on photos, which is all the reorder feature needs.
--
-- Run this once in the Supabase SQL Editor.

ALTER TABLE photos ADD COLUMN IF NOT EXISTS sort_order integer;

WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY album
      ORDER BY created_at DESC
    ) AS rn
  FROM photos
  WHERE sort_order IS NULL
)
UPDATE photos
SET sort_order = numbered.rn
FROM numbered
WHERE photos.id = numbered.id;
