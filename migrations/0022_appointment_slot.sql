-- One open booking per employee and start time. Cancelled rows stay out of the index
-- so that slot can be booked again. Applied on databases that already ran 0002.

create unique index if not exists appointments_no_double_booking
  on appointments (employee_id, starts_at)
  where status in ('pending', 'confirmed');
