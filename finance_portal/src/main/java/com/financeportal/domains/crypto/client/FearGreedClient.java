package com.financeportal.domains.crypto.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.financeportal.domains.crypto.dto.FearGreedDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Crypto Fear &amp; Greed Index — alternative.me ücretsiz API'sinden (API key gerekmez).
 * Tüm günlük geçmiş (~8 yıl) tek istekte gelir; CryptoService 1 saat cache'ler (günde 1 güncellenir).
 * Sonuç timestamp'e göre ARTAN sıralı döner (grafik için).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FearGreedClient {

    private final RestTemplate restTemplate;

    @Value("${external-api.feargreed.url}")
    private String fearGreedUrl = "https://api.alternative.me/fng/?limit=0&format=json";

    public List<FearGreedDto> fetchAll() {
        List<FearGreedDto> out = new ArrayList<>();
        try {
            HttpHeaders h = new HttpHeaders();
            h.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            ResponseEntity<JsonNode> res = restTemplate.exchange(fearGreedUrl, HttpMethod.GET, new HttpEntity<>(h), JsonNode.class);
            JsonNode data = res.getBody() != null ? res.getBody().path("data") : null;
            if (data == null || !data.isArray()) {
                log.warn("[FEAR-GREED] Beklenen 'data' dizisi gelmedi");
                return out;
            }
            for (JsonNode n : data) {
                // value/timestamp string olarak gelir ("12"/"1780617600"); asInt/asLong coerce eder.
                int value = n.path("value").asInt(-1);
                long ts = n.path("timestamp").asLong(0);
                String cls = n.path("value_classification").asText(null);
                if (value >= 0 && ts > 0) {
                    out.add(new FearGreedDto(value, cls, ts));
                }
            }
            out.sort(Comparator.comparingLong(FearGreedDto::getTimestamp));
            log.info("[FEAR-GREED] {} günlük F&G noktası çekildi", out.size());
        } catch (Exception e) {
            log.warn("[FEAR-GREED] F&G verisi alınamadı: {}", e.getMessage());
        }
        return out;
    }
}
