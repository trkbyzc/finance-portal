-- users tablosuna Role, Risk Profili ve Ban Tarihi alanlarını ekliyoruz
ALTER TABLE users ADD COLUMN role VARCHAR(50);
ALTER TABLE users ADD COLUMN risk_profile VARCHAR(50);
ALTER TABLE users ADD COLUMN banned_until TIMESTAMP;