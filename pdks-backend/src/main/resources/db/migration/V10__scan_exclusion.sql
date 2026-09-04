ALTER TABLE raw_scans
ADD COLUMN excluded boolean NOT NULL DEFAULT false,
ADD COLUMN excluded_reason varchar(255),
ADD COLUMN excluded_by varchar(100),
ADD COLUMN excluded_at timestamp(6) WITHOUT TIME ZONE;
