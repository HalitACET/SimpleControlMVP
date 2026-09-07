ALTER TABLE shifts ADD COLUMN break_start TIME;
ALTER TABLE shifts ADD COLUMN break_end TIME;
ALTER TABLE shifts DROP COLUMN break_minutes;
