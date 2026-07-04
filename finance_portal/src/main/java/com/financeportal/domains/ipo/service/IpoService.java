package com.financeportal.domains.ipo.service;

import com.financeportal.domains.ipo.client.IpoScraperClient;
import com.financeportal.domains.ipo.dto.IpoDto;
import com.financeportal.service.bootstrap.BootstrapReadinessTracker;
import com.financeportal.service.cache.CacheService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IpoService {

    // v2 — date-range parsing bug fix, eski hatalı cache'i invalidate eder.
    private static final String CACHE_KEY = "cache:ipos:v2";
    private static final String TASK_NAME = "IPO";

    private final IpoScraperClient ipoScraperClient;
    private final CacheService cacheService;
    private final BootstrapReadinessTracker bootstrapTracker;

    @PostConstruct
    void registerBootstrap() { bootstrapTracker.register(TASK_NAME); }

    public List<IpoDto> getIPOCalendar() {
        return cacheService.getOrFetch(CACHE_KEY, ipoScraperClient::scrapeIPOCalendar, 60);
    }

    // Startup'tan 5 sn sonra başlar, saatte bir IPO takvimini scrape edip cache'i günceller.
    @Scheduled(fixedRateString = "${app.sync.ipo-rate-ms:3600000}", initialDelayString = "5000")
    public void fetchIPOs() {
        try {
            List<IpoDto> ipos = ipoScraperClient.scrapeIPOCalendar();
            // Boş liste de geçerli: tüm arzlar bitmiş olabilir. Her durumda cache'i tazele.
            if (ipos != null) {
                if (!ipos.isEmpty()) {
                    cacheService.save(CACHE_KEY, ipos, 60);
                } else {
                    cacheService.delete(CACHE_KEY);
                }
            }
        } finally {
            bootstrapTracker.markComplete(TASK_NAME);
        }
    }
}