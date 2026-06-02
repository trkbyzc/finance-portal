-- VİOP sözleşme büyüklüğü (çarpan) desteği.
-- nominal = fiyat × çarpan × adet. VİOP dışı tüm varlıklarda çarpan = 1.
-- Mevcut satırlar DEFAULT 1 ile geriye dönük doldurulur.
ALTER TABLE portfolio_items
    ADD COLUMN contract_size NUMERIC(19, 6) NOT NULL DEFAULT 1;
