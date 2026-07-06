package com.financeportal.domains.economic_calendar.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.financeportal.domains.economic_calendar.dto.EconomicEventDto;
import com.financeportal.model.enums.EventImpact;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

/**
 * TradingView ekonomik takvim client'ı — ÜCRETSİZ, API key YOK, <b>Türkiye DAHİL</b>.
 *
 * <p>Eski Finnhub {@code /calendar/economic} endpoint'i premium-only olup 403 dönmeye başlayınca
 * buna geçildi. Widget'ın arkasındaki ham JSON feed: {@code economic-calendar.tradingview.com/events}
 * (<b>zorunlu</b> {@code Origin: https://www.tradingview.com} header'ı; aksi halde 403 döner).
 *
 * <p>Üretilen {@link EconomicEventDto} şekli Finnhub ile birebir aynı tutulur → read-path
 * (Redis cache + EconomicCalendarService), controller ve frontend hiç değişmez.
 *
 * <p>Alan eşlemesi: {@code date}(UTC) → Europe/Istanbul {@code time}; {@code title} → {@code event};
 * {@code importance} (1/0/-1) → HIGH/MEDIUM/LOW; {@code forecast} → {@code estimate};
 * {@code unit} (yoksa {@code scale}) → {@code unit}; ülke kodu (ISO-2, Avro Bölgesi = {@code EU}) direkt.
 */
@Component
@Primary
@Slf4j
public class TradingViewEconomicCalendarClient implements EconomicCalendarClient {

    private final RestTemplate restTemplate;

    @Value("${external-api.tradingview.calendar-url:https://economic-calendar.tradingview.com/events}")
    private String calendarUrl;

    @Value("${app.calendar.countries}")
    private String countries;

    private static final ZoneId TR_ZONE = ZoneId.of("Europe/Istanbul");

    public TradingViewEconomicCalendarClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public List<EconomicEventDto> fetchCalendar(LocalDate from, LocalDate to) {
        List<EconomicEventDto> out = new ArrayList<>();
        try {
            String url = String.format("%s?from=%sT00:00:00.000Z&to=%sT00:00:00.000Z&countries=%s",
                    calendarUrl, from, to, countries);
            HttpHeaders headers = new HttpHeaders();
            headers.set("Origin", "https://www.tradingview.com"); // ZORUNLU — yoksa 403
            headers.set("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
            ResponseEntity<JsonNode> resp =
                    restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), JsonNode.class);
            JsonNode body = resp.getBody();
            JsonNode result = body != null ? body.path("result") : null;
            if (result == null || !result.isArray()) {
                log.warn("[TV-CALENDAR] beklenmeyen yanıt (result yok): status={}",
                        body != null ? body.path("status").asText() : "null");
                return out;
            }
            for (JsonNode node : result) {
                EconomicEventDto dto = parseEvent(node);
                if (dto != null) out.add(dto);
            }
            log.info("[TV-CALENDAR] {} ekonomik olay çekildi ({} → {}).", out.size(), from, to);
        } catch (Exception e) {
            log.warn("[TV-CALENDAR] takvim çekilemedi ({} → {}): {}", from, to, e.getMessage());
        }
        return out;
    }

    /** TradingView event JSON → EconomicEventDto. country/title/date null ise olay atlanır. */
    private EconomicEventDto parseEvent(JsonNode node) {
        String country = textOrNull(node, "country");
        String title = textOrNull(node, "title");
        String dateStr = textOrNull(node, "date");
        if (country == null || title == null || dateStr == null) return null;

        LocalDateTime time;
        try {
            time = Instant.parse(dateStr).atZone(TR_ZONE).toLocalDateTime(); // UTC → TR yerel saati
        } catch (Exception e) {
            return null;
        }

        EconomicEventDto dto = new EconomicEventDto();
        dto.setId(textOrElse(node, "id", country + "|" + title + "|" + dateStr));
        dto.setCountry(country);
        dto.setEvent(title);
        dto.setTime(time);
        dto.setImpact(mapImpact(node.path("importance")));
        dto.setActual(parseDecimal(node.get("actual")));
        dto.setEstimate(parseDecimal(node.get("forecast"))); // TV "forecast" → DTO "estimate"
        dto.setPrevious(parseDecimal(node.get("previous")));
        dto.setUnit(resolveUnit(node));
        return dto;
    }

    /** TradingView importance: 1 → HIGH, 0 → MEDIUM, -1 (veya bilinmeyen) → LOW. */
    private static EventImpact mapImpact(JsonNode imp) {
        if (imp == null || imp.isMissingNode() || imp.isNull()) return EventImpact.LOW;
        int v = imp.asInt(-1);
        if (v >= 1) return EventImpact.HIGH;
        if (v == 0) return EventImpact.MEDIUM;
        return EventImpact.LOW;
    }

    /** Birim: TV {@code unit} (%,$,€,TRY…) varsa onu; yoksa {@code scale} (K/M/B/T); o da yoksa boş. */
    private static String resolveUnit(JsonNode node) {
        String unit = textOrNull(node, "unit");
        if (unit != null && !unit.isBlank()) return unit;
        String scale = textOrNull(node, "scale");
        return scale != null ? scale : "";
    }

    private static String textOrNull(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asText();
    }

    private static String textOrElse(JsonNode node, String field, String fallback) {
        String v = textOrNull(node, field);
        return v != null ? v : fallback;
    }

    private static BigDecimal parseDecimal(JsonNode v) {
        if (v == null || v.isNull()) return null;
        try {
            return new BigDecimal(v.asText().trim());
        } catch (Exception e) {
            return null;
        }
    }
}
