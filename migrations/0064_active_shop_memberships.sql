-- Active tenant memberships only. A shop with no billing row, or any status
-- other than active or trialing, is not a shop a tenant can search from.

create or replace view shop_memberships as
select m.user_id, m.shop_id, m.role, s.niche as trade, b.status as billing_status
from shop_members m
join shops s on s.id = m.shop_id
join shop_billing b on b.shop_id = s.id
where m.role in ('owner', 'employee')
  and b.status in ('active', 'trialing')
union
select s.owner_user_id, s.id, 'owner', s.niche, b.status
from shops s
join shop_billing b on b.shop_id = s.id
where s.owner_user_id is not null
  and btrim(s.owner_user_id) <> ''
  and b.status in ('active', 'trialing');
