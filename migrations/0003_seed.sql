-- Showcase tenants: Sal's Barber Shop (storefront) and D&G Automotive (field).
-- owner_user_id is null so they remain public demos; operators create their own.

insert into shops (
  id, slug, name, niche, tagline, description, ring_color,
  hero_image_url, hero_video_url, hero_blend_percent, is_showcase,
  onboarding_step, address
) values
(
  'shop_sals', 'sals-barber', 'Sal''s Barber Shop', 'location',
  'Fades, hot towels, no small talk unless you start it.',
  'A four-chair shop on Mercer. Walk-ins welcome until the last cup of coffee. Appointments skip the wait.',
  '#E7B48A', '/media/barber-hero.jpg', '/media/barber-hero.mp4', 58, true,
  'complete', '414 Mercer Street, Hoboken, NJ'
),
(
  'shop_dg', 'dg-auto', 'D&G Automotive Repair', 'field',
  'We come to the curb. Or you come to the lift.',
  'Mobile diagnostics and a Red Hook bay for the work that needs a hoist. Honest times, no mystery fees.',
  '#7EC8E3', '/media/auto-hero.jpg', '/media/auto-hero.mp4', 64, true,
  'complete', '88 Harbor Way, Red Hook, Brooklyn'
)
on conflict (id) do nothing;

insert into shop_billing (shop_id, plan, status, price_cents, gear_guardian_bps) values
  ('shop_sals', 'axiom_pro', 'active', 4900, 150),
  ('shop_dg', 'axiom_pro', 'active', 4900, 150)
on conflict (shop_id) do nothing;

insert into employees (id, shop_id, display_name, title, bio, phone, avatar_url, invite_status) values
(
  'emp_sal', 'shop_sals', 'Sal Moretti', 'Master barber',
  'Twenty years on the chair. Skin fades, classic tapers, and a hot-towel shave that resets the week.',
  '', '/media/sal.jpg', 'claimed'
),
(
  'emp_marco', 'shop_sals', 'Marco Chen', 'Barber',
  'Texture specialist. If your hair has a mind of its own, that is the point — he just aims it.',
  '', '/media/marco.jpg', 'claimed'
),
(
  'emp_dana', 'shop_dg', 'Dana Greer', 'Lead technician',
  'ASE master. Brakes, drivability, and the kind of diagnosis that starts with listening — to you and the engine.',
  '', '/media/dana.jpg', 'claimed'
),
(
  'emp_gabe', 'shop_dg', 'Gabe Ortiz', 'Mobile tech',
  'Van is a rolling bay. Jump-starts, batteries, inspections, and the jobs that should not need a tow.',
  '', '/media/gabe.jpg', 'claimed'
)
on conflict (id) do nothing;

insert into services (id, shop_id, name, description, duration_min, price_cents, sort_order) values
  ('svc_sals_cut', 'shop_sals', 'Signature cut', 'Consultation, cut, and finish. The house standard.', 45, 4500, 0),
  ('svc_sals_fade', 'shop_sals', 'Skin fade', 'Tight blend, razor line, hot towel.', 50, 5200, 1),
  ('svc_sals_shave', 'shop_sals', 'Hot towel shave', 'Straight razor, oils, the full ritual.', 35, 4000, 2),
  ('svc_sals_beard', 'shop_sals', 'Beard sculpt', 'Shape, line-up, and oil.', 25, 2800, 3),
  ('svc_dg_diag', 'shop_dg', 'Driveway diagnostic', 'Scan, road-test if safe, a plain-language report.', 60, 12900, 0),
  ('svc_dg_oil', 'shop_dg', 'Oil + filter', 'At your curb or in the bay. Includes inspection.', 45, 8900, 1),
  ('svc_dg_brakes', 'shop_dg', 'Brake inspection', 'Pads, rotors, fluid. Quote before any work.', 40, 7900, 2),
  ('svc_dg_mobile', 'shop_dg', 'Mobile rescue', 'Battery, jump, tire change, no-start triage.', 50, 14900, 3)
on conflict (id) do nothing;

update shops set primary_service_id = 'svc_sals_cut' where id = 'shop_sals' and primary_service_id is null;
update shops set primary_service_id = 'svc_dg_diag' where id = 'shop_dg' and primary_service_id is null;

insert into employee_services (employee_id, service_id) values
  ('emp_sal', 'svc_sals_cut'),
  ('emp_sal', 'svc_sals_fade'),
  ('emp_sal', 'svc_sals_shave'),
  ('emp_sal', 'svc_sals_beard'),
  ('emp_marco', 'svc_sals_cut'),
  ('emp_marco', 'svc_sals_fade'),
  ('emp_marco', 'svc_sals_beard'),
  ('emp_dana', 'svc_dg_diag'),
  ('emp_dana', 'svc_dg_oil'),
  ('emp_dana', 'svc_dg_brakes'),
  ('emp_gabe', 'svc_dg_diag'),
  ('emp_gabe', 'svc_dg_oil'),
  ('emp_gabe', 'svc_dg_mobile')
on conflict do nothing;

insert into portfolio_items (id, shop_id, employee_id, image_url, caption) values
  ('pf_sal_1', 'shop_sals', 'emp_sal', '/media/barber-work-1.jpg', 'Skin fade, hard part'),
  ('pf_sal_2', 'shop_sals', 'emp_sal', '/media/barber-work-2.jpg', 'Hot towel shave'),
  ('pf_marco_1', 'shop_sals', 'emp_marco', '/media/barber-work-1.jpg', 'Texture crop'),
  ('pf_dana_1', 'shop_dg', 'emp_dana', '/media/auto-work-1.jpg', 'Front brake job, curb-side'),
  ('pf_dana_2', 'shop_dg', 'emp_dana', '/media/auto-work-2.jpg', 'Bay rebuild'),
  ('pf_gabe_1', 'shop_dg', 'emp_gabe', '/media/auto-work-1.jpg', 'Mobile caliper swap')
on conflict (id) do nothing;

insert into appointments (
  id, shop_id, employee_id, service_id, customer_name, customer_phone,
  starts_at, status, payment_status, payment_cents
) values
  ('apt_s1', 'shop_sals', 'emp_sal', 'svc_sals_cut', 'Walk-in', '', now() - interval '6 days', 'completed', 'paid', 4500),
  ('apt_s2', 'shop_sals', 'emp_marco', 'svc_sals_fade', 'Walk-in', '', now() - interval '5 days', 'completed', 'paid', 5200),
  ('apt_s3', 'shop_sals', 'emp_sal', 'svc_sals_shave', 'Walk-in', '', now() - interval '3 days', 'completed', 'paid', 4000),
  ('apt_s4', 'shop_sals', 'emp_sal', 'svc_sals_cut', 'Walk-in', '', now() - interval '1 day', 'completed', 'paid', 4500),
  ('apt_d1', 'shop_dg', 'emp_dana', 'svc_dg_diag', 'Fleet', '', now() - interval '6 days', 'completed', 'paid', 12900),
  ('apt_d2', 'shop_dg', 'emp_gabe', 'svc_dg_mobile', 'Roadside', '', now() - interval '4 days', 'completed', 'paid', 14900),
  ('apt_d3', 'shop_dg', 'emp_dana', 'svc_dg_brakes', 'Bay', '', now() - interval '2 days', 'completed', 'paid', 7900)
on conflict (id) do nothing;
