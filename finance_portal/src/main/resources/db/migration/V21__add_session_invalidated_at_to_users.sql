-- Admin "Tüm Oturumları Kapat" eylemi için server-side revocation timestamp.
-- AdminService.logoutAllSessions() bu alanı Instant.now()'a set eder.
-- SessionRevocationFilter, JWT'nin iat (issued-at) claim'ini bu değerle karşılaştırır;
-- iat < session_invalidated_at ise istek 401 ile reddedilir. Böylece Keycloak refresh
-- token logout'unun yanı sıra mevcut access token'lar da ANINDA geçersiz olur.

ALTER TABLE users
    ADD COLUMN session_invalidated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.session_invalidated_at IS
    'Admin tarafından oturumlar kapatıldığı an. Bu zamandan ÖNCE (JWT iat) yayınlanmış token''lar 401 alır.';
