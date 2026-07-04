package com.financeportal.domains.stock.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * İş Yatırım "Temel Değerler ve Oranlar" Özet tablosundan BİST hisseleri için
 * piyasa değeri (₺/$), halka açıklık %, sermaye ve sektör bilgisini kazır.
 *
 * Tek istekle TÜM hisseler (endeks=09) çekilir ve sembol→veri haritası bellekte cache'lenir
 * (REFRESH_MS aralığında yenilenir). Sayfa server-render HTML olduğundan auth/JS gerekmez.
 *
 * Özet satır kolonları (doğrulandı): [0]Kod [1]Ad [2]Sektör [3]Son Fiyat
 *   [4]Piyasa Değeri (mn ₺) [5]Piyasa Değeri (mn $) [6]Halka Açıklık % [7]Sermaye (mn ₺)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class IsYatirimFundamentalsClient {

    @Value("${external-api.isyatirim.fundamentals-url}")
    private String isYatirimFundamentalsUrl = "https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/sirket-karti.aspx";

    @Value("${app.sync.isyatirim-fundamentals-refresh-ms:1800000}")
    private long refreshMs = 1_800_000;

    private static final Pattern TBODY = Pattern.compile("id=\"temelTBody_Ozet\"[^>]*>(.*?)</tbody>", Pattern.DOTALL);
    private static final Pattern ROW = Pattern.compile("<tr[^>]*>(.*?)</tr>", Pattern.DOTALL);
    private static final Pattern CELL = Pattern.compile("<td[^>]*>(.*?)</td>", Pattern.DOTALL);
    private static final Pattern KOD = Pattern.compile("hisse=([A-Z0-9]{2,8})");

    private final RestTemplate restTemplate;

    // S3077: volatile referans concurrent write'ı korumaz; thread-safe primitive'ler kullan.
    private final java.util.concurrent.ConcurrentMap<String, Fundamentals> cache = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.concurrent.atomic.AtomicLong lastFetch = new java.util.concurrent.atomic.AtomicLong(0L);

    public record Fundamentals(String sector, Double marketCapTl, Double marketCapUsd,
                               Double freeFloatPct, Double capital) {}

    /** Sembol koduna (örn. "ASELS") göre temel veri; yoksa null. Cache bayatsa yenilenir. */
    public Fundamentals get(String code) {
        if (code == null) return null;
        ensureFresh();
        return cache.get(code.toUpperCase());
    }

    private synchronized void ensureFresh() {
        if (System.currentTimeMillis() - lastFetch.get() < refreshMs && !cache.isEmpty()) return;
        try {
            HttpHeaders h = new HttpHeaders();
            h.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            h.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
            h.set("Accept-Language", "tr-TR,tr;q=0.9");
            h.set("Referer", "https://www.isyatirim.com.tr/");
            ResponseEntity<String> res = restTemplate.exchange(isYatirimFundamentalsUrl, HttpMethod.GET, new HttpEntity<>(h), String.class);
            String body = res.getBody();
            if (body == null || body.isEmpty()) return;

            Matcher tb = TBODY.matcher(body);
            if (!tb.find()) { log.warn("[ISY-FUND] temelTBody_Ozet bulunamadı"); return; }

            Map<String, Fundamentals> parsed = new HashMap<>();
            Matcher rows = ROW.matcher(tb.group(1));
            while (rows.find()) {
                String row = rows.group(1);
                Matcher km = KOD.matcher(row);
                if (!km.find()) continue;
                String code = km.group(1).toUpperCase();

                Matcher cm = CELL.matcher(row);
                java.util.List<String> cells = new java.util.ArrayList<>();
                while (cm.find()) cells.add(stripTags(cm.group(1)));
                if (cells.size() < 8) continue;

                String sector = cells.get(2).isEmpty() ? null : cells.get(2);
                Double mcTl = parseTr(cells.get(4));   // mn ₺
                Double mcUsd = parseTr(cells.get(5));   // mn $
                Double free = parseTr(cells.get(6));    // %
                Double cap = parseTr(cells.get(7));     // mn ₺
                parsed.put(code, new Fundamentals(
                        sector,
                        mcTl != null ? mcTl * 1_000_000d : null,
                        mcUsd != null ? mcUsd * 1_000_000d : null,
                        free,
                        cap != null ? cap * 1_000_000d : null
                ));
            }
            if (!parsed.isEmpty()) {
                cache.clear();
                cache.putAll(parsed);
                lastFetch.set(System.currentTimeMillis());
                log.info("[ISY-FUND] {} hisse temel verisi cache'lendi", parsed.size());
            }
        } catch (Exception e) {
            log.warn("[ISY-FUND] Temel veri çekilemedi: {}", e.getMessage());
        }
    }

    private static String stripTags(String s) {
        return s.replaceAll("<[^>]+>", "").replaceAll("&nbsp;", " ").replaceAll("\\s+", " ").trim();
    }

    /** "1.748.760,0" → 1748760.0 (TR binlik nokta, ondalık virgül). */
    private static Double parseTr(String s) {
        if (s == null) return null;
        String c = s.replaceAll("[^0-9.,-]", "").trim();
        if (c.isEmpty() || c.equals("-")) return null;
        c = c.replace(".", "").replace(",", ".");
        try {
            return Double.parseDouble(c);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
