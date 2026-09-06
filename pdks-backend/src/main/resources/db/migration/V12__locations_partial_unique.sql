-- =============================================================================
-- V12__locations_partial_unique.sql
-- uq_locations_firm_code (tam unique kısıt) kaldırılıyor;
-- yerine partial unique index konuluyor: yalnızca active = true satırları için.
-- Böylece pasife alınan lokasyonun kodu tekrar kullanılabilir.
-- =============================================================================

ALTER TABLE locations
    DROP CONSTRAINT uq_locations_firm_code;

CREATE UNIQUE INDEX uq_locations_firm_code_active
    ON locations (firm_id, code)
    WHERE active = true;
