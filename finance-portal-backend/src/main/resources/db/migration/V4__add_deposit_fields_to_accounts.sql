-- Mevcut accounts tablosuna Mevduat (Deposit) alanlarını ekliyoruz

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'CHECKING' NOT NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5, 2);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS maturity_date TIMESTAMP;