-- Kalıcı (süresiz) ban bayrağı. Geçici ban için bannedUntil kullanılıyor.
-- ban_permanent=true → bannedUntil değerine bakılmaksızın kullanıcı engellenir.

ALTER TABLE users
    ADD COLUMN ban_permanent BOOLEAN NOT NULL DEFAULT FALSE;
