-- Music artist and general contractor niches, plus service groups.

alter table services add column if not exists group_label text not null default '';

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'shops'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%niche%'
  loop
    execute format('alter table shops drop constraint %I', r.conname);
  end loop;
end $$;

alter table shops add constraint shops_niche_check
  check (niche in ('location', 'field', 'studio', 'music', 'contractor', 'fitness'));

insert into shops (
  id, slug, name, niche, tagline, description, ring_color,
  hero_image_url, hero_video_url, hero_blend_percent,
  intro_preset, intro_speed, intro_intensity,
  is_showcase, onboarding_step, hours_json, address
) values (
  'shop_lowlight', 'lowlight', 'Lowlight', 'music',
  'The record, then the room.',
  'Studio time and live sets out of New Era. Book the booth, the mix, or the night.',
  '#B388FF', '/media/music-hero.jpg', '/media/music-hero.mp4', 68,
  'panlr', 24, 62,
  true, 'complete',
  '{"mon":"closed","tue":"14:00-22:00","wed":"14:00-22:00","thu":"14:00-22:00","fri":"14:00-22:00","sat":"12:00-20:00","sun":"closed"}',
  'New Era · books after two'
) on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  niche = excluded.niche,
  tagline = excluded.tagline,
  description = excluded.description,
  ring_color = excluded.ring_color,
  hero_image_url = excluded.hero_image_url,
  hero_video_url = excluded.hero_video_url,
  hero_blend_percent = excluded.hero_blend_percent,
  intro_preset = excluded.intro_preset,
  intro_speed = excluded.intro_speed,
  intro_intensity = excluded.intro_intensity,
  hours_json = excluded.hours_json,
  address = excluded.address;

insert into shops (
  id, slug, name, niche, tagline, description, ring_color,
  hero_image_url, hero_video_url, hero_blend_percent,
  intro_preset, intro_speed, intro_intensity,
  is_showcase, onboarding_step, hours_json, address
) values (
  'shop_hearth', 'hearth-line', 'Hearth Line', 'contractor',
  'Walk the house. Then we build.',
  'Kitchens, repairs, and the rooms that need a real start day. New Era, and about twenty miles out.',
  '#C9A227', '/media/contractor-hero.jpg', '/media/contractor-hero.mp4', 56,
  'zoomin', 30, 38,
  true, 'complete',
  '{"mon":"07:30-16:30","tue":"07:30-16:30","wed":"07:30-16:30","thu":"07:30-16:30","fri":"07:30-16:30","sat":"08:00-13:00","sun":"closed"}',
  'New Era · jobs within 20 miles'
) on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  niche = excluded.niche,
  tagline = excluded.tagline,
  description = excluded.description,
  ring_color = excluded.ring_color,
  hero_image_url = excluded.hero_image_url,
  hero_video_url = excluded.hero_video_url,
  hero_blend_percent = excluded.hero_blend_percent,
  intro_preset = excluded.intro_preset,
  intro_speed = excluded.intro_speed,
  intro_intensity = excluded.intro_intensity,
  hours_json = excluded.hours_json,
  address = excluded.address;

insert into shop_billing (shop_id, plan, status, price_cents, gear_guardian_bps) values
  ('shop_lowlight', 'axiom_pro', 'active', 4900, 150),
  ('shop_hearth', 'axiom_pro', 'active', 4900, 150)
on conflict (shop_id) do nothing;

insert into employees (id, shop_id, display_name, title, bio, avatar_url, invite_status) values
  ('emp_mara', 'shop_lowlight', 'Mara Quinn', 'Artist',
   'Writes in the booth and holds the room when the lights drop.', '/media/music-mara.jpg', 'claimed'),
  ('emp_ellis', 'shop_lowlight', 'Ellis Ward', 'Engineer',
   'Runs the desk. The mix comes back before you leave the block.', '/media/music-ellis.jpg', 'claimed'),
  ('emp_lena', 'shop_hearth', 'Lena Cho', 'General contractor',
   'Scopes the job in plain language, then stays on it until the punch list is short.', '/media/contractor-lead.jpg', 'claimed'),
  ('emp_owen', 'shop_hearth', 'Owen Briggs', 'Lead carpenter',
   'Cabinets, stairs, and the repairs that should have been done last year.', '/media/contractor-crew.jpg', 'claimed')
on conflict (id) do update set
  display_name = excluded.display_name,
  title = excluded.title,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url;

insert into services (id, shop_id, name, description, duration_min, price_cents, sort_order, group_label) values
  ('svc_ll_roll', 'shop_lowlight', 'Single rollout', 'Artwork, the date, and the posts that go with the drop.', 60, 35000, 0, 'Release'),
  ('svc_ll_mix', 'shop_lowlight', 'Mix + master', 'One song. Notes back in the same sitting.', 90, 28000, 1, 'Release'),
  ('svc_ll_session', 'shop_lowlight', 'Studio session', 'Booth time with an engineer. Two songs, or one until it sits right.', 120, 40000, 2, 'Show'),
  ('svc_ll_live', 'shop_lowlight', 'Live set', 'Book the show. A room, a set length, and the night.', 45, 80000, 3, 'Show'),
  ('svc_ll_feature', 'shop_lowlight', 'Feature verse', 'Write and record a verse on your record.', 75, 50000, 4, 'Show'),
  ('svc_ht_consult', 'shop_hearth', 'Project consultation', 'Walk the house. Leave with a scope and a number.', 60, 15000, 0, 'Consult'),
  ('svc_ht_measure', 'shop_hearth', 'Site measure', 'Rooms, openings, and the list the crew actually builds from.', 90, 20000, 1, 'Consult'),
  ('svc_ht_repair', 'shop_hearth', 'Repair call', 'One problem. A leak, a door, a stair that moves.', 120, 28000, 2, 'Build'),
  ('svc_ht_start', 'shop_hearth', 'Start day', 'The first day on a room. The rest of the job is quoted from the consult.', 240, 65000, 3, 'Build')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  duration_min = excluded.duration_min,
  price_cents = excluded.price_cents,
  sort_order = excluded.sort_order,
  group_label = excluded.group_label;

update shops set primary_service_id = 'svc_ll_session' where id = 'shop_lowlight' and primary_service_id is null;
update shops set primary_service_id = 'svc_ht_consult' where id = 'shop_hearth' and primary_service_id is null;

insert into employee_services (employee_id, service_id) values
  ('emp_mara', 'svc_ll_roll'),
  ('emp_mara', 'svc_ll_session'),
  ('emp_mara', 'svc_ll_live'),
  ('emp_mara', 'svc_ll_feature'),
  ('emp_ellis', 'svc_ll_mix'),
  ('emp_ellis', 'svc_ll_session'),
  ('emp_lena', 'svc_ht_consult'),
  ('emp_lena', 'svc_ht_measure'),
  ('emp_lena', 'svc_ht_start'),
  ('emp_owen', 'svc_ht_repair'),
  ('emp_owen', 'svc_ht_start')
on conflict do nothing;

insert into portfolio_items (id, shop_id, employee_id, image_url, caption) values
  ('pf_mara_1', 'shop_lowlight', 'emp_mara', '/media/music-work-2.jpg', 'The room'),
  ('pf_mara_2', 'shop_lowlight', 'emp_mara', '/media/music-hero.jpg', 'Night set'),
  ('pf_ellis_1', 'shop_lowlight', 'emp_ellis', '/media/music-work-1.jpg', 'Booth'),
  ('pf_lena_1', 'shop_hearth', 'emp_lena', '/media/contractor-work-1.jpg', 'Kitchen'),
  ('pf_lena_2', 'shop_hearth', 'emp_lena', '/media/contractor-hero.jpg', 'Start day'),
  ('pf_owen_1', 'shop_hearth', 'emp_owen', '/media/contractor-work-2.jpg', 'Front stair')
on conflict (id) do nothing;
