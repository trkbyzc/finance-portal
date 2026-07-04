package com.financeportal.domains.viop.service;

import com.financeportal.domains.viop.client.ViopScraperClient;
import com.financeportal.domains.viop.config.ViopContractSpec;
import com.financeportal.domains.viop.dto.ViopDto;
import com.financeportal.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ViopService {

    private final ViopScraperClient viopScraperClient;
    private final CacheService cacheService;
    private final ViopContractSpec contractSpec;

    public List<ViopDto> getViopData() {
        return cacheService.getOrFetch("cache:viop", () -> withContractSize(viopScraperClient.scrapeViopData()), 5);
    }

    // Her 5 dakikada bir VİOP verilerini scrape ederek Redis cache'ini tazeler.
    @Scheduled(fixedRateString = "${app.sync.viop-rate-ms:300000}")
    public void fetchViopData() {
        List<ViopDto> list = withContractSize(viopScraperClient.scrapeViopData());
        if (list != null && !list.isEmpty()) cacheService.save("cache:viop", list, 5);
    }

    private List<ViopDto> withContractSize(List<ViopDto> list) {
        if (list == null) return java.util.Collections.emptyList();
        for (ViopDto v : list) {
            v.setContractSize(contractSpec.getContractSize(v.getSymbol()));
        }
        return list;
    }
}