-- Mevcut portfolio_items satırlarından synthetic BUY transaction üretir — yeni eklenen
-- transactions tablosu'na "geçmiş" hissi katsın diye. Gerçek alım tarihleri kayıp olduğu
-- için executed_at = NOW(), notes = 'Backfilled from portfolio_items' (UI bu satırları info
-- badge'i ile gösterir).
--
-- Idempotent guard: 'Backfilled from portfolio_items' notu olan bir satır zaten varsa
-- bu migration tekrar çalışsa bile hiçbir şey insert etmez. Yeni eklenen portfolio_items
-- için backfill yapmaz — yeni eklemeler PortfolioTradeService dual-write'tan geçer.

INSERT INTO transactions (id, user_id, symbol, asset_type, side, quantity, price, executed_at, notes)
SELECT
    gen_random_uuid(),
    pi.user_id,
    pi.symbol,
    pi.asset_type,
    'BUY',
    pi.quantity,
    pi.average_price,
    NOW(),
    'Backfilled from portfolio_items'
FROM portfolio_items pi
WHERE NOT EXISTS (
    SELECT 1 FROM transactions t WHERE t.notes = 'Backfilled from portfolio_items'
);
