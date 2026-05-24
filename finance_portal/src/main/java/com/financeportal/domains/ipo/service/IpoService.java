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

    private final IpoScraperClient ipoScraperClient;
    private final CacheService cacheService;

    public List<IpoDto> getIPOCalendar() {
        return cacheService.getOrFetch("cache:ipos", ipoScraperClient::scrapeIPOCalendar, 60);
    }

    @Scheduled(fixedRate = 3600000)
    public void fetchIPOs() {
        List<IpoDto> ipos = ipoScraperClient.scrapeIPOCalendar();
        if (ipos != null && !ipos.isEmpty()) cacheService.save("cache:ipos", ipos, 60);
    }
}