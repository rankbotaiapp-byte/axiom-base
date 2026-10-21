-- Tenant check for consumer lead search. Membership lives in shop_members.
-- A shop is active while billing is trialing or active. trade is the shop niche.

create or replace view shop_memberships as
select m.user_id, m.shop_id, m.role, s.niche as trade
from shop_members m
join shops s on s.id = m.shop_id
left join shop_billing b on b.shop_id = s.id
where m.role in ('owner', 'employee')
  and coalesce(b.status, 'trialing') in ('active', 'trialing')
union
select s.owner_user_id, s.id, 'owner', s.niche
from shops s
left join shop_billing b on b.shop_id = s.id
where s.owner_user_id is not null
  and btrim(s.owner_user_id) <> ''
  and coalesce(b.status, 'trialing') in ('active', 'trialing');
