-- Optional Google review link used by owner REVIEW SMS / proof MMS triggers.

alter table if exists shops
  add column if not exists google_review_url text not null default '';
