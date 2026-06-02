-- Kaydedilmiş grafikler: kullanıcının çizim araçları (overlay) + grafik ayarları.
-- payload, frontend tarafından JSON string olarak serileştirilen overlay listesi ve grafik durumudur.

CREATE TABLE saved_charts (
    id             UUID PRIMARY KEY,
    user_id        UUID NOT NULL,
    symbol         VARCHAR(64) NOT NULL,
    asset_category VARCHAR(32),
    name           VARCHAR(120) NOT NULL,
    payload        TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP,
    CONSTRAINT fk_saved_chart_owner FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_saved_charts_user ON saved_charts (user_id, created_at DESC);
