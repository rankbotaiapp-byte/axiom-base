-- Tables created after the first RLS pass, plus Better Auth tables.
-- Enable RLS with no policies so the public data API cannot read them.
-- The table owner (the app connection) still bypasses RLS. FORCE is not set,
-- matching 0002_schema.sql, so server queries keep working.

alter table if exists shop_media_assets enable row level security;
alter table if exists shop_social_posts enable row level security;
alter table if exists shop_copilot_memory enable row level security;
alter table if exists business_memories enable row level security;

alter table if exists "user" enable row level security;
alter table if exists "session" enable row level security;
alter table if exists "account" enable row level security;
alter table if exists "verification" enable row level security;
