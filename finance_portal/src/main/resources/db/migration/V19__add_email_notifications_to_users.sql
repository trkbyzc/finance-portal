-- Kullanıcının e-posta bildirimlerini açma/kapatma tercihi (Tercihler sayfası).
-- Default true — kullanıcı kapatmadıkça alarm tetiklenince mail atılır.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;
