-- Çoklu adlandırılmış portföy desteği.
-- portfolio_items şu ana kadar doğrudan kullanıcıya bağlıydı; artık bir portföye bağlanır.
-- Mevcut veriler için her kullanıcıya "Ana Portföy" oluşturulup item'lar oraya taşınır.

CREATE TABLE portfolios (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL,
    name       VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_portfolio_owner FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_portfolios_user ON portfolios (user_id);

-- portfolio_items'a portföy bağı (geçişte nullable; backend yeni item'larda her zaman doldurur)
ALTER TABLE portfolio_items ADD COLUMN portfolio_id UUID;
ALTER TABLE portfolio_items
    ADD CONSTRAINT fk_item_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios (id) ON DELETE CASCADE;
CREATE INDEX idx_portfolio_items_portfolio ON portfolio_items (portfolio_id);

-- Item'ı olan her kullanıcıya bir "Ana Portföy"
INSERT INTO portfolios (id, user_id, name, created_at)
SELECT gen_random_uuid(), u.user_id, 'Ana Portföy', now()
FROM (SELECT DISTINCT user_id FROM portfolio_items) u;

-- Mevcut item'ları kullanıcının Ana Portföy'üne bağla
UPDATE portfolio_items pi
SET portfolio_id = p.id
FROM portfolios p
WHERE p.user_id = pi.user_id AND pi.portfolio_id IS NULL;
