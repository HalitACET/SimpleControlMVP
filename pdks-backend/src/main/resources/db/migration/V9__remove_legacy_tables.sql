DROP TABLE IF EXISTS deleted_transaction_logs;
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_shift;
ALTER TABLE users DROP COLUMN IF EXISTS shift_id;
