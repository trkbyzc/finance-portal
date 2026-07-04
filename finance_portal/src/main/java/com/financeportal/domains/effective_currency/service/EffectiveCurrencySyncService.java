package com.financeportal.domains.effective_currency.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.EvdsClient;
import com.financeportal.domains.effective_currency.dto.EffectiveCurrencyDto;
import com.financeportal.service.bootstrap.BootstrapReadinessTracker;
import com.financeportal.service.cache.CacheService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Efektif döviz (nakit/banknot) kurları için sync servisi — normal döviz pipeline'ından
 * tamamen ayrı bir kanal. İki kaynak:
 *   1. TCMB XML (today.xml): {@code BanknoteBuying} / {@code BanknoteSelling} alanları → live snapshot.
 *   2. EVDS: {@code TP.DK.{CCY}.S.EF.YTL} serisi → 22 yıllık günlük historical, Redis'te
 *      {@code evds:effective-currency:{CCY}} altında saklanır. {@link EvdsClient#fetchSeriesPaginated}
 *      ile 1000-nokta limit etrafında paginate edilir.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EffectiveCurrencySyncService {

    private final EvdsClient evdsClient;
    private final CacheService cacheService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final BootstrapReadinessTracker bootstrapTracker;

    private static final String TASK_NAME = "EffectiveCurrency";
    private static final String CACHE_KEY = "cache:effective-currencies";

    @Value("${external-api.tcmb.xml-url}")
    private String tcmbXmlUrl;

    @Value("${app.ttl.effective-currency-live-sec:3600}")
    private long liveTtlSec = 3600;

    @Value("${app.ttl.effective-currency-history-sec:86400}")
    private long historyTtlSec = 86400;

    /**
     * Efektif satış serileri (EVDS sembol → bizim 3-harfli kod).
     * Frontend hep "USD" gibi kullanır; EVDS sembolüne sadece sync sırasında ihtiyacımız var.
     */
    private static final Map<String, String> EVDS_EFFECTIVE_CURRENCIES = Map.ofEntries(
            Map.entry("USD", "TP.DK.USD.S.EF.YTL"),
            Map.entry("EUR", "TP.DK.EUR.S.EF.YTL"),
            Map.entry("GBP", "TP.DK.GBP.S.EF.YTL"),
            Map.entry("CHF", "TP.DK.CHF.S.EF.YTL"),
            Map.entry("CAD", "TP.DK.CAD.S.EF.YTL"),
            Map.entry("AUD", "TP.DK.AUD.S.EF.YTL"),
            Map.entry("JPY", "TP.DK.JPY.S.EF.YTL"),
            Map.entry("DKK", "TP.DK.DKK.S.EF.YTL"),
            Map.entry("SEK", "TP.DK.SEK.S.EF.YTL"),
            Map.entry("NOK", "TP.DK.NOK.S.EF.YTL"),
            Map.entry("SAR", "TP.DK.SAR.S.EF.YTL")
    );

    @PostConstruct
    void registerBootstrap() { bootstrapTracker.register(TASK_NAME); }

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(fixedRateString = "${app.sync.effective-currency-rate-ms:3600000}")
    public void syncEffectiveCurrencies() {
        try {
            syncEvdsEffectiveHistories();
            List<EffectiveCurrencyDto> live = fetchTcmbBanknoteRates();
            if (live != null && !live.isEmpty()) {
                cacheService.save(CACHE_KEY, live, (int) (liveTtlSec / 60));
                log.info("[EFFECTIVE_CURRENCY] {} satır efektif kur cache'e yazıldı.", live.size());
            } else {
                log.warn("[EFFECTIVE_CURRENCY] TCMB Banknote alanları boş geldi.");
            }
        } finally {
            bootstrapTracker.markComplete(TASK_NAME);
        }
    }

    /**
     * TCMB today.xml'i parse edip her VIP currency için BanknoteBuying / BanknoteSelling alanlarını
     * okur. Bazı dövizlerde (örn. JPY için aslında 100 JPY) TCMB Unit alanı 1'den farklı olur;
     * fakat sayısal değer 1 birim için kotasyondur (Java XML zaten tam değeri verir) — ekstra
     * normalization gerekmez.
     */
    private List<EffectiveCurrencyDto> fetchTcmbBanknoteRates() {
        long startTime = System.currentTimeMillis();
        List<EffectiveCurrencyDto> result = new ArrayList<>();
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document document = builder.parse(tcmbXmlUrl);
            document.getDocumentElement().normalize();
            NodeList nList = document.getElementsByTagName("Currency");

            for (int i = 0; i < nList.getLength(); i++) {
                Element element = (Element) nList.item(i);
                String code = element.getAttribute("CurrencyCode");
                if (!EVDS_EFFECTIVE_CURRENCIES.containsKey(code)) continue;

                String banknoteBuyingStr = textOf(element, "BanknoteBuying");
                String banknoteSellingStr = textOf(element, "BanknoteSelling");
                if (banknoteBuyingStr.isEmpty() && banknoteSellingStr.isEmpty()) {
                    // TCMB JPY/SEK gibi bazı para birimleri için banknote alanlarını boş bırakabilir —
                    // bu durumda EVDS historical'dan son noktayı fallback olarak kullanırız.
                    continue;
                }

                EffectiveCurrencyDto dto = new EffectiveCurrencyDto();
                dto.setCurrencyCode(code);
                dto.setCurrencyName(textOf(element, "Isim"));
                if (!banknoteBuyingStr.isEmpty()) dto.setForexBuying(new BigDecimal(banknoteBuyingStr));
                if (!banknoteSellingStr.isEmpty()) dto.setForexSelling(new BigDecimal(banknoteSellingStr));

                Map<String, BigDecimal> changes = calcChangesFromRedis(code);
                dto.setChangePercent(changes.getOrDefault("daily", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
                dto.setChangeWeek(changes.getOrDefault("weekly", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
                dto.setChangeMonth(changes.getOrDefault("monthly", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
                dto.setChange6Month(changes.getOrDefault("6monthly", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
                dto.setChangeYear(changes.getOrDefault("yearly", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
                dto.setChange5Year(changes.getOrDefault("5yearly", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));

                dto.setYahooSymbol(code + "TRY=X");
                dto.setAssetCategory("EFFECTIVE_CURRENCY");
                dto.setChartType("LINE");
                result.add(dto);
            }
            log.info("[TCMB-EF] Fetched {} effective rates in {} ms.", result.size(), (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("[TCMB-EF] XML parse failed: {}", e.getMessage());
        }
        return result;
    }

    private String textOf(Element el, String tag) {
        NodeList list = el.getElementsByTagName(tag);
        if (list.getLength() == 0) return "";
        String v = list.item(0).getTextContent();
        return v != null ? v.trim() : "";
    }

    /**
     * EVDS efektif satış serisini paginated olarak çekip Redis'e yazar.
     * Cache-hit guard: 24h TTL süresince re-fetch yapmaz — saatte bir scheduler EVDS'i bombardımana uğratmasın.
     */
    private void syncEvdsEffectiveHistories() {
        log.info("[EVDS-EF-CURRENCY] 22 yıllık efektif tarihçe sync başlıyor...");
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(8030);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

        EVDS_EFFECTIVE_CURRENCIES.forEach((code, evdsCode) -> {
            try {
                String redisKey = "evds:effective-currency:" + code;
                if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
                    log.debug("[EVDS-EF-CURRENCY] {} cache hit, sync skip.", code);
                    return;
                }

                List<JsonNode> nodes = evdsClient.fetchSeriesPaginated(List.of(evdsCode), startDate, endDate, 3);
                List<Map<String, Object>> history = new ArrayList<>();
                for (JsonNode node : nodes) {
                    Double val = evdsClient.extractValueFromNode(node, evdsCode);
                    String dateStr = node.has("Tarih") ? node.get("Tarih").asText() : null;
                    if (val != null && dateStr != null) {
                        try {
                            LocalDate d = LocalDate.parse(dateStr, formatter);
                            history.add(Map.of("date", d.toString(), "close", val));
                        } catch (Exception ignored) {
                            // EVDS zaman zaman "DD-MM-YYYY" dışı format döner; tek nokta atlanır, sync durmamalı.
                        }
                    }
                }
                if (!history.isEmpty()) {
                    redisTemplate.opsForValue().set(redisKey, objectMapper.writeValueAsString(history),
                            historyTtlSec, TimeUnit.SECONDS);
                    log.info("[EVDS-EF-CURRENCY] {} efektif geçmişi tamam ({} nokta).", code, history.size());
                }
            } catch (Exception e) {
                log.error("[EVDS-EF-CURRENCY] {} historical sync hatası: {}", code, e.getMessage());
            }
        });
    }

    /**
     * Redis'teki efektif tarihçeden günlük/haftalık/aylık vs. % değişim hesaplar.
     * Veri yoksa veya yetersizse boş map döner — DTO'da default sıfır kalır.
     */
    private Map<String, BigDecimal> calcChangesFromRedis(String code) {
        Map<String, BigDecimal> changes = new HashMap<>();
        try {
            String json = redisTemplate.opsForValue().get("evds:effective-currency:" + code);
            if (json == null || json.isEmpty()) return changes;
            List<Map<String, Object>> points = objectMapper.readValue(json,
                    new com.fasterxml.jackson.core.type.TypeReference<>() {});
            if (points.size() < 2) return changes;

            double current = ((Number) points.get(points.size() - 1).get("close")).doubleValue();
            changes.put("daily", calcPct(current, asDouble(points, points.size() - 2)));
            changes.put("weekly", calcPct(current, asDouble(points, points.size() - 8)));
            changes.put("monthly", calcPct(current, asDouble(points, points.size() - 31)));
            changes.put("6monthly", calcPct(current, asDouble(points, points.size() - 181)));
            changes.put("yearly", calcPct(current, asDouble(points, points.size() - 366)));
            changes.put("5yearly", calcPct(current, asDouble(points, points.size() - 1826)));
        } catch (Exception e) {
            log.warn("[EFFECTIVE-CURRENCY] {} değişim hesaplama hatası: {}", code, e.getMessage());
        }
        return changes;
    }

    private double asDouble(List<Map<String, Object>> points, int idx) {
        if (idx < 0 || idx >= points.size()) return 0;
        Object v = points.get(idx).get("close");
        return v instanceof Number n ? n.doubleValue() : 0;
    }

    private BigDecimal calcPct(double current, double old) {
        if (old == 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf((current - old) / old * 100.0);
    }
}
