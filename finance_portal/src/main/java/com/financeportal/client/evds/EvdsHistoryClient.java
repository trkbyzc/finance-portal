package com.financeportal.client.evds;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * TCMB EVDS (Elektronik Veri Dağıtım Sistemi) için doğrudan Java client.
 * <p>
 * Önceki mimaride bunu bir Python worker yapıyordu (data_pipeline/evds_worker.py)
 * ve Redis'i dolduruyordu. Artık Java tarafında native — service'ler bu client'a delegasyon yapar.
 * <p>
 * EVDS public REST API formatı:
 * <pre>
 *   GET https://evds2.tcmb.gov.tr/service/evds/series={seri-kodu}
 *       &startDate=dd-MM-yyyy&endDate=dd-MM-yyyy&type=json
 *       Header: key={API_KEY}
 * </pre>
 * Response:
 * <pre>
 *   { "items": [ {"Tarih":"01-01-2003","TP_DK_USD_S_YTL":"1.6478"}, ... ] }
 * </pre>
 * Item içindeki seri-key dot ('.') → underscore ('_') dönüşümü ile gelir.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EvdsHistoryClient {

    private static final DateTimeFormatter EVDS_DATE = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final String DEFAULT_BASE_URL = "https://evds2.tcmb.gov.tr/service/evds";

    private final RestTemplate restTemplate;

    @Value("${external-api.evds.base-url:" + DEFAULT_BASE_URL + "}")
    private String evdsBaseUrl;

    @Value("${external-api.evds.api-key:${EVDS_API_KEY:}}")
    private String evdsApiKey;

    /**
     * Tek bir seriyi tarih aralığı ile çeker. Hata olursa boş liste döner.
     * <p>
     * @param seriesCode EVDS seri kodu (örn. <code>TP.DK.USD.S.YTL</code>)
     * @param fromDate dahil
     * @param toDate dahil
     * @return Her item <code>{date, value}</code> map'i; ham EVDS verisinden ayıklanmış.
     */
    public List<Map<String, Object>> fetchSeries(String seriesCode, LocalDate fromDate, LocalDate toDate) {
        if (seriesCode == null || seriesCode.isBlank()) return List.of();
        if (evdsApiKey == null || evdsApiKey.isBlank()) {
            log.warn("[EVDS] API key set değil. external-api.evds.api-key veya EVDS_API_KEY env var ekle.");
            return List.of();
        }

        String url = String.format("%s/series=%s&startDate=%s&endDate=%s&type=json",
                trimSlash(evdsBaseUrl),
                seriesCode,
                fromDate.format(EVDS_DATE),
                toDate.format(EVDS_DATE)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.set("key", evdsApiKey);
        headers.set("User-Agent", "Mozilla/5.0 (Java EvdsHistoryClient)");
        headers.set("Accept", "application/json");

        try {
            long startTime = System.currentTimeMillis();
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), JsonNode.class);
            JsonNode body = response.getBody();
            if (body == null) return List.of();

            JsonNode items = body.path("items");
            if (!items.isArray()) {
                log.warn("[EVDS] {} için 'items' array yok. Response: {}", seriesCode,
                        body.toString().substring(0, Math.min(200, body.toString().length())));
                return List.of();
            }

            String columnKey = seriesCode.replace('.', '_');
            List<Map<String, Object>> out = new ArrayList<>(items.size());
            for (JsonNode it : items) {
                String tarih = it.path("Tarih").asText(null);
                JsonNode valNode = it.path(columnKey);
                if (tarih == null || valNode.isMissingNode() || valNode.isNull()) continue;
                String valStr = valNode.asText("").trim();
                if (valStr.isEmpty() || "null".equalsIgnoreCase(valStr)) continue;
                Double val;
                try { val = Double.parseDouble(valStr); } catch (NumberFormatException ignored) { continue; }
                if (val == null || Double.isNaN(val)) continue;

                LocalDate date;
                try { date = LocalDate.parse(tarih, EVDS_DATE); } catch (Exception ignored) { continue; }

                Map<String, Object> point = new LinkedHashMap<>();
                point.put("date", date.toString()); // ISO yyyy-MM-dd → Redis JSON için tutarlı
                point.put("close", val);
                point.put("value", val);
                point.put("rate", val);
                out.add(point);
            }

            log.info("[EVDS] {} → {} nokta çekildi ({} - {}, {} ms)",
                    seriesCode, out.size(), fromDate, toDate, (System.currentTimeMillis() - startTime));
            return out;
        } catch (Exception e) {
            log.warn("[EVDS] {} çekilemedi: {}", seriesCode, e.getMessage());
            return List.of();
        }
    }

    /** Bugüne kadar en fazla {@code yearsBack} yıl geriye giderek tüm seriyi getirir. */
    public List<Map<String, Object>> fetchSeriesYears(String seriesCode, int yearsBack) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusYears(Math.max(1, yearsBack));
        return fetchSeries(seriesCode, from, to);
    }

    private String trimSlash(String s) {
        if (s == null) return DEFAULT_BASE_URL;
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
