package com.financeportal.domains.economic_calendar.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.economic_calendar.dto.EconomicEventDto;
import com.financeportal.model.enums.EventImpact;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Redis okuyucu — sync servisi cache'i doldurur, bu sınıf filter + sort eder.
 * Tüm filter parametreleri opsiyonel; null geçilirse o boyut filtrelenmez.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EconomicCalendarService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_KEY = "cache:economic-calendar";

    public List<EconomicEventDto> getEvents(LocalDate from, LocalDate to, Set<String> countries, EventImpact minImpact) {
        try {
            String json = redisTemplate.opsForValue().get(CACHE_KEY);
            if (json == null || json.isEmpty()) {
                log.debug("[ECONOMIC-CALENDAR] Cache miss — sync henüz çalışmamış olabilir.");
                return List.of();
            }
            List<EconomicEventDto> all = objectMapper.readValue(json, new TypeReference<>() {});
            return all.stream()
                    .filter(e -> e.getTime() != null)
                    .filter(e -> from == null || !e.getTime().toLocalDate().isBefore(from))
                    .filter(e -> to == null || !e.getTime().toLocalDate().isAfter(to))
                    .filter(e -> countries == null || countries.isEmpty() || countries.contains(e.getCountry()))
                    .filter(e -> minImpact == null || isAtLeast(e.getImpact(), minImpact))
                    .sorted(Comparator.comparing(EconomicEventDto::getTime))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("[ECONOMIC-CALENDAR] read failed: {}", e.getMessage());
            return List.of();
        }
    }

    /** EventImpact ordinal'i HIGH > MEDIUM > LOW olarak işliyor (enum sırası ters). */
    private static boolean isAtLeast(EventImpact actual, EventImpact threshold) {
        if (actual == null) return false;
        // HIGH=2, MEDIUM=1, LOW=0 olacak şekilde sıralamayı invert et
        int actualRank = rank(actual);
        int thresholdRank = rank(threshold);
        return actualRank >= thresholdRank;
    }

    private static int rank(EventImpact i) {
        return switch (i) {
            case HIGH -> 2;
            case MEDIUM -> 1;
            case LOW -> 0;
        };
    }
}
