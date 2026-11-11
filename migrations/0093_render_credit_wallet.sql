-- Render credit wallet: monthly spend cap, auto-reload, saved Stripe card.

alter table if exists shop_ai_credits
  add column if not exists monthly_spend_limit_cents integer not null default 1500;

alter table if exists shop_ai_credits
  add column if not exists month_spend_cents integer not null default 0;

alter table if exists shop_ai_credits
  add column if not exists spend_month text not null default '';

alter table if exists shop_ai_credits
  add column if not exists auto_reload boolean not null default false;

alter table if exists shop_ai_credits
  add column if not exists auto_reload_threshold integer not null default 2;

alter table if exists shop_ai_credits
  add column if not exists stripe_payment_method_id text not null default '';
