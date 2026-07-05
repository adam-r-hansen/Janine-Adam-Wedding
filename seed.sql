-- Seed data for Janine & Adam's wedding site.
-- Run this in the Supabase SQL Editor AFTER the tables described in
-- CLAUDE.md have been created. It fills them with the same content
-- that's currently hardcoded in lib/placeholder-data.ts, so the live
-- site shows the same thing the placeholder version does today.
--
-- Safe to re-run on an empty database. If you run it twice without
-- clearing the tables first, you'll get duplicate rows.

-- ─────────────────────────────────────────────
-- site_settings (key/value pairs)
-- ─────────────────────────────────────────────
INSERT INTO site_settings (key, value) VALUES
  ('couple_name_one', 'Janine'),
  ('couple_name_two', 'Adam'),
  ('wedding_date_label', 'Saturday, October 17, 2026'),
  ('wedding_datetime', '2026-10-17T18:00:00-07:00'),
  ('venue_line', 'University Place, Washington'),
  ('welcome_message', 'We can''t wait to celebrate this next chapter surrounded by the people we love most.');

-- ─────────────────────────────────────────────
-- events (the weekend schedule)
-- ─────────────────────────────────────────────
INSERT INTO events (title, date, start_time, end_time, venue_name, address, description, dress_code, sort_order) VALUES
  (
    'Welcome Drinks',
    '2026-10-16',
    '18:00',
    '20:00',
    'The Lodge at Chambers Bay',
    '6320 Grandview Dr W, University Place, WA 98467',
    'Come as you are and say hello before the big weekend begins. Light bites and a no-host bar, no toasts, no pressure.',
    'Casual',
    1
  ),
  (
    'Ceremony & Reception',
    '2026-10-17',
    '18:00',
    '23:00',
    'Chambers Bay Golf Course',
    '6320 Grandview Dr W, University Place, WA 98467',
    'We''re tying the knot overlooking the Sound, followed by dinner, toasts, and dancing under the stars.',
    'Formal / Black Tie Optional',
    2
  ),
  (
    'Farewell Brunch',
    '2026-10-18',
    '10:00',
    '12:00',
    'Anthem Coffee & Tea',
    '3502 Bridgeport Way W, University Place, WA 98466',
    'One last coffee and pastry with us before you hit the road. Drop in any time in the window — no RSVP needed.',
    'Casual',
    3
  );

-- ─────────────────────────────────────────────
-- hotels
-- ─────────────────────────────────────────────
INSERT INTO hotels (name, photo_url, description, distance, price_range, booking_url, room_block_code, book_by_date, sort_order) VALUES
  (
    'Hotel Murano',
    NULL,
    'A stylish downtown Tacoma hotel with an art-filled lobby and rooftop views. Our pick for anyone who wants to make a weekend of it.',
    '15 minutes from the venue',
    '$180–$230/night',
    'https://example.com/book/hotel-murano',
    'JANINEADAM26',
    '2026-09-17',
    1
  ),
  (
    'Silver Cloud Hotel – University Place',
    NULL,
    'Simple, comfortable, and the closest option to the ceremony — you could walk if the weather cooperates.',
    '5 minutes from the venue',
    '$140–$170/night',
    'https://example.com/book/silver-cloud',
    NULL,
    NULL,
    2
  ),
  (
    'Home2 Suites by Hilton Tacoma',
    NULL,
    'Budget-friendly suites with kitchenettes, good for families or anyone staying a few extra nights.',
    '20 minutes from the venue',
    '$120–$150/night',
    'https://example.com/book/home2-suites',
    NULL,
    NULL,
    3
  );

-- ─────────────────────────────────────────────
-- activities (Activities + Food & Drink)
-- ─────────────────────────────────────────────
INSERT INTO activities (name, category, photo_url, blurb, neighborhood, link_url, sort_order) VALUES
  (
    'Chambers Bay Boardwalk',
    'activity',
    NULL,
    'Our favorite spot for a slow morning walk. Follow the water and you''ll get views of the venue from the other side.',
    'University Place',
    'https://example.com/chambers-bay-boardwalk',
    1
  ),
  (
    'Point Defiance Park & Zoo',
    'activity',
    NULL,
    'One of the largest urban parks in the country, and where we had our first picnic date. Bring good shoes.',
    'Tacoma',
    'https://example.com/point-defiance',
    2
  ),
  (
    'Museum of Glass',
    'activity',
    NULL,
    'A rainy-day favorite of ours — watch live glassblowing demonstrations and wander the galleries after.',
    'Downtown Tacoma',
    'https://example.com/museum-of-glass',
    3
  ),
  (
    'El Gaucho Tacoma',
    'food_drink',
    NULL,
    'Our go-to for celebrating anything. Ask for a window table if you can and save room for dessert.',
    'Downtown Tacoma',
    'https://example.com/el-gaucho-tacoma',
    4
  ),
  (
    'Anthem Coffee & Tea',
    'food_drink',
    NULL,
    'Where half our early relationship happened, one cortado at a time. Also hosting our farewell brunch.',
    'University Place',
    'https://example.com/anthem-coffee',
    5
  ),
  (
    '7 Seas Brewing',
    'food_drink',
    NULL,
    'A laid-back taproom with a great patio — perfect if you want to unwind after a day of wedding festivities.',
    'Tacoma',
    'https://example.com/7-seas-brewing',
    6
  );

-- ─────────────────────────────────────────────
-- faqs
-- ─────────────────────────────────────────────
INSERT INTO faqs (question, answer, sort_order) VALUES
  (
    'What should I wear?',
    'Dress codes vary by event — casual for welcome drinks and brunch, formal (black tie optional) for the ceremony and reception. Details are on the Schedule page for each event.',
    1
  ),
  (
    'Are kids welcome?',
    'We love your little ones, but we''ve decided to keep the wedding weekend adults-only so everyone (including parents!) can relax and celebrate.',
    2
  ),
  (
    'Where should I park?',
    'Chambers Bay has a large complimentary guest lot right next to the clubhouse. We''ll have signs up, and someone will be there to point you the right way.',
    3
  ),
  (
    'What''s the weather like in October?',
    'Expect crisp, cool Pacific Northwest fall weather — highs around 55–60°F. A light jacket or wrap is a good idea, especially once the sun goes down.',
    4
  ),
  (
    'Can I bring a plus-one?',
    'We''re so sorry we can''t accommodate additional guests beyond who''s named on your invitation. When RSVP opens, it will show exactly who we''re able to welcome.',
    5
  );
