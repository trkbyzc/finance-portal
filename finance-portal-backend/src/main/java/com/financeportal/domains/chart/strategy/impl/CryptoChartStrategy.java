package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.client.binance.BinanceChartClient;
import com.financeportal.config.datasource.DataSourceKeys;
import com.financeportal.client.yahoo.YahooChartClient;
import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.domains.crypto.client.CoinGeckoChartClient;
import com.financeportal.domains.crypto.service.CryptoIdRegistry;
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
 *   3) Binance de yetersizse CoinGecko OHLC'ye fallback yapılır (listelenen TÜM
 *      coinler için veri var — sembol→id eşlemesi CryptoIdRegistry'den gelir)
 *
 * Sebep: PEPE-USD, LION, BILL gibi yeni veya Yahoo'da donmuş coinler için
 * Yahoo veri tutmuyor; Binance çoğunda canlı OHLC sağlıyor; Binance'te de
 * listelenmeyen coinler için CoinGecko garanti kapsama veriyor.
 */
@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class CryptoChartStrategy implements ChartDataStrategy {

    private static final int MIN_ACCEPTABLE_POINTS = 5;

    private final YahooChartClient yahooChartClient;
    private final BinanceChartClient binanceChartClient;
    private final CoinGeckoChartClient coinGeckoChartClient;
    private final CryptoIdRegistry cryptoIdRegistry;
    private final com.financeportal.config.datasource.DataSourcePolicy dataSourcePolicy;

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
        //
        // ANCAK: Yahoo bu ortamda üretilmiş veri döndürüyorsa (canlı demoda öyle) onu HİÇ
        // denemeyiz. Aşağıdaki Binance ve CoinGecko resmî, açık ve bu ortamda ETKİN
        // kaynaklardır — yani kripto için gerçek veri zaten elimizde. Yahoo'yu denersek
        // üretilmiş veri "dolu" sayılır, kademe hiç ilerlemez ve grafik gerçek fiyatla
        // çelişir. Canlıda tam olarak bu oldu: BTC grafiği ~33 gösterirken fiyat ~79.000'di
        // (üreteç kripto sembollerini tanımıyor, varsayılan bir çıpaya düşüyor).
        List<HistoricalDataDto> data = null;
        if (dataSourcePolicy.useDemoData(DataSourceKeys.YAHOO)) {
            log.debug("[CRYPTO-CHART] Yahoo bu ortamda üretilmiş veri veriyor, atlanıyor → Binance.");
        } else {
            log.info("[CRYPTO-CHART] Yahoo denemesi: {} (raw: {})", yahooSymbol, clean);
            data = yahooChartClient.fetchChartHistory(yahooSymbol, range, interval, startDate, endDate);

            if (data != null && data.size() >= MIN_ACCEPTABLE_POINTS) {
                return data;
            }
        }

        // 2) Binance
        String binanceSymbol = toBinanceSymbol(clean);
        if (data != null) {
            log.warn("[CRYPTO-CHART] Yahoo'da '{}' için veri yetersiz ({} nokta). Binance fallback: {}",
                    yahooSymbol, data.size(), binanceSymbol);
        } else {
            // Yahoo hiç denenmedi (bu ortamda üretilmiş veri veriyor) — uyarı basmaya gerek yok.
            log.debug("[CRYPTO-CHART] Binance'ten çekiliyor: {}", binanceSymbol);
        }

        List<HistoricalDataDto> binanceData = binanceChartClient.fetchKlines(binanceSymbol, range);
        if (binanceData != null && binanceData.size() >= MIN_ACCEPTABLE_POINTS) {
            return binanceData;
        }

        // 3) CoinGecko OHLC fallback — listelenen tüm coinler için garanti kapsama.
        String geckoId = cryptoIdRegistry.resolve(clean);
        log.warn("[CRYPTO-CHART] Binance'te '{}' için veri yetersiz ({} nokta). CoinGecko fallback: id={}",
                binanceSymbol, binanceData != null ? binanceData.size() : 0, geckoId);

        List<HistoricalDataDto> geckoData = coinGeckoChartClient.fetchOhlc(geckoId, range);
        if (geckoData != null && !geckoData.isEmpty()) {
            return geckoData;
        }

        // Hiçbir kaynak veri vermediyse en azından Binance'in (boş olabilen) sonucunu döndür.
        return binanceData;
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
