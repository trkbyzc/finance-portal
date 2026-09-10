-- Transaction audit trail: portfolio_items aggregate'inin altındaki ham BUY/SELL hareketleri.
-- PortfolioTradeService dual-write yapar: portfolio_items aggregate'i + bu tabloya satır insert.
-- Feature flag: portfolio.transaction-write.enabled (default true).

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid() için (V12 backfill kullanıyor)

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    side VARCHAR(4) NOT NULL CHECK (side IN ('BUY','SELL')),
    quantity NUMERIC(19, 6) NOT NULL,
    price NUMERIC(19, 4) NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    notes TEXT,
    CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_tx_user_symbol ON transactions(user_id, symbol);
CREATE INDEX idx_tx_user_executed ON transactions(user_id, executed_at);
