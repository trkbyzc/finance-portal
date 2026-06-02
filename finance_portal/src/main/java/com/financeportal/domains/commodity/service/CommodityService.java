package com.financeportal.domains.commodity.service;

import com.financeportal.domains.commodity.client.TruncgilIntegrationClient;
import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.domains.currency.service.CurrencyService;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.client.yahoo.YahooQuoteClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommodityService {

    // ŞUNA DÖNÜŞTÜRÜN:
    private final YahooQuoteClient yahooFinanceClient; // (Veya ismini yahooQuoteClient yapın)
    private final TruncgilIntegrationClient truncgilIntegrationClient;
    private final CurrencyService currencyService; // 🚀 Domainler arası ilk iletişim!
    private final CacheService cacheService;

    private static final String[] COMMODITY_SYMBOLS = { "GC=F", "SI=F", "PL=F", "PA=F", "CL=F", "BZ=F", "NG=F", "HG=F", "ZW=F", "ZC=F", "KC=F", "CC=F", "CT=F" };

    // Yahoo vadeli isimleri ("Gold Aug 25") yerine temiz Türkçe isimler; değerli metaller "(ONS)" etiketli.
    private static final Map<String, String> COMMODITY_NAMES = Map.ofEntries(
            Map.entry("GC=F", "Altın (ONS)"),
            Map.entry("SI=F", "Gümüş (ONS)"),
            Map.entry("PL=F", "Platin (ONS)"),
            Map.entry("PA=F", "Paladyum (ONS)"),
            Map.entry("CL=F", "Ham Petrol (WTI)"),
            Map.entry("BZ=F", "Brent Petrolü"),
            Map.entry("NG=F", "Doğal Gaz"),
            Map.entry("HG=F", "Bakır"),
            Map.entry("ZW=F", "Buğday"),
            Map.entry("ZC=F", "Mısır"),
            Map.entry("KC=F", "Kahve"),
            Map.entry("CC=F", "Kakao"),
            Map.entry("CT=F", "Pamuk")
    );

    public List<CommodityDto> getCommodities() {
        return cacheService.getOrFetch("cache:commodities", () -> {
            List<MarketAssetDto> rawAssets = yahooFinanceClient.fetchQuotes(COMMODITY_SYMBOLS, "EMTİA");
            return rawAssets.stream().map(this::mapToCommodity).toList();
        }, 5);
    }

    public List<CommodityDto> getTurkishGold() {
        return cacheService.getOrFetch("cache:turkish_gold", () -> {
            List<CommodityDto> list = truncgilIntegrationClient.fetchLiveTurkishGold();
            return (list != null && !list.isEmpty()) ? list : calculateGoldMathematically();
        }, 5);
    }

    private List<CommodityDto> calculateGoldMathematically() {
        List<CommodityDto> goldList = new ArrayList<>();
        try {
            List<CommodityDto> commodities = getCommodities();
            List<CurrencyDto> currencies = currencyService.getCurrencyRates();
            if (commodities == null || currencies == null || commodities.isEmpty() || currencies.isEmpty()) return goldList;

            CommodityDto ons = commodities.stream().filter(c -> "GC=F".equals(c.getSymbol())).findFirst().orElse(null);
            CurrencyDto usd = currencies.stream().filter(c -> "USD".equals(c.getCurrencyCode())).findFirst().orElse(null);

            if (ons == null || usd == null || ons.getPrice() == null || usd.getForexSelling() == null) return goldList;

            BigDecimal gramPrice = ons.getPrice().divide(new BigDecimal("31.1034768"), 6, RoundingMode.HALF_UP).multiply(usd.getForexSelling());
            BigDecimal changePct = ons.getChangePercent() != null ? ons.getChangePercent() : BigDecimal.ZERO;

            goldList.add(createGoldDto("GRAM_ALTIN", "Gram Altın (Yedek)", gramPrice, new BigDecimal("1"), changePct));
            goldList.add(createGoldDto("CEYREK_ALTIN", "Çeyrek Altın (Yedek)", gramPrice, new BigDecimal("1.64"), changePct));
            goldList.add(createGoldDto("TAM_ALTIN", "Tam Altın (Yedek)", gramPrice, new BigDecimal("6.56"), changePct));
            goldList.add(createGoldDto("CUMHURIYET_ALTINI", "Cumhuriyet Altını (Yedek)", gramPrice, new BigDecimal("6.60"), changePct));
        } catch (Exception e) {
            log.error("[GOLD_MATH] Error during fallback: {}", e.getMessage());
        }
        return goldList;
    }

    private CommodityDto createGoldDto(String symbol, String name, BigDecimal gramPrice, BigDecimal multiplier, BigDecimal changePct) {
        CommodityDto dto = new CommodityDto();

        dto.setSymbol(symbol);
        dto.setName(name);
        dto.setAssetType("TÜRK ALTINI");

        // 🚀 ÖZÜMÜZE DÖNDÜK: Altın bir emtiadır ve mum grafiği çizecektir!
        dto.setAssetCategory("COMMODITY");
        dto.setChartType("CANDLE");

        // 🚀 ÇAKIŞMA KÖKÜNDEN ÇÖZÜLDÜ:
        // Artık Gram Altın yedeği "GC=F" kimliğini kullanmıyor! "XAUTRY=X" kullanıyor.
        // Böylece global Ons Altın (GC=F) kendi bağımsızlığını ilan etmiş oluyor.
        dto.setYahooSymbol("XAUTRY=X");

        BigDecimal sellPrice = gramPrice.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        dto.setPrice(sellPrice);

        BigDecimal spread = symbol.contains("GRAM") ? new BigDecimal("0.998") : new BigDecimal("0.985");
        dto.setBuyPrice(sellPrice.multiply(spread).setScale(2, RoundingMode.HALF_UP));

        dto.setChangePercent(changePct);
        dto.setVolume(0L);

        return dto;
    }

    private CommodityDto mapToCommodity(MarketAssetDto m) {
        CommodityDto c = new CommodityDto();
        c.setSymbol(m.getSymbol()); c.setName(resolveCommodityName(m.getSymbol(), m.getName())); c.setAssetType(m.getAssetType());
        c.setPrice(m.getPrice()); c.setBuyPrice(m.getBuyPrice()); c.setChangePercent(m.getChangePercent());
        c.setVolume(m.getVolume()); c.setYahooSymbol(m.getYahooSymbol()); c.setChartType(m.getChartType());
        c.setAssetCategory(m.getAssetCategory());
        return c;
    }

    /**
     * Emtia için temiz görünen isim: küratörlü Türkçe isim varsa onu, yoksa Yahoo
     * isminden sondaki vade ayı/yıl ("... Aug 25", "... Jul 2025") temizlenmiş hâlini döndürür.
     */
    private String resolveCommodityName(String symbol, String yahooName) {
        if (symbol != null && COMMODITY_NAMES.containsKey(symbol)) {
            return COMMODITY_NAMES.get(symbol);
        }
        if (yahooName == null) return symbol;
        // "Gold Aug 25" / "Crude Oil Jul 2025" → vade ayı + yıl son ekini at
        return yahooName.replaceAll(
                "\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\w*\\.?\\s*\\d{2,4}$", "").trim();
    }
}