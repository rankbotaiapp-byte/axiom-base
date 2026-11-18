-- Dynamic pitch angle for outbound templates (SMS/email hooks).
alter table outbound_engine_state
  add column if not exists pitch_angle_id text not null default 'founder_video';

comment on column outbound_engine_state.pitch_angle_id is
  'CRO hook layered onto sms_template/email_body at send time (missed_call, after_hours, founder_video, trial_autopilot).';