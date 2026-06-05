package com.financeportal.domains.fund.service;

import com.financeportal.domains.fund.client.TefasFundClient;
import com.financeportal.domains.fund.dto.FundDto;
import com.financeportal.domains.stock.client.TradingViewLogoClient;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.client.yahoo.YahooQuoteClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FundService {

    private final TefasFundClient tefasFundClient;
    // ŞUNA DÖNÜŞTÜRÜN:
    private final YahooQuoteClient yahooFinanceClient; // (Veya ismini yahooQuoteClient yapın)
    private final CacheService cacheService;
    private final TradingViewLogoClient logoClient;

    private final List<String> GLOBAL_ETF_SYMBOLS = List.of("SPY", "GLD", "TLT", "VNQ", "DIA", "IWM", "VTI", "VOO", "HYG", "LQD", "BND", "AGG", "IEF", "SHY");

    public List<FundDto> getGlobalFunds() {
        return cacheService.getOrFetch("cache:global_funds", () -> {
            List<MarketAssetDto> raw = yahooFinanceClient.fetchQuotes(GLOBAL_ETF_SYMBOLS.toArray(new String[0]), "YATIRIM FONU (GLOBAL)");
            Map<String, String> etfLogos = logoClient.usLogos(GLOBAL_ETF_SYMBOLS);
            return raw.stream().map(m -> {
                FundDto f = mapToFundDto(m);
                f.setImage(etfLogos.get(f.getSymbol())); // ETF logosu (yoksa null)
                return f;
            }).toList();
        }, 60);
    }

    public List<FundDto> getTrFunds() {
        return cacheService.getOrFetch("cache:tr_funds", tefasFundClient::fetchTefasFunds, 60);
    }

    @Scheduled(fixedRate = 3600000)
    public void syncGlobalFunds() {
        getGlobalFunds();
    }

    @Scheduled(fixedRate = 3600000)
    public void syncTrFunds() {
        List<FundDto> list = tefasFundClient.fetchTefasFunds();
        if (list != null && !list.isEmpty()) cacheService.save("cache:tr_funds", list, 60);
    }

    private FundDto mapToFundDto(MarketAssetDto m) {
        FundDto f = new FundDto();
        f.setSymbol(m.getSymbol()); f.setName(m.getName()); f.setAssetType(m.getAssetType());
        f.setPrice(m.getPrice()); f.setBuyPrice(m.getBuyPrice()); f.setChangePercent(m.getChangePercent());
        f.setVolume(m.getVolume()); f.setYahooSymbol(m.getYahooSymbol()); f.setChartType(m.getChartType());
        f.setAssetCategory(m.getAssetCategory());
        return f;
    }
}