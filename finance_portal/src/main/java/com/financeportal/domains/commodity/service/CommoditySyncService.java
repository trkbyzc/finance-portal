package com.financeportal.domains.commodity.service;

import com.financeportal.domains.commodity.client.TruncgilIntegrationClient;
import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.client.yahoo.YahooQuoteClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommoditySyncService {

    private final YahooQuoteClient yahooFinanceClient;
    private final TruncgilIntegrationClient truncgilIntegrationClient;
    private final CacheService cacheService;
    // İsimlendirme (küratörlü Türkçe / ONS etiketleri) tek kaynaktan: CommodityService.
    // Aksi halde burada ham Yahoo ismi yazılıp cache 5dk'da bir eski haline dönüyordu.
    private final CommodityService commodityService;

    @Value("${app.market.commodity-symbols}")
    private String[] commoditySymbols;

    // Her 5 dakikada bir Yahoo Finance'tan emtia fiyatlarını çekip cache'e yazar.
    @Scheduled(fixedRateString = "${app.sync.commodity-rate-ms:300000}")
    public void fetchCommodities() {
        List<MarketAssetDto> rawList = yahooFinanceClient.fetchQuotes(commoditySymbols, "EMTİA");
        if (rawList != null && !rawList.isEmpty()) {
            List<CommodityDto> list = rawList.stream().map(commodityService::mapToCommodity).toList();
            cacheService.save("cache:commodities", list, 5);
        }
    }

    // Her 5 dakikada bir Truncgil'den gram/çeyrek/cumhuriyet altın fiyatlarını çekip cache'e yazar.
    @Scheduled(fixedRateString = "${app.sync.commodity-rate-ms:300000}")
    public void fetchTurkishGoldData() {
        List<CommodityDto> goldList = truncgilIntegrationClient.fetchLiveTurkishGold();
        if (goldList != null && !goldList.isEmpty()) cacheService.save("cache:turkish_gold", goldList, 5);
    }
}