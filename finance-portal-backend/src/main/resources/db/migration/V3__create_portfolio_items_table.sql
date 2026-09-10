CREATE TABLE portfolio_items (
                                 id UUID PRIMARY KEY,
                                 user_id UUID NOT NULL,
                                 symbol VARCHAR(50) NOT NULL,
                                 asset_type VARCHAR(50) NOT NULL,
                                 quantity NUMERIC(19, 8) NOT NULL,
                                 average_price NUMERIC(19, 8) NOT NULL,
                                 CONSTRAINT fk_portfolio_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);