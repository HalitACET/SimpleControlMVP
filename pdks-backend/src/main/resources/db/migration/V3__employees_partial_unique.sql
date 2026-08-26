-- =============================================================================
-- V3__employees_partial_unique.sql
-- uq_employees_firm_card (tam unique kısıt) kaldırılıyor;
-- yerine partial unique index konuluyor: yalnızca active = true satırları için.
-- Böylece pasife alınan personelin kart numarası başka personele verilebilir.
-- =============================================================================

ALTER TABLE employees
    DROP CONSTRAINT uq_employees_firm_card;

CREATE UNIQUE INDEX uq_employees_firm_card_active
    ON employees (firm_id, card_no)
    WHERE active = true;
