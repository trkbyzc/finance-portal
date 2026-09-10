package com.financeportal.domains.crypto.service;

import com.financeportal.domains.crypto.dto.CryptoDto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sembol → CoinGecko id eşlemesini bellekte tutar (örn. "PEPE" → "pepe").
 *
 * CryptoSyncService her CoinGecko çekiminde {@link #update(List)} ile günceller.
 * CryptoChartStrategy, Yahoo/Binance'te bulunamayan coinler için CoinGecko OHLC
 * fallback'ine geçerken sembolden id'yi buradan çözer. Eşleme listenin kendisinden
 * geldiği için (markets verisi) güvenilirdir; sembol→id tahminine gerek kalmaz.
 */
@Component
public class CryptoIdRegistry {

    private final Map<String, String> symbolToId = new ConcurrentHashMap<>();

    /** Sync sonrası eşlemeyi güncelle (geckoId'si olan coinler). */
    public void update(List<CryptoDto> coins) {
        if (coins == null) return;
        for (CryptoDto c : coins) {
            if (c.getCurrencyCode() != null && c.getGeckoId() != null && !c.getGeckoId().isBlank()) {
                symbolToId.put(normalize(c.getCurrencyCode()), c.getGeckoId());
            }
        }
    }

    /** "PEPE", "PEPE-USD", "pepeusdt" gibi sembollerden CoinGecko id döndürür (yoksa null). */
    public String resolve(String symbol) {
        if (symbol == null) return null;
        return symbolToId.get(normalize(symbol));
    }

    private String normalize(String symbol) {
        // Önce uppercase: replace büyük/küçük harfe duyarlı olduğundan, küçük harf
        // gelen sembollerde (örn. "pepeusdt") eklerin soyulabilmesi için şart.
        // USDT, USD'den önce soyulmalı (aksi halde USDT'den sadece "T" kalır).
        return symbol
                .toUpperCase(Locale.ENGLISH)
                .replace("-USD", "")
                .replace("USDT", "")
                .replace("USD", "")
                .replace("/", "")
                .trim();
    }
}
