package com.financeportal.domains.economy_us.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Federal Reserve Economic Data (FRED, St. Louis FED) generic client.
 * Belli bir series_id için /fred/series/observations endpoint'ini çağırır.
 *
 * Bilinen series_id örnekleri:
 *   - CPIAUCSL          : ABD CPI (aylık seasonally adjusted index)
 *   - IRLTLT01TRM156N   : Türkiye 10Y uzun vadeli devlet tahvili getirisi (aylık %)
 *
 * Response shape:
 *   { "observations": [ { "date": "2024-01-01", "value": "308.417" }, ... ] }
 *
 * API key boşsa fetch atlanır, log warn atılır (sync graceful fail).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FredClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${external-api.fred.base-url}")
    private String baseUrl;

    @Value("${external-api.fred.api-key:}")
    private String apiKey;

    private static final DateTimeFormatter FRED_DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE; // yyyy-MM-dd

    public List<Map<String, Object>> fetchObservations(String seriesId, LocalDate start, LocalDate end) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[FRED] FRED_API_KEY ortam değişkeni boş — {} sync'i atlanıyor.", seriesId);
            return new ArrayList<>();
        }

        String url = String.format(
                "%s/fred/series/observations?series_id=%s&api_key=%s&file_type=json&observation_start=%s&observation_end=%s",
                baseUrl, seriesId, apiKey, start.format(FRED_DATE_FMT), end.format(FRED_DATE_FMT)
        );

        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
                if (response.getBody() == null) return new ArrayList<>();

                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode obs = root.path("observations");
                if (!obs.isArray()) return new ArrayList<>();

                List<Map<String, Object>> result = new ArrayList<>();
                for (JsonNode point : obs) {
                    String dateStr = point.path("date").asText(null);
                    String valStr = point.path("value").asText(null);
                    if (dateStr == null || valStr == null || valStr.equals(".") || valStr.isBlank()) continue;

                    try {
                        double value = Double.parseDouble(valStr);
                        LocalDate parsedDate = LocalDate.parse(dateStr, FRED_DATE_FMT);
                        result.add(Map.of(
                                "date", parsedDate.toString(),
                                "label", parsedDate.format(DateTimeFormatter.ofPattern("yyyy-MM")),
                                "value", value
                        ));
                    } catch (Exception ignored) {}
                }
                log.info("[FRED] {} için {} gözlem alındı.", seriesId, result.size());
                return result;
            } catch (Exception e) {
                log.warn("[FRED] {} attempt {}/{} failed: {}", seriesId, attempt, maxRetries, e.getMessage());
                if (attempt < maxRetries) {
                    try { Thread.sleep(3000); } catch (InterruptedException ignored) {}
                }
            }
        }

        log.error("[FRED] {} gözlemleri {} denemeden sonra alınamadı.", seriesId, maxRetries);
        return new ArrayList<>();
    }
}
