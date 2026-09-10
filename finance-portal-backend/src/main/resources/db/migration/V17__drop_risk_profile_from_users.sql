-- KYC/RiskProfile özelliği projeden kaldırıldı:
--  * Enum (RiskProfile), service (RiskAnalysisService), DTO (UserRegistrationDto),
--    endpoint (POST /api/users/kyc) tamamen silindi.
--  * Hiçbir UI üzerinde gösterilmiyordu, sadece dead-weight kayıt olarak DB'de duruyordu.
-- Bu migration risk_profile sütununu users tablosundan kaldırır.
ALTER TABLE users DROP COLUMN IF EXISTS risk_profile;
