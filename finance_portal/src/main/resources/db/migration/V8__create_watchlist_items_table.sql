-- Watchlist (İzleme Listesi) — kullanıcının takip ettiği sembolleri tutar.
-- Portföyden farklı: quantity/price yok, sadece "favori sembol" listesi.

CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    added_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_watchlist_user_symbol_type UNIQUE (user_id, symbol, asset_type)
);

CREATE INDEX idx_watchlist_user ON watchlist_items(user_id);
