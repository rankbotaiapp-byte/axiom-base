-- Human-in-the-loop Autopilot approval queue. Silence never auto-approves.

create table if not exists autopilot_proposals (
  id                      text primary key,
  category                text not null
                          check (category in (
                            'self_heal_patch', 'seasonal_campaign', 'budget_cap_change', 'public_creative'
                          )),
  status                  text not null default 'pending'
                          check (status in (
                            'pending', 'approved', 'disapproved', 'executed', 'expired', 'failed'
                          )),
  title                   text not null,
  summary                 text not null default '',
  evidence                jsonb not null default '{}'::jsonb,
  proposed_payload        jsonb not null default '{}'::jsonb,
  estimated_cost_cents    integer not null default 0,
  risk_level              text not null default 'medium'
                          check (risk_level in ('low', 'medium', 'high', 'critical')),
  sandbox_checks          jsonb not null default '{}'::jsonb,
  sandbox_checks_passed   boolean not null default false,
  expires_at              timestamptz not null,
  fingerprint             text not null default '',
  rejection_reason        text not null default '',
  execution_lock          text unique,
  execution_result        jsonb not null default '{}'::jsonb,
  decided_at              timestamptz,
  decided_by              text not null default '',
  executed_at             timestamptz,
  created_at              timestamptz not null default now()
);

create unique index if not exists autopilot_proposals_pending_fp
  on autopilot_proposals (fingerprint)
  where status = 'pending' and fingerprint <> '';

create index if not exists autopilot_proposals_status_idx
  on autopilot_proposals (status, created_at desc);

create table if not exists autopilot_runtime (
  id                 text primary key default 'platform',
  seasonal_niche     text not null default 'plumbing',
  campaign_states    text not null default '',
  batch_size         integer not null default 0,
  pitch_angle_id     text not null default '',
  updated_at         timestamptz not null default now()
);

insert into autopilot_runtime (id)
values ('platform')
on conflict (id) do nothing;
