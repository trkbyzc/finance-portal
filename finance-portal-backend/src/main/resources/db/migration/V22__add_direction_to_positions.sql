-- VİOP pozisyon yönü (LONG/SHORT) + işlem-bazlı çarpan desteği.
-- direction NULL = LONG (geriye uyumlu: VİOP dışı tüm varlıklar ve eski kayıtlar uzun sayılır).
-- Pozisyonlar artık symbol + direction ile gruplanır → aynı sembolde ayrı LONG ve SHORT pozisyonu olabilir.
ALTER TABLE portfolio_items
    ADD COLUMN direction VARCHAR(5);

-- Audit ledger'ında da yön ve çarpan tutulur (kapanmış pozisyon K/Z geçmişi tam olsun).
ALTER TABLE transactions
    ADD COLUMN direction VARCHAR(5);

ALTER TABLE transactions
    ADD COLUMN contract_size NUMERIC(19, 6) NOT NULL DEFAULT 1;
