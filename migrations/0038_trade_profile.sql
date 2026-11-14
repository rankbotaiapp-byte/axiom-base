-- Per-shop trade profile. The public page reads this for niche-specific modules.
-- An empty object falls back to that niche's defaults.

alter table shops add column if not exists trade_profile text not null default '{}';

insert into shops (
  id, slug, name, niche, tagline, description, ring_color,
  hero_image_url, hero_video_url, hero_blend_percent,
  intro_preset, intro_speed, intro_intensity,
  is_showcase, onboarding_step, hours_json, address
) values
(
  'shop_cord', 'cord-line', 'Cord Line', 'firewood',
  'Cut, split, and stacked when you book it.',
  'Firewood cutting and delivery. Book the cord, the split, or the stack.',
  '#C4783A', '/media/heroes/firewood.jpg', '/media/heroes/wood.mp4', 58,
  'kenburns', 30, 40,
  true, 'complete',
  '{"mon":"08:00-17:00","tue":"08:00-17:00","wed":"08:00-17:00","thu":"08:00-17:00","fri":"08:00-17:00","sat":"08:00-14:00","sun":"closed"}',
  'New Era · we come to the pile'
),
(
  'shop_nightkey', 'night-key', 'Night Key', 'locksmith',
  'The van is already on the way.',
  'Mobile lock work. Book the lockout, the rekey, or the install.',
  '#C6A15B', '', '/media/heroes/mobile-locksmith.mp4', 58,
  'panlr', 28, 42,
  true, 'complete',
  '{"mon":"08:00-18:00","tue":"08:00-18:00","wed":"08:00-18:00","thu":"08:00-18:00","fri":"08:00-18:00","sat":"09:00-14:00","sun":"closed"}',
  'New Era · we come to you'
)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  niche = excluded.niche,
  tagline = excluded.tagline,
  description = excluded.description,
  hero_image_url = excluded.hero_image_url,
  hero_video_url = excluded.hero_video_url,
  is_showcase = true;

insert into employees (id, shop_id, display_name, title, bio, phone, invite_status) values
  ('emp_hank', 'shop_cord', 'Hank Briggs', 'Cutter', 'Runs the saw and keeps the lengths even.', '541-555-0164', 'claimed'),
  ('emp_sam', 'shop_nightkey', 'Sam Ortega', 'Locksmith', 'Takes the night calls.', '541-555-0142', 'claimed')
on conflict (id) do update set
  display_name = excluded.display_name,
  phone = excluded.phone;

insert into services (id, shop_id, name, description, duration_min, price_cents, sort_order, group_label) values
  ('svc_cord_cut', 'shop_cord', 'Cut and split', 'One cord, cut and split on site.', 180, 28000, 0, 'Cut'),
  ('svc_cord_drop', 'shop_cord', 'Cord delivery', 'A cord dropped where you want the pile.', 60, 32000, 1, 'Deliver'),
  ('svc_cord_stack', 'shop_cord', 'Stack the cord', 'The delivered wood, stacked and covered.', 90, 8000, 2, 'Stack'),
  ('svc_key_out', 'shop_nightkey', 'Lockout', 'Emergency open. House, car, or the shop door.', 45, 12500, 0, 'Now'),
  ('svc_key_rekey', 'shop_nightkey', 'Rekey', 'Same lock, new keys. The old ones stop working.', 60, 9500, 1, 'Door'),
  ('svc_key_auto', 'shop_nightkey', 'Automotive', 'A car lockout or a new ignition key.', 50, 15000, 2, 'Now')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  group_label = excluded.group_label;

