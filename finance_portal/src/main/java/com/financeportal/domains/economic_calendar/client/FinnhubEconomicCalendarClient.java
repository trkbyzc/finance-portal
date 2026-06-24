package com.financeportal.domains.economic_calendar.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.financeportal.domains.economic_calendar.dto.EconomicEventDto;
import com.financeportal.model.enums.EventImpact;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Finnhub <a href="https://finnhub.io/docs/api/economic-calendar">/calendar/economic</a>
 * endpoint client'ı. Free tier'da 200 OK ile çalışıyor — "Premium" badge sadece UI'da görünüyor,
 * actual data current+upcoming events için free erişiyor.
 * <p>
 * Rate limit: 60 req/dakika. Bizim sync 6 saatte bir = günde 4 req → bol bol rahat.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FinnhubEconomicCalendarClient implements EconomicCalendarClient {

    private final RestTemplate restTemplate;

    @Value("${external-api.finnhub.base-url:https://finnhub.io}")
    private String baseUrl;

    @Value("${external-api.finnhub.api-key:}")
    private String apiKey;

    private static final DateTimeFormatter FH_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter FH_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public List<EconomicEventDto> fetchCalendar(LocalDate from, LocalDate to) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[FINNHUB-EC] api-key boş — fetch atlanıyor.");
            return List.of();
        }
        long startTime = System.currentTimeMillis();
        List<EconomicEventDto> events = new ArrayList<>();
        try {
            String url = baseUrl + "/api/v1/calendar/economic"
                    + "?from=" + from.format(FH_DATE)
                    + "&to=" + to.format(FH_DATE)
                    + "&token=" + apiKey;
            JsonNode root = restTemplate.getForObject(url, JsonNode.class);
            if (root == null || !root.has("economicCalendar")) {
                log.warn("[FINNHUB-EC] Boş response.");
                return events;
            }
            JsonNode arr = root.get("economicCalendar");
            if (!arr.isArray()) return events;

            for (JsonNode node : arr) {
                EconomicEventDto dto = parseEvent(node);
                if (dto != null) events.add(dto);
            }
            log.info("[FINNHUB-EC] {} event fetched in {} ms (window {} → {}).",
                    events.size(), System.currentTimeMillis() - startTime, from, to);
        } catch (Exception e) {
            log.error("[FINNHUB-EC] fetch failed: {}", e.getMessage());
        }
        return events;
    }

    private EconomicEventDto parseEvent(JsonNode node) {
        try {
            String country = textOrNull(node, "country");
            String event = textOrNull(node, "event");
            String timeStr = textOrNull(node, "time");
            if (country == null || event == null || timeStr == null) return null;

            LocalDateTime time;
            try {
                time = LocalDateTime.parse(timeStr, FH_DATETIME);
            } catch (Exception e) {
                // Finnhub zaman zaman eksik/bozuk timestamp döndürür; parse edilemeyen event'i atla.
                return null;
            }

            EconomicEventDto dto = new EconomicEventDto();
            dto.setId(country + "|" + event + "|" + timeStr); // de-dup key
            dto.setCountry(country);
            dto.setEvent(event);
            dto.setTime(time);
            dto.setImpact(parseImpact(textOrNull(node, "impact")));
            dto.setActual(parseDecimal(node, "actual"));
            dto.setEstimate(parseDecimal(node, "estimate"));
            dto.setPrevious(parseDecimal(node, "prev"));
            dto.setUnit(textOrEmpty(node, "unit"));
            return dto;
        } catch (Exception ignored) {
            // Tek bir event'in parse hatası tüm listeyi kesmemeli; hatalı event sessizce atlanır.
            return null;
        }
    }

    private String textOrNull(JsonNode node, String field) {
        if (!node.has(field) || node.get(field).isNull()) return null;
        String v = node.get(field).asText();
        return (v == null || v.isBlank()) ? null : v;
    }

    private String textOrEmpty(JsonNode node, String field) {
        String v = textOrNull(node, field);
        return v == null ? "" : v;
    }

    private BigDecimal parseDecimal(JsonNode node, String field) {
        if (!node.has(field) || node.get(field).isNull()) return null;
        JsonNode v = node.get(field);
        if (v.isNumber()) return BigDecimal.valueOf(v.asDouble());
        if (v.isTextual() && !v.asText().isBlank()) {
            try { return new BigDecimal(v.asText().trim()); } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private EventImpact parseImpact(String raw) {
        if (raw == null) return EventImpact.LOW;
        switch (raw.trim().toLowerCase()) {
            case "high": return EventImpact.HIGH;
            case "medium": return EventImpact.MEDIUM;
            default: return EventImpact.LOW;
        }
    }
}
