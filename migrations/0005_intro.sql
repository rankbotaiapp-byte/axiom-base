-- Camera intro presets for the customer hero.

alter table shops add column if not exists intro_preset text not null default 'kenburns';
alter table shops add column if not exists intro_speed integer not null default 40;
alter table shops add column if not exists intro_intensity integer not null default 45;

update shops set intro_preset = 'kenburns'
where intro_preset is null or intro_preset = '';
