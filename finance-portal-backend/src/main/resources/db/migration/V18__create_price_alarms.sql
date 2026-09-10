-- Fiyat alarmı tablosu — kullanıcının kurduğu eşik değerleri
CREATE TABLE IF NOT EXISTS price_alarms (
    id                UUID         PRIMARY KEY,
    user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol            VARCHAR(50)  NOT NULL,
    asset_type        VARCHAR(32)  NOT NULL,
    condition         VARCHAR(16)  NOT NULL,           -- ABOVE | BELOW
    threshold         NUMERIC(24,8) NOT NULL,
    frequency         VARCHAR(16)  NOT NULL,           -- ONCE | CONTINUOUS
    note              VARCHAR(500),
    active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_triggered_at TIMESTAMP,
    trigger_count     INT          NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_alarms_active ON price_alarms(active);
CREATE INDEX IF NOT EXISTS idx_alarms_user   ON price_alarms(user_id);
