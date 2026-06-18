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
        // Custom (özel tarih) aralığında startDate/endDate'i EVDS filtrelemesine geçiriyoruz —
        // aksi halde range tanınmayıp son 30 güne düşüyordu (geçmiş tarih "fiyat bulunamadı" hatası).
        List<HistoricalDataDto> data = tcmbIntegrationClient.fetchCurrencyHistoryFromRedis(evdsSymbol, range, startDate, endDate);

        // SADECE EVDS tamamen boşsa Yahoo'ya düş. Eskiden "< 5" idi → kısa range'lerde (1d/5d) EVDS
        // az nokta verince Yahoo USDTRY=X'e düşüyordu; o farklı kaynak (~%0.2 spread) header'daki TCMB
        // canlı fiyatıyla uyuşmuyor + intraday verisi klinecharts crosshair/eksenini bozuyordu. Artık
        // seyrek de olsa EVDS + canlı patch kullanılır → grafik son noktası header ile birebir.
        if (data == null || data.isEmpty()) {
            String yahooSymbol = cleanSymbol.contains("=X") ? cleanSymbol : cleanSymbol + "TRY=X";
            log.warn("[CHART STRATEGY] EVDS'de {} için veri yok, Yahoo fallback: {}", evdsSymbol, yahooSymbol);
            return yahooChartClient.fetchChartHistory(yahooSymbol, range, interval, startDate, endDate);
        }

        // Canlı son-nokta patch'i sadece güncele uzanan range'lerde anlamlı. Geçmişte biten
        // custom aralıkta bugünün fiyatını eklemek veriyi bozar — bu yüzden atlanır.
        if (!"custom".equalsIgnoreCase(range)) {
            patchLastPointWithLiveRate(data, evdsSymbol);
        }
        return data;
    }

    /**
     * Bugüne ait son noktayı CurrencyService'in cache'lediği live forexSelling ile değiştirir.
     * Bugün için EVDS verisi varsa overwrite, yoksa append eder.
     */
    private void patchLastPointWithLiveRate(List<HistoricalDataDto> data, String currencyCode) {
        try {
            // Defansif okuma: cache hit'te getCurrencyRates() LinkedHashMap döner
            // (Redis serialization type bilgisini düşürür); cache miss'te CurrencyDto döner.
            BigDecimal sellingRate = extractForexSelling(currencyService.getCurrencyRates(), currencyCode);
            if (sellingRate == null) return;
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

    /**
     * {@code currencyService.getCurrencyRates()} cache-hit case'inde Redis'ten
     * {@code List<LinkedHashMap>}, miss-case'inde {@code List<CurrencyDto>} döner.
     * İkisinden de forexSelling'i defansif şekilde çıkarır.
     */
    private BigDecimal extractForexSelling(List<?> rates, String currencyCode) {
        if (rates == null || rates.isEmpty()) return null;
        for (Object obj : rates) {
            if (obj instanceof CurrencyDto dto) {
                if (currencyCode.equalsIgnoreCase(dto.getCurrencyCode())) {
                    return dto.getForexSelling();
                }
            } else if (obj instanceof java.util.Map<?, ?> map) {
                Object code = map.get("currencyCode");
                if (code != null && currencyCode.equalsIgnoreCase(code.toString())) {
                    Object fs = map.get("forexSelling");
                    return toBigDecimal(fs);
                }
            }
        }
        return null;
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return null;
        if (val instanceof BigDecimal bd) return bd;
        if (val instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        if (val instanceof String s) {
            try { return new BigDecimal(s); } catch (NumberFormatException ignored) { return null; }
        }
        return null;
    }
}
