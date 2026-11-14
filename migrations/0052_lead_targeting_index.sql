-- Desk lookups filter by county, trade, and claimed together.
-- lower(county) matches the case-insensitive comparison those queries already use.

create index if not exists preloaded_leads_county_trade_claimed_idx
  on preloaded_leads (lower(county), trade_type, claimed);

analyze preloaded_leads;
