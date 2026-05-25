package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.client.yahoo.YahooChartClient;
import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.domains.currency.client.TcmbIntegrationClient;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.domains.currency.service.CurrencyService;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Döviz grafiği: TCMB EVDS primary, Yahoo fallback.
 * <p>
 * Pürüz: EVDS serileri header'ın gösterdiği <i>forexSelling</i> ile birebir uyumlu değil
 * (~%0.2 spread — EVDS daha çok ALIŞ tarafına yakın değer dönüyor). Bunu maskelemek için
 * grafiğin <b>bugüne ait son noktası</b>nı live TCMB XML'deki forexSelling değeri ile
 * patch'liyoruz — kullanıcının görüş alanındaki "Anlık Fiyat" ile grafik son noktası
 * birebir eşleşsin. Geçmiş günler EVDS değeri olarak kalır (trend için sorun yok).
 */
@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class CurrencyChartStrategy implements ChartDataStrategy {

    private final YahooChartClient yahooChartClient;
    private final TcmbIntegrationClient tcmbIntegrationClient;
    private final CurrencyService currencyService;

    @Override
    public boolean supports(String category, String symbol) {
        return "CURRENCY".equalsIgnoreCase(category);
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate) {
        String cleanSymbol = symbol.trim().toUpperCase();
        String evdsSymbol = cleanSymbol.replace("TRY=X", "").replace("=X", "");

        log.info("[CHART STRATEGY] Döviz grafiği TCMB EVDS'den çekiliyor: {}", evdsSymbol);
        List<HistoricalDataDto> data = tcmbIntegrationClient.fetchCurrencyHistoryFromRedis(evdsSymbol, range);

        if (data == null || data.isEmpty() || data.size() < 5) {
            String yahooSymbol = cleanSymbol.contains("=X") ? cleanSymbol : cleanSymbol + "TRY=X";
            log.warn("[CHART STRATEGY] EVDS'de {} için yeterli veri yok ({} nokta), Yahoo fallback: {}",
                    evdsSymbol, (data == null ? 0 : data.size()), yahooSymbol);
            return yahooChartClient.fetchChartHistory(yahooSymbol, range, interval, startDate, endDate);
        }

        patchLastPointWithLiveRate(data, evdsSymbol);
        return data;
    }

    /**
     * Bugüne ait son noktayı CurrencyService'in cache'lediği live forexSelling ile değiştirir.
     * Bugün için EVDS verisi varsa overwrite, yoksa append eder.
     */
    private void patchLastPointWithLiveRate(List<HistoricalDataDto> data, String currencyCode) {
        try {
            CurrencyDto live = currencyService.getCurrencyRates().stream()
                    .filter(c -> currencyCode.equalsIgnoreCase(c.getCurrencyCode()))
                    .findFirst()
                    .orElse(null);
            if (live == null || live.getForexSelling() == null) return;

            BigDecimal sellingRate = live.getForexSelling();
            LocalDate today = LocalDate.now();
            long todayMillis = today.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();

            HistoricalDataDto last = data.get(data.size() - 1);
            if (last.getDate() != null && last.getDate().isEqual(today)) {
                last.setOpen(sellingRate); last.setHigh(sellingRate); last.setLow(sellingRate);
                last.setClose(sellingRate); last.setPrice(sellingRate);
            } else {
                HistoricalDataDto todayPoint = new HistoricalDataDto();
                todayPoint.setDate(today);
                todayPoint.setTimestamp(todayMillis);
                todayPoint.setOpen(sellingRate); todayPoint.setHigh(sellingRate); todayPoint.setLow(sellingRate);
                todayPoint.setClose(sellingRate); todayPoint.setPrice(sellingRate);
                todayPoint.setVolume(0L);
                data.add(todayPoint);
            }
        } catch (Exception e) {
            log.warn("[CHART STRATEGY] {} için son nokta patch edilemedi: {}", currencyCode, e.getMessage());
        }
    }
}
