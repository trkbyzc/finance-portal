package com.financeportal.domains.stock.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class IsYatirimIndexClient {

    private static final String BASE_URL =
            "https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/Temel-Degerler-Ve-Oranlar.aspx?endeks=%s";

    // İş Yatırım'ın endeks parametre kodu — dropdown'dan çıkardık.
    // endeks=01 → BIST 100 (100), endeks=03 → BIST 30 (30), endeks=05 → BIST 50 (50)
    private static final Map<String, String> ENDEKS_CODE = Map.of(
            "XU030", "03",
            "XU050", "05",
            "XU100", "01"
    );

    private static final Pattern TBODY_PATTERN = Pattern.compile(
            "<tbody[^>]*id=\"temelTBody_Ozet\"[^>]*>(.*?)</tbody>",
            Pattern.DOTALL
    );
    private static final Pattern HISSE_PATTERN = Pattern.compile("hisse=([A-Z0-9]{2,8})");

    private final RestTemplate restTemplate;

    /**
     * BIST endeksinin güncel sembol listesini İş Yatırım'dan çeker.
     * Sayfa HTML'i scrape edilir (JSON endpoint auth gerektiriyor).
     *
     * @param endeks "XU030", "XU050" veya "XU100"
     * @return Sembol seti, hata/parse fail durumunda boş set (caller fallback'e geçer)
     */
    public Set<String> fetchIndex(String endeks) {
        String code = ENDEKS_CODE.get(endeks);
        if (code == null) {
            log.warn("[ISYATIRIM_INDEX] Bilinmeyen endeks: {}", endeks);
            return Set.of();
        }

        String url = String.format(BASE_URL, code);
        try {
            HttpEntity<String> entity = new HttpEntity<>(browserHeaders());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            String body = response.getBody();
            if (body == null || body.isEmpty()) {
                log.warn("[ISYATIRIM_INDEX] {} için boş response", endeks);
                return Set.of();
            }

            Matcher tbody = TBODY_PATTERN.matcher(body);
            if (!tbody.find()) {
                log.warn("[ISYATIRIM_INDEX] {} için tbody#temelTBody_Ozet bulunamadı. İlk 200 char: {}",
                        endeks, body.substring(0, Math.min(200, body.length())));
                return Set.of();
            }

            Set<String> symbols = new LinkedHashSet<>();
            Matcher hisse = HISSE_PATTERN.matcher(tbody.group(1));
            while (hisse.find()) symbols.add(hisse.group(1));

            if (symbols.isEmpty()) {
                log.warn("[ISYATIRIM_INDEX] {} için hisse pattern eşleşmedi", endeks);
                return Set.of();
            }

            log.info("[ISYATIRIM_INDEX] {} → {} sembol çekildi", endeks, symbols.size());
            return symbols;
        } catch (Exception e) {
            log.warn("[ISYATIRIM_INDEX] {} çekilemedi: {}", endeks, e.getMessage());
            return Set.of();
        }
    }

    private HttpHeaders browserHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        h.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
        h.set("Accept-Language", "tr-TR,tr;q=0.9");
        h.set("Referer", "https://www.isyatirim.com.tr/");
        return h;
    }
}
