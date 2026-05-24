package com.financeportal.domains.ipo.service;

import com.financeportal.domains.ipo.client.IpoScraperClient;
import com.financeportal.domains.ipo.dto.IpoDto;
import com.financeportal.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IpoService {

    // v2 — date-range parsing bug fix, eski hatalı cache'i invalidate eder.
    private static final String CACHE_KEY = "cache:ipos:v2";

    private final IpoScraperClient ipoScraperClient;
    private final CacheService cacheService;

    public List<IpoDto> getIPOCalendar() {
        return cacheService.getOrFetch(CACHE_KEY, ipoScraperClient::scrapeIPOCalendar, 60);
    }

    // initialDelay=5sn → startup'tan sonra hemen ilk fetch.
    @Scheduled(initialDelay = 5000, fixedRate = 3600000)
    public void fetchIPOs() {
        List<IpoDto> ipos = ipoScraperClient.scrapeIPOCalendar();
        // Boş liste de geçerli: tüm arzlar bitmiş olabilir. Her durumda cache'i tazele.
        if (ipos != null) {
            if (!ipos.isEmpty()) {
                cacheService.save(CACHE_KEY, ipos, 60);
            } else {
                cacheService.delete(CACHE_KEY);
            }
        }
    }
}