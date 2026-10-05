alter table shops add column if not exists dashboard_override boolean not null default false;
alter table shops add column if not exists dashboard_config text not null default '{"sections":["schedule","portfolio","hours"]}';
alter table employees add column if not exists dashboard_config text not null default '{"sections":["schedule","portfolio","hours"]}';
