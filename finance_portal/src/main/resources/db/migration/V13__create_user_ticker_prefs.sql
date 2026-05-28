-- Market ticker bar'ında gösterilecek varlıkları kullanıcı seçer.
-- Kapsam (scope): ALL_PAGES = her sayfada ticker, HOME_ONLY = sadece dashboard.
CREATE TABLE user_ticker_prefs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_ticker_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_ticker_user_symbol_type UNIQUE (user_id, symbol, asset_type)
);
CREATE INDEX idx_ticker_user ON user_ticker_prefs(user_id);

-- Scope users tablosuna eklendi (her kullanıcının tek bir scope tercihi var).
-- Default HOME_ONLY — ticker bar sadece dashboard'da görünür. Kullanıcı /preferences'tan
-- ALL_PAGES'e çekebilir (her sayfada görünür).
ALTER TABLE users ADD COLUMN ticker_scope VARCHAR(20) NOT NULL DEFAULT 'HOME_ONLY';
