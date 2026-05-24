package com.financeportal.domains.commodity.service;

import com.financeportal.domains.commodity.client.TruncgilIntegrationClient;
import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.client.yahoo.YahooQuoteClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommoditySyncService {

    // ŞUNA DÖNÜŞTÜRÜN:
    private final YahooQuoteClient yahooFinanceClient; // (Veya ismini yahooQuoteClient yapın)
    private final TruncgilIntegrationClient truncgilIntegrationClient;
    private final CacheService cacheService;

    private static final String[] COMMODITY_SYMBOLS = { "GC=F", "SI=F", "PL=F", "PA=F", "CL=F", "BZ=F", "NG=F", "HG=F", "ZW=F", "ZC=F", "KC=F", "CC=F", "CT=F" };

    @Scheduled(fixedRate = 300000)
    public void fetchCommodities() {
        List<MarketAssetDto> rawList = yahooFinanceClient.fetchQuotes(COMMODITY_SYMBOLS, "EMTİA");
        if (rawList != null && !rawList.isEmpty()) {
            List<CommodityDto> list = rawList.stream().map(this::mapToCommodity).toList();
            cacheService.save("cache:commodities", list, 5);
        }
    }

    @Scheduled(fixedRate = 300000)
    public void fetchTurkishGoldData() {
        List<CommodityDto> goldList = truncgilIntegrationClient.fetchLiveTurkishGold();
        if (goldList != null && !goldList.isEmpty()) cacheService.save("cache:turkish_gold", goldList, 5);
    }

    private CommodityDto mapToCommodity(MarketAssetDto m) {
        CommodityDto c = new CommodityDto();
        c.setSymbol(m.getSymbol()); c.setName(m.getName()); c.setAssetType(m.getAssetType());
        c.setPrice(m.getPrice()); c.setBuyPrice(m.getBuyPrice()); c.setChangePercent(m.getChangePercent());
        c.setVolume(m.getVolume()); c.setYahooSymbol(m.getYahooSymbol()); c.setChartType(m.getChartType());
        c.setAssetCategory(m.getAssetCategory());
        return c;
    }
}