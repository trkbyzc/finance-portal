package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.client.yahoo.YahooChartClient;
import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Turkish gold variants (GRAM_ALTIN, CEYREK_ALTIN, TAM_ALTIN, CUMHURIYET_ALTINI, etc.)
 * for which Truncgil only publishes a live <code>today.json</code> price — no historical
 * endpoint, and the <code>XAUTRY=X</code> Yahoo symbol that the live DTO advertises
 * actually 404s.
 * <p>
 * Synthesizes <strong>gram gold TRY</strong> for any past date from two real Yahoo
 * series:
 * <pre>
 *   gram_gold_TRY = GC=F (USD/oz)  ×  USDTRY=X (TRY/USD)  ÷  31.1034768 (g/oz)
 * </pre>
 * <p>
 * Every gold variant shares the same percentage curve (quarter/half/full coins all
 * move proportionally with gram gold), so this single series is sufficient for any
 * simulation or chart of any TR gold type.
 */
@Component
@Order(2) // Before YahooDefaultChartStrategy (9999)
@RequiredArgsConstructor
@Slf4j
public class TurkishGoldChartStrategy implements ChartDataStrategy {

    private static final BigDecimal OZ_TO_GRAM = new BigDecimal("31.1034768");

    private final YahooChartClient yahooChartClient;

    @Override
    public boolean supports(String category, String symbol) {
        if (!"COMMODITY".equalsIgnoreCase(category) || symbol == null) return false;
        // Turkish-locale toUpperCase("gram-altin") → "GRAM_ALTİN" (dotted İ),
        // ama bizim sabit string'lerimiz ASCII I ile. Normalize ile İ/ı → I.
        String upper = symbol.toUpperCase(java.util.Locale.ROOT)
                .replace('İ', 'I')
                .replace('ı', 'I');
        return upper.endsWith("_ALTIN")
                || "GRAM_HAS_ALTIN".equals(upper)
                || "CUMHURIYET_ALTINI".equals(upper)
                || upper.contains("ALTIN")
                || upper.contains("BILEZIK");
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate) {
        log.info("[CHART STRATEGY] TR Altın synthesis ({}): GC=F × USDTRY=X ÷ 31.1035", symbol);

        List<HistoricalDataDto> gcf = yahooChartClient.fetchChartHistory("GC=F", range, interval, startDate, endDate);
        if (gcf == null || gcf.isEmpty()) {
            log.warn("[TR-GOLD] GC=F historical boş.");
            return List.of();
        }
        List<HistoricalDataDto> usd = yahooChartClient.fetchChartHistory("USDTRY=X", range, interval, startDate, endDate);
        if (usd == null || usd.isEmpty()) {
            log.warn("[TR-GOLD] USDTRY=X historical boş.");
            return List.of();
        }

        // USDTRY'yi date'e göre indexle (O(1) lookup).
        Map<LocalDate, BigDecimal> usdMap = new HashMap<>();
        for (HistoricalDataDto p : usd) {
            if (p.getDate() != null && p.getClose() != null && p.getClose().signum() > 0) {
                usdMap.put(p.getDate(), p.getClose());
            }
        }
        if (usdMap.isEmpty()) {
            log.warn("[TR-GOLD] USDTRY map boş (close değerleri parse edilemedi).");
            return List.of();
        }

        // GC=F üzerinden yürü; her gün için (yoksa son bilinen USDTRY'yi kullan).
        List<HistoricalDataDto> result = new ArrayList<>(gcf.size());
        BigDecimal lastUsdTry = null;
        for (HistoricalDataDto p : gcf) {
            if (p.getDate() == null || p.getClose() == null || p.getClose().signum() <= 0) continue;
            BigDecimal usdTry = usdMap.get(p.getDate());
            if (usdTry == null) usdTry = lastUsdTry;
            if (usdTry == null) continue;
            lastUsdTry = usdTry;

            BigDecimal gramTry = p.getClose()
                    .multiply(usdTry)
                    .divide(OZ_TO_GRAM, 4, RoundingMode.HALF_UP);

            HistoricalDataDto dto = new HistoricalDataDto();
            dto.setDate(p.getDate());
            dto.setTimestamp(p.getTimestamp());
            dto.setOpen(gramTry); dto.setHigh(gramTry); dto.setLow(gramTry);
            dto.setClose(gramTry); dto.setPrice(gramTry); dto.setVolume(0L);
            result.add(dto);
        }

        log.info("[TR-GOLD] Synthesized {}: {} nokta gram-altın-TRY", symbol, result.size());
        return result;
    }
}
