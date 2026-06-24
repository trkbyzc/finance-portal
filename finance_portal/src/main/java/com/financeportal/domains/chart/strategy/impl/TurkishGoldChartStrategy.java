package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.client.yahoo.YahooChartClient;
import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.domains.commodity.service.CommodityService;
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
    private final CommodityService commodityService;

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
                || upper.contains("BILEZIK")
                // Karşılaştırma widget'ı her varlığı yahooSymbol ile çağırır; TR altın türlerinin
                // hepsi "XAUTRY=X" kullanır (CommodityService). Bunu da gram altın gibi tanı.
                || upper.contains("XAUTRY");
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

        // Sentetik seri "saf" gram altın (GC=F × USDTRY ÷ 31.1) — TR piyasa primi YOK. Truncgil
        // canlı fiyatı primi içerir; bu yüzden grafiğin son noktası ile detay sayfasındaki canlı
        // fiyat uyuşmuyordu. Çözüm: seriyi canlı fiyata DEMİRLE — son nokta = canlı fiyat, tüm seri
        // aynı oranla ölçeklenir. Sabitle çarpım yüzde hareketleri bozmaz (eğri şekli birebir aynı);
        // symbol bazlı olduğu için gram/çeyrek/tam altın kendi canlı fiyatına oturur.
        anchorToLivePrice(symbol, result);

        log.info("[TR-GOLD] Synthesized {}: {} nokta gram-altın-TRY", symbol, result.size());
        return result;
    }

    /** Sentetik seriyi varlığın Truncgil canlı fiyatına ölçekleyerek demirler (son nokta = canlı fiyat). */
    private void anchorToLivePrice(String symbol, List<HistoricalDataDto> series) {
        if (series.isEmpty()) return;
        BigDecimal live = liveTurkishGoldPrice(symbol);
        if (live == null || live.signum() <= 0) {
            log.debug("[TR-GOLD] {} için canlı fiyat yok, demirleme atlandı.", symbol);
            return;
        }
        BigDecimal syntheticLast = series.get(series.size() - 1).getClose();
        if (syntheticLast == null || syntheticLast.signum() <= 0) return;

        BigDecimal ratio = live.divide(syntheticLast, 8, RoundingMode.HALF_UP);
        for (HistoricalDataDto d : series) {
            d.setOpen(scale(d.getOpen(), ratio));
            d.setHigh(scale(d.getHigh(), ratio));
            d.setLow(scale(d.getLow(), ratio));
            d.setClose(scale(d.getClose(), ratio));
            d.setPrice(scale(d.getPrice(), ratio));
        }
        log.info("[TR-GOLD] {} canlı fiyata demirlendi (ratio={}, canlı={}).", symbol, ratio, live);
    }

    /**
     * Truncgil canlı Türk altını listesinden bu sembolün satış fiyatını bulur (5 dk cache'li).
     * Cache Redis'te JSON tuttuğu için liste cache-hit'te {@code List<LinkedHashMap>} olarak döner
     * (generic tip silinmesi); bu yüzden hem tipli {@link CommodityDto}'yu hem de Map halini ele alıyoruz.
     */
    private BigDecimal liveTurkishGoldPrice(String symbol) {
        try {
            String target = normalizeGoldSymbol(symbol);
            // XAUTRY=X = gram altının yahooSymbol'ü → canlı fiyatını GRAM_ALTIN'den al.
            if (target.contains("XAUTRY")) target = "GRAM_ALTIN";
            List<?> live = commodityService.getTurkishGold();
            if (live == null) return null;
            for (Object item : live) {
                String sym;
                BigDecimal price;
                if (item instanceof CommodityDto dto) {            // cache-miss: tipli
                    sym = dto.getSymbol();
                    price = dto.getPrice();
                } else if (item instanceof Map<?, ?> map) {        // cache-hit: JSON → LinkedHashMap
                    Object s = map.get("symbol");
                    sym = s == null ? null : s.toString();
                    price = toBigDecimal(map.get("price"));
                } else {
                    continue;
                }
                if (sym != null && normalizeGoldSymbol(sym).equals(target)
                        && price != null && price.signum() > 0) {
                    return price;
                }
            }
            return null;
        } catch (Exception e) {
            log.warn("[TR-GOLD] {} canlı fiyatı alınamadı: {}", symbol, e.getMessage());
            return null;
        }
    }

    private static String normalizeGoldSymbol(String s) {
        return s == null ? "" : s.toUpperCase(java.util.Locale.ROOT).replace('İ', 'I').replace('ı', 'I');
    }

    private static BigDecimal toBigDecimal(Object v) {
        if (v == null) return null;
        if (v instanceof BigDecimal bd) return bd;
        if (v instanceof Number n) return new BigDecimal(n.toString());
        try {
            return new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static BigDecimal scale(BigDecimal v, BigDecimal ratio) {
        return v == null ? null : v.multiply(ratio).setScale(4, RoundingMode.HALF_UP);
    }
}
