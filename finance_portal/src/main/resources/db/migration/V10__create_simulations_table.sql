-- Simulation: kullanıcı'nın "X tarihte X TL ile Y varlığı alsaydım" senaryolarını saklar.
-- Result alanları (units, currentValue, pnl) DB'de tutulmaz — her okumada anlık historical
-- veriden hesaplanır. Sadece kullanıcı'nın senaryo girdileri persistent.

CREATE TABLE simulations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    investment_date DATE NOT NULL,
    amount_try NUMERIC(19, 4) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_sim_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sim_user ON simulations(user_id);
