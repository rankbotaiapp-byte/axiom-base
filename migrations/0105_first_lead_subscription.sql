-- First-lead $150/mo activation bookkeeping. Additive; does not rewrite 0104.

alter table if exists shop_billing
  add column if not exists stripe_subscription_id text not null default '';

alter table if exists shop_billing
  add column if not exists first_lead_activation_reason text not null default '';
