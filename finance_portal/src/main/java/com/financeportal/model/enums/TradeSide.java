package com.financeportal.model.enums;

/**
 * Transaction tarafı: BUY (alım) veya SELL (satım).
 * portfolio_items aggregate'inden farklı olarak, transactions tablosu her bir hareket için ayrı kayıt tutar.
 */
public enum TradeSide {
    BUY,
    SELL
}
