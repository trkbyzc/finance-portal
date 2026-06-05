package com.financeportal.domains.stock.client;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * BİST hisseleri için şirket logosu sağlar. Logo kimliklerini (logoid) TradingView'in
 * Türkiye scanner'ından tek istekle çeker (607 hisse), sembol→logoid haritasını bellekte
 * cache'ler (24 saatte bir yenilenir). Logo URL'i TradingView'in hotlink-dostu SVG CDN'i:
 *   https://s3-symbol-logo.tradingview.com/{logoid}--big.svg
 *
 * Best-effort: scanner başarısızsa logo gelmez (frontend sembol baş harflerine düşer).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BistLogoClient {

    private static final String SCANNER_URL = "https://scanner.tradingview.com/turkey/scan";
    private static final String SCANNER_BODY =
            "{\"symbols\":{\"query\":{\"types\":[\"stock\"]}},\"columns\":[\"name\",\"logoid\"],\"range\":[0,1500]}";
    private static final String LOGO_BASE = "https://s3-symbol-logo.tradingview.com/";
    private static final long REFRESH_MS = 24 * 60 * 60 * 1000L; // 24 saat

    private final RestTemplate restTemplate;

    private volatile Map<String, String> cache = new HashMap<>(); // ticker(UPPER) → logoid
    private volatile long lastFetch = 0L;

    /** Sembol koduna (ASELS ya da ASELS.IS) göre logo URL'i; logo yoksa null. */
    public String getLogoUrl(String code) {
        if (code == null) return null;
        ensureFresh();
        String key = code.trim().toUpperCase().replace(".IS", "");
        String logoid = cache.get(key);
        return (logoid != null && !logoid.isBlank()) ? LOGO_BASE + logoid + "--big.svg" : null;
    }

    private synchronized void ensureFresh() {
        if (System.currentTimeMillis() - lastFetch < REFRESH_MS && !cache.isEmpty()) return;
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            h.set("Origin", "https://www.tradingview.com");
            h.set("Referer", "https://www.tradingview.com/");

            ResponseEntity<JsonNode> res = restTemplate.exchange(
                    SCANNER_URL, HttpMethod.POST, new HttpEntity<>(SCANNER_BODY, h), JsonNode.class);
            JsonNode data = res.getBody() != null ? res.getBody().path("data") : null;
            if (data == null || !data.isArray()) {
                log.warn("[BIST-LOGO] scanner beklenen 'data' dizisini döndürmedi");
                return;
            }

            Map<String, String> parsed = new HashMap<>();
            for (JsonNode row : data) {
                JsonNode d = row.path("d");
                if (d.isArray() && d.size() >= 2) {
                    String ticker = d.get(0).asText(null);
                    String logoid = d.get(1).asText("");
                    if (ticker != null && !ticker.isBlank()) {
                        parsed.put(ticker.toUpperCase(), logoid);
                    }
                }
            }
            if (!parsed.isEmpty()) {
                cache = parsed;
                lastFetch = System.currentTimeMillis();
                log.info("[BIST-LOGO] {} hisse logoid cache'lendi", parsed.size());
            }
        } catch (Exception e) {
            log.warn("[BIST-LOGO] logoid çekilemedi: {}", e.getMessage());
        }
    }
}
