-- Additional site_settings rows needed for the /registry page: the
-- intro paragraph and the HoneyFund link.
--
-- Run this in the Supabase SQL Editor. Safe to run once; running it
-- twice will insert duplicate rows for these keys.

INSERT INTO site_settings (key, value) VALUES
  (
    'registry_intro',
    'Your presence at our wedding is truly the greatest gift we could ask for. But for those who have asked, we''ve created a honeymoon fund to help us start our next adventure in Sweden.'
  ),
  (
    'registry_url',
    'https://www.honeyfund.com/site/janineandadam-sweden'
  );
