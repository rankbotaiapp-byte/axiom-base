-- Rebrand live tenants, add studio niche, New Era Apps showcase.

alter table shop_events add column if not exists payload text;

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
  check (niche in ('location', 'field', 'studio'));

update shops set
  slug = 'new-era-barbershop',
  name = 'New Era Barbershop',
  tagline = 'Fades, hot towels, no small talk unless you start it.',
  description = 'A four-chair shop in New Era. Walk-ins welcome until the last cup of coffee. Appointments skip the wait.',
  address = '12 Main Street, New Era'
where id = 'shop_sals';

update shops set
  slug = 'axiom-auto',
  name = 'Axiom Auto',
  tagline = 'We come to the curb. Or you come to the lift.',
  description = 'Mobile diagnostics and a bay for the work that needs a hoist. Honest times, no mystery fees. Based in New Era.',
  address = 'New Era · 15-mile service radius'
where id = 'shop_dg';

insert into shops (
  id, slug, name, niche, tagline, description, ring_color,
  hero_image_url, hero_video_url, hero_blend_percent, is_showcase,
  onboarding_step, address
) values (
  'shop_apps', 'new-era-apps', 'New Era Apps', 'studio',
  'Powered by Axiom.',
  'We stand up the booking site, the operator console, and the staff station — then light the edge of the phone when the first appointment lands. This is the product.',
  '#2EE6D6', '/media/apps-hero.jpg', '/media/apps-hero.mp4', 60, true,
  'complete', 'New Era'
)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  niche = excluded.niche,
  tagline = excluded.tagline,
  description = excluded.description,
  ring_color = excluded.ring_color,
  hero_image_url = excluded.hero_image_url,
  hero_video_url = excluded.hero_video_url,
  hero_blend_percent = excluded.hero_blend_percent,
  address = excluded.address;

insert into shop_billing (shop_id, plan, status, price_cents, gear_guardian_bps) values
  ('shop_apps', 'axiom_pro', 'active', 4900, 150)
on conflict (shop_id) do nothing;

insert into employees (id, shop_id, display_name, title, bio, phone, avatar_url, invite_status) values
(
  'emp_eric', 'shop_apps', 'Eric', 'Founder',
  'Builds the shop you can book. New Era Apps, powered by Axiom.',
  '5418908126', '/media/eric.jpg', 'claimed'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  title = excluded.title,
  bio = excluded.bio,
  phone = excluded.phone,
  avatar_url = excluded.avatar_url;

insert into services (id, shop_id, name, description, duration_min, price_cents, sort_order) values
  ('svc_apps_disc', 'shop_apps', 'Discovery call', 'What you run. What the ring should say.', 45, 15000, 0),
  ('svc_apps_launch', 'shop_apps', 'Site launch session', 'Live booking page, services, and staff.', 90, 48000, 1),
  ('svc_apps_console', 'shop_apps', 'Console + station', 'Admin, employee board, incoming book.', 60, 32000, 2),
  ('svc_apps_ring', 'shop_apps', 'Custom ring + brand', 'Perimeter glow, color, confirmation language.', 50, 22000, 3)
on conflict (id) do nothing;

update shops set primary_service_id = 'svc_apps_disc'
where id = 'shop_apps' and primary_service_id is null;

insert into employee_services (employee_id, service_id) values
  ('emp_eric', 'svc_apps_disc'),
  ('emp_eric', 'svc_apps_launch'),
  ('emp_eric', 'svc_apps_console'),
  ('emp_eric', 'svc_apps_ring')
on conflict do nothing;

insert into portfolio_items (id, shop_id, employee_id, image_url, caption) values
  ('pf_eric_1', 'shop_apps', 'emp_eric', '/media/apps-work-1.jpg', 'The ring'),
  ('pf_eric_2', 'shop_apps', 'emp_eric', '/media/apps-work-2.jpg', 'Operator console'),
  ('pf_eric_3', 'shop_apps', 'emp_eric', '/media/apps-hero.jpg', 'Studio')
on conflict (id) do nothing;

insert into appointments (
  id, shop_id, employee_id, service_id, customer_name, customer_phone,
  starts_at, status, payment_status, payment_cents
) values
  ('apt_a1', 'shop_apps', 'emp_eric', 'svc_apps_disc', 'Launch', '', now() - interval '5 days', 'completed', 'paid', 15000),
  ('apt_a2', 'shop_apps', 'emp_eric', 'svc_apps_launch', 'Build', '', now() - interval '2 days', 'completed', 'paid', 48000)
on conflict (id) do nothing;
