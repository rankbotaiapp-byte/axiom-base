-- Dataset inspector + custom hero attachments on preloaded_leads.
-- Additive only; does not rewrite earlier lead tables.

alter table if exists preloaded_leads add column if not exists street_address text not null default '';
alter table if exists preloaded_leads add column if not exists dataset_images jsonb not null default '[]'::jsonb;
alter table if exists preloaded_leads add column if not exists hero_image_url text not null default '';
alter table if exists preloaded_leads add column if not exists hero_video_url text not null default '';
alter table if exists preloaded_leads add column if not exists visual_mode text not null default 'sample_loop';
alter table if exists preloaded_leads add column if not exists visual_status text not null default 'unverified';
