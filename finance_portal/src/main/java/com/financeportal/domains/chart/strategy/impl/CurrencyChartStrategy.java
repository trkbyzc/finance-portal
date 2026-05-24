package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.client.yahoo.YahooChartClient;
import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.domains.currency.client.TcmbIntegrationClient;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class CurrencyChartStrategy implements ChartDataStrategy {

    private final YahooChartClient yahooChartClient;
    // 🚀 SİLAHIMIZI GERİ ÇEKİYORUZ: Yahoo'nun patladığı yerlerde TCMB devreye girecek
    private final TcmbIntegrationClient tcmbIntegrationClient;

    @Override
    public boolean supports(String category, String symbol) {
        return "CURRENCY".equalsIgnoreCase(category);
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate) {
        String cleanSymbol = symbol.trim().toUpperCase();
        String yahooSymbol = cleanSymbol.contains("=X") ? cleanSymbol : cleanSymbol + "TRY=X";

        log.info("[CHART STRATEGY] Döviz grafiği Yahoo'dan deneniyor: {}", yahooSymbol);
        List<HistoricalDataDto> data = yahooChartClient.fetchChartHistory(yahooSymbol, range, interval, startDate, endDate);

        // 🚀 AKILLI FALLBACK:
        // Eğer Yahoo boş dönerse veya veri çok eksikse (örn. sadece 2-3 günlük veriyse), hemen EVDS'ye (TCMB) dön!
        if (data == null || data.isEmpty() || data.size() < 5) {
            log.warn("[CHART STRATEGY] Yahoo'da {} için yeterli veri yok, kurtarıcı olarak EVDS'ye (TCMB) dönülüyor!", cleanSymbol);

            // Kendi orijinal EVDS client'ımızı çağırıyoruz. Sembolü saf haliyle (örn. KWD, SAR) gönderiyoruz.
            String evdsSymbol = cleanSymbol.replace("TRY=X", "").replace("=X", "");
            return tcmbIntegrationClient.fetchCurrencyHistoryFromRedis(evdsSymbol, range);
        }

        return data;
    }
}