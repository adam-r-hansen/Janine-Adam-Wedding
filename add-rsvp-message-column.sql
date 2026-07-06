-- RSVP stage 2 needs somewhere to store a party's optional message to
-- the couple. There wasn't an existing column for this, so this adds
-- one to `parties` (a message is naturally one-per-party, same as
-- dietary notes conceptually are, even though dietary_notes already
-- lives on `guests` from stage 1 and is left as-is).
--
-- Run this once in the Supabase SQL Editor before testing RSVP
-- submission — until it's run, saving a message will fail.

ALTER TABLE parties ADD COLUMN IF NOT EXISTS message text;
