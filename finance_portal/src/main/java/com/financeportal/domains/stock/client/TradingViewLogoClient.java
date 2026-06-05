package com.financeportal.domains.stock.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * TradingView'in hotlink-dostu SVG logo CDN'inden varlık ikonları sağlar:
 *   https://s3-symbol-logo.tradingview.com/{logoid}--big.svg
 *
 * Kaynaklar:
 *   - BİST hisseleri: Türkiye scanner (tüm hisseler, tek istek, 24s cache).
 *   - ABD hisse/ETF : America scanner, istenen sembollerle FİLTRELİ (evren çok büyük olduğu için).
 *   - Emtialar      : statik sembol→slug haritası (metal/petrol/tarım) + altın/gümüş anahtar kelime.
 *
 * Best-effort: kaynak başarısızsa null döner (frontend sembol baş harflerine düşer).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TradingViewLogoClient {

    private static final String LOGO_BASE = "https://s3-symbol-logo.tradingview.com/";
    private static final long REFRESH_MS = 24 * 60 * 60 * 1000L;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // BİST: ticker(UPPER) → logoid
    private volatile Map<String, String> bistCache = new HashMap<>();
    private volatile long bistLastFetch = 0L;

    // ABD: ticker(UPPER) → logoid ("" = logosu yok, tekrar sorgulanmasın)
    private final Map<String, String> usCache = new HashMap<>();
    private volatile long usLastFetch = 0L;

    private String logoUrl(String logoid) {
        return (logoid != null && !logoid.isBlank()) ? LOGO_BASE + logoid + "--big.svg" : null;
    }

    private String norm(String code) {
        return code == null ? null : code.trim().toUpperCase().replace(".IS", "");
    }

    // ---------------------------------------------------------------- BİST
    /** BİST sembolüne (ASELS / ASELS.IS) göre logo URL'i; yoksa null. */
    public String bistLogo(String code) {
        if (code == null) return null;
        ensureBist();
        return logoUrl(bistCache.get(norm(code)));
    }

    private synchronized void ensureBist() {
        if (System.currentTimeMillis() - bistLastFetch < REFRESH_MS && !bistCache.isEmpty()) return;
        Map<String, String> parsed = fetchScanner("turkey",
                "{\"symbols\":{\"query\":{\"types\":[\"stock\"]}},\"columns\":[\"name\",\"logoid\"],\"range\":[0,1500]}");
        if (!parsed.isEmpty()) {
            bistCache = parsed;
            bistLastFetch = System.currentTimeMillis();
            log.info("[TV-LOGO] {} BİST logoid cache'lendi", parsed.size());
        }
    }

    // ---------------------------------------------------------------- ABD
    /** Verilen ABD sembolleri için {sembol → logoUrl} (logosu olmayanlar haritada yer almaz). */
    public synchronized Map<String, String> usLogos(Collection<String> symbols) {
        if (symbols == null || symbols.isEmpty()) return Map.of();
        if (System.currentTimeMillis() - usLastFetch >= REFRESH_MS) {
            usCache.clear(); // 24s'te bir tazele
        }
        List<String> missing = symbols.stream().map(this::norm)
                .filter(Objects::nonNull).distinct()
                .filter(s -> !usCache.containsKey(s)).toList();
        if (!missing.isEmpty()) {
            Map<String, String> fetched = fetchScanner("america", filteredBody(missing));
            for (String s : missing) {
                String logoid = fetched.get(s);
                usCache.put(s, logoid != null ? logoid : ""); // "" → "logosu yok", tekrar sorgulama
            }
            usLastFetch = System.currentTimeMillis();
            log.info("[TV-LOGO] {} ABD sembolü için logoid sorgulandı", missing.size());
        }
        Map<String, String> out = new HashMap<>();
        for (String s : symbols) {
            String url = logoUrl(usCache.get(norm(s)));
            if (url != null) out.put(s, url);
        }
        return out;
    }

    private String filteredBody(List<String> tickers) {
        try {
            Map<String, Object> filter = Map.of("left", "name", "operation", "in_range", "right", tickers);
            Map<String, Object> body = Map.of(
                    "symbols", Map.of("query", Map.of("types", List.of())),
                    "columns", List.of("name", "logoid"),
                    "filter", List.of(filter),
                    "range", List.of(0, tickers.size() + 10));
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            return "{}";
        }
    }

    // ---------------------------------------------------------------- Emtia
    // Yahoo futures sembolü → TradingView logo slug'ı.
    private static final Map<String, String> COMMODITY_SLUGS = Map.ofEntries(
            Map.entry("GC=F", "metal/gold"),
            Map.entry("SI=F", "metal/silver"),
            Map.entry("PL=F", "metal/platinum"),
            Map.entry("PA=F", "metal/palladium"),
            Map.entry("HG=F", "metal/copper"),
            Map.entry("CL=F", "crude-oil"),
            Map.entry("BZ=F", "crude-oil"),
            Map.entry("NG=F", "natural-gas"),
            Map.entry("ZW=F", "wheat"),
            Map.entry("ZC=F", "corn"),
            Map.entry("KC=F", "coffee"),
            Map.entry("CT=F", "cotton"));

    /** Emtia/altın sembolüne göre logo URL'i. Önce Yahoo futures haritası, sonra altın/gümüş anahtar kelime. */
    public String commodityLogo(String symbol) {
        if (symbol == null) return null;
        String slug = COMMODITY_SLUGS.get(symbol.trim().toUpperCase());
        if (slug == null) {
            String up = symbol.trim().toUpperCase();
            if (up.contains("ALTIN") || up.contains("GOLD") || up.contains("GAU") || up.contains("XAU")) {
                slug = "metal/gold";
            } else if (up.contains("GUMUS") || up.contains("GÜMÜŞ") || up.contains("SILVER") || up.contains("XAG")) {
                slug = "metal/silver";
            }
        }
        return slug != null ? LOGO_BASE + slug + ".svg" : null;
    }

    // ---------------------------------------------------------------- ortak
    private Map<String, String> fetchScanner(String market, String body) {
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            h.set("Origin", "https://www.tradingview.com");
            h.set("Referer", "https://www.tradingview.com/");

            ResponseEntity<JsonNode> res = restTemplate.exchange(
                    "https://scanner.tradingview.com/" + market + "/scan",
                    HttpMethod.POST, new HttpEntity<>(body, h), JsonNode.class);
            JsonNode data = res.getBody() != null ? res.getBody().path("data") : null;
            if (data == null || !data.isArray()) return Map.of();

            Map<String, String> parsed = new HashMap<>();
            for (JsonNode row : data) {
                JsonNode d = row.path("d");
                if (d.isArray() && d.size() >= 2) {
                    String ticker = d.get(0).asText(null);
                    if (ticker != null && !ticker.isBlank()) {
                        parsed.put(ticker.toUpperCase(), d.get(1).asText(""));
                    }
                }
            }
            return parsed;
        } catch (Exception e) {
            log.warn("[TV-LOGO] {} scanner logoid çekilemedi: {}", market, e.getMessage());
            return Map.of();
        }
    }
}
