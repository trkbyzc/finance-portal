package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.client.binance.BinanceChartClient;
import com.financeportal.client.yahoo.YahooChartClient;
import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

/**
 * CRYPTO kategorisi için akıllı veri kaynağı seçimi:
 *   1) Önce Yahoo Finance denenir (mevcut çoğu coin için OHLC sağlar)
 *   2) Yahoo boş/yetersiz dönerse Binance klines API'sine fallback yapılır
 *
 * Sebep: PEPE-USD, LION, BILL gibi yeni veya Yahoo'da donmuş coinler için
 * Yahoo veri tutmuyor; Binance bu coinlerin çoğunda canlı OHLC sağlıyor.
 */
@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class CryptoChartStrategy implements ChartDataStrategy {

    private static final int MIN_ACCEPTABLE_POINTS = 5;

    private final YahooChartClient yahooChartClient;
    private final BinanceChartClient binanceChartClient;

    @Override
    public boolean supports(String category, String symbol) {
        return "CRYPTO".equalsIgnoreCase(category);
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval,
                                                       String startDate, String endDate) {
        String clean = (symbol != null) ? symbol.trim().toUpperCase(Locale.ENGLISH) : "";
        String yahooSymbol = toYahooSymbol(clean);

        // 1) Yahoo dene — sembol "-USD" suffix'i ile (BTC → BTC-USD).
        // Yahoo Finance crypto sembolleri her zaman X-USD formatında; sadece "BTC" tanınmıyor.
        log.info("[CRYPTO-CHART] Yahoo denemesi: {} (raw: {})", yahooSymbol, clean);
        List<HistoricalDataDto> data = yahooChartClient.fetchChartHistory(yahooSymbol, range, interval, startDate, endDate);

        if (data != null && data.size() >= MIN_ACCEPTABLE_POINTS) {
            return data;
        }

        // 2) Binance fallback
        String binanceSymbol = toBinanceSymbol(clean);
        log.warn("[CRYPTO-CHART] Yahoo'da '{}' için veri yetersiz ({} nokta). Binance fallback: {}",
                yahooSymbol, data != null ? data.size() : 0, binanceSymbol);

        return binanceChartClient.fetchKlines(binanceSymbol, range);
    }

    private String toYahooSymbol(String symbol) {
        if (symbol == null || symbol.isEmpty()) return symbol;
        // Zaten "-USD" varsa olduğu gibi bırak.
        if (symbol.contains("-USD")) return symbol;
        // "BTCUSDT" / "BTCUSD" gibi gelirse base'i çıkarıp X-USD'ye çevir.
        String base = symbol.replace("USDT", "").replace("USD", "").replace("/", "").trim();
        return base + "-USD";
    }

    private String toBinanceSymbol(String symbol) {
        String s = symbol
                .replace("-USD", "")
                .replace("USDT", "")
                .replace("USD", "")
                .replace("/", "")
                .trim();
        return s + "USDT";
    }
}
