package com.financeportal.model.dto;

import com.financeportal.domains.bank_currency.dto.BankCurrencyDto;
import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.domains.crypto.dto.CryptoDto;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.domains.economic_calendar.dto.EconomicEventDto;
import com.financeportal.domains.economy.dto.EconomyDto;
import com.financeportal.domains.economy_us.dto.EconomyUsDto;
import com.financeportal.domains.effective_currency.dto.EffectiveCurrencyDto;
import com.financeportal.domains.fund.dto.FundDto;
import com.financeportal.domains.future.dto.FutureDto;
import com.financeportal.domains.stock.dto.StockDto;
import com.financeportal.domains.viop.dto.ViopDto;
import com.financeportal.model.dto.chart.SavedChartDto;
import com.financeportal.model.dto.chart.SavedChartRequest;
import com.financeportal.model.dto.market.CurrencyRateDto;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.model.dto.portfolio.AssetDistributionDto;
import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.model.dto.preferences.TickerSymbolDto;
import com.financeportal.model.dto.preferences.UserPreferencesDto;
import com.financeportal.model.dto.simulation.PricePointDto;
import com.financeportal.model.dto.simulation.SimulationResultDto;
import com.financeportal.model.dto.user.UserDto;
import com.financeportal.model.dto.user.UserResponseDto;
import com.financeportal.model.dto.whatif.WhatIfAssetRef;
import com.financeportal.model.dto.whatif.WhatIfAssetSeries;
import com.financeportal.model.dto.whatif.WhatIfRequestDto;
import com.financeportal.model.dto.whatif.WhatIfResultDto;
import com.financeportal.model.enums.AssetType;
import com.financeportal.model.enums.Role;
import com.financeportal.model.enums.TickerScope;
import com.financeportal.model.enums.TradeSide;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Toplu DTO bytecode egzersizci — Lombok @Data ile üretilen
 * getter/setter/equals/hashCode/toString satırlarını JaCoCo'da kapsama
 * dahil eder. Her DTO için round-trip + equals + hashCode + toString.
 */
class DtoExerciserTest {

    private <T> void rountTrip(T dto1, T dto2) {
        assertEquals(dto1, dto2);
        assertEquals(dto1.hashCode(), dto2.hashCode());
        assertNotNull(dto1.toString());
        assertNotNull(dto1);
    }

    // ===== model/dto/market =====

    @Test
    void marketAssetDto_allArgsCtorAndAccessors() {
        MarketAssetDto a = new MarketAssetDto("AAPL", "Apple", "STOCK",
                new BigDecimal("180"), new BigDecimal("179"), new BigDecimal("0.5"), 1000L,
                "AAPL", "CANDLE", "GLOBAL", false, false, false);
        MarketAssetDto b = new MarketAssetDto("AAPL", "Apple", "STOCK",
                new BigDecimal("180"), new BigDecimal("179"), new BigDecimal("0.5"), 1000L,
                "AAPL", "CANDLE", "GLOBAL", false, false, false);
        rountTrip(a, b);
        // 6-arg compact constructor
        MarketAssetDto c = new MarketAssetDto("X", "Name", "T", BigDecimal.ONE, BigDecimal.ZERO, 0L);
        assertEquals("X", c.getSymbol());
    }

    @Test
    void historicalDataDto_setAllFields() {
        HistoricalDataDto d = new HistoricalDataDto();
        d.setDate(LocalDate.of(2024, 1, 1));
        d.setTimestamp(1700000000L);
        d.setOpen(new BigDecimal("100"));
        d.setHigh(new BigDecimal("110"));
        d.setLow(new BigDecimal("95"));
        d.setClose(new BigDecimal("105"));
        d.setPrice(new BigDecimal("105"));
        d.setVolume(1000L);
        d.setMovingAverage(new BigDecimal("102"));
        HistoricalDataDto d2 = new HistoricalDataDto(LocalDate.of(2024, 1, 1), 1700000000L,
                new BigDecimal("100"), new BigDecimal("110"), new BigDecimal("95"),
                new BigDecimal("105"), new BigDecimal("105"), 1000L, new BigDecimal("102"));
        rountTrip(d, d2);
    }

    @Test
    void currencyRateDto_allFields() {
        CurrencyRateDto r1 = new CurrencyRateDto("USD", "Dolar", new BigDecimal("33"), new BigDecimal("34"),
                new BigDecimal("0.5"), "Garanti", "Bank", "USDTRY=X", "LINE", "CURRENCY",
                new BigDecimal("0.1"), new BigDecimal("0.2"), new BigDecimal("0.3"),
                new BigDecimal("0.4"), new BigDecimal("0.5"));
        CurrencyRateDto r2 = new CurrencyRateDto("USD", "Dolar", new BigDecimal("33"), new BigDecimal("34"),
                new BigDecimal("0.5"), "Garanti", "Bank", "USDTRY=X", "LINE", "CURRENCY",
                new BigDecimal("0.1"), new BigDecimal("0.2"), new BigDecimal("0.3"),
                new BigDecimal("0.4"), new BigDecimal("0.5"));
        rountTrip(r1, r2);
    }

    // ===== domain DTOs =====

    @Test
    void futureDto() {
        FutureDto a = new FutureDto("ES=F", "S&P", "FUT", new BigDecimal("5800"),
                new BigDecimal("0.5"), 1000L, "ES=F", "CANDLE", "GLOBAL_FUTURE");
        FutureDto b = new FutureDto("ES=F", "S&P", "FUT", new BigDecimal("5800"),
                new BigDecimal("0.5"), 1000L, "ES=F", "CANDLE", "GLOBAL_FUTURE");
        rountTrip(a, b);
    }

    @Test
    void economyDto() {
        EconomyDto a = new EconomyDto(50.0, 67.0, 8.0, "2026-06-01");
        EconomyDto b = new EconomyDto(50.0, 67.0, 8.0, "2026-06-01");
        rountTrip(a, b);
    }

    @Test
    void economyUsDto() {
        EconomyUsDto a = new EconomyUsDto(308.4, 3.1, "2026-06-01");
        EconomyUsDto b = new EconomyUsDto(308.4, 3.1, "2026-06-01");
        rountTrip(a, b);
    }

    @Test
    void cryptoDto() {
        CryptoDto a = new CryptoDto();
        a.setCurrencyCode("BTC");
        a.setCurrencyName("Bitcoin");
        a.setForexBuying(new BigDecimal("59000"));
        a.setForexSelling(new BigDecimal("60000"));
        a.setChangePercent(new BigDecimal("2.5"));
        a.setYahooSymbol("BTC-USD");
        a.setChartType("CANDLE");
        a.setAssetCategory("CRYPTO");
        a.setImage("btc.png");
        a.setGeckoId("bitcoin");
        assertEquals("BTC", a.getCurrencyCode());
        assertNotNull(a.toString());
        // hashCode + equals invariant: same fields → same hash
        CryptoDto a2 = new CryptoDto();
        a2.setCurrencyCode("BTC");
        a2.setCurrencyName("Bitcoin");
        a2.setForexBuying(new BigDecimal("59000"));
        a2.setForexSelling(new BigDecimal("60000"));
        a2.setChangePercent(new BigDecimal("2.5"));
        a2.setYahooSymbol("BTC-USD");
        a2.setChartType("CANDLE");
        a2.setAssetCategory("CRYPTO");
        a2.setImage("btc.png");
        a2.setGeckoId("bitcoin");
        rountTrip(a, a2);
    }

    @Test
    void currencyDto() {
        CurrencyDto a = new CurrencyDto();
        a.setCurrencyCode("USD");
        a.setCurrencyName("Dolar");
        a.setForexBuying(new BigDecimal("33"));
        a.setForexSelling(new BigDecimal("34"));
        a.setChangePercent(new BigDecimal("0.5"));
        a.setYahooSymbol("USDTRY=X");
        a.setChartType("LINE");
        a.setAssetCategory("CURRENCY");
        assertEquals("USD", a.getCurrencyCode());
        assertNotNull(a.toString());
    }

    @Test
    void effectiveCurrencyDto() {
        EffectiveCurrencyDto a = new EffectiveCurrencyDto();
        a.setCurrencyCode("USD");
        a.setCurrencyName("Dolar");
        a.setForexBuying(new BigDecimal("33.5"));
        a.setForexSelling(new BigDecimal("34"));
        a.setChangePercent(new BigDecimal("0.5"));
        a.setChangeWeek(new BigDecimal("1.0"));
        a.setChangeMonth(new BigDecimal("2.0"));
        a.setChange6Month(new BigDecimal("3.0"));
        a.setChangeYear(new BigDecimal("4.0"));
        a.setChange5Year(new BigDecimal("5.0"));
        a.setYahooSymbol("USDTRY=X");
        a.setAssetCategory("EFFECTIVE_CURRENCY");
        a.setChartType("LINE");
        assertEquals("USD", a.getCurrencyCode());
        assertNotNull(a.toString());
    }

    @Test
    void commodityDto() {
        CommodityDto a = new CommodityDto();
        a.setSymbol("GC=F");
        a.setName("Gold");
        a.setPrice(new BigDecimal("2400"));
        a.setBuyPrice(new BigDecimal("2395"));
        a.setAssetType("EMTİA");
        a.setAssetCategory("COMMODITY");
        a.setChartType("CANDLE");
        a.setYahooSymbol("GC=F");
        a.setChangePercent(new BigDecimal("1.5"));
        a.setVolume(1000L);
        assertEquals("GC=F", a.getSymbol());
        assertNotNull(a.toString());
    }

    @Test
    void stockDto() {
        StockDto a = new StockDto();
        a.setSymbol("AKBNK.IS");
        a.setName("Akbank");
        a.setPrice(new BigDecimal("50"));
        a.setBuyPrice(new BigDecimal("49.9"));
        a.setAssetType("STOCK");
        a.setAssetCategory("STOCK");
        a.setChartType("CANDLE");
        a.setYahooSymbol("AKBNK.IS");
        a.setChangePercent(new BigDecimal("2"));
        a.setVolume(100000L);
        a.setInBist30(true);
        a.setInBist50(true);
        a.setInBist100(true);
        assertTrue(a.isInBist30());
        assertNotNull(a.toString());
    }

    @Test
    void fundDto() {
        FundDto a = new FundDto();
        a.setSymbol("AKB");
        a.setName("Akbank Fund");
        a.setPrice(new BigDecimal("12"));
        a.setBuyPrice(new BigDecimal("11.9"));
        a.setAssetType("FUND");
        a.setAssetCategory("FUND");
        a.setChartType("LINE");
        a.setYahooSymbol("AKB");
        a.setChangePercent(new BigDecimal("0.5"));
        a.setVolume(500L);
        assertNotNull(a.toString());
    }

    @Test
    void viopDto() {
        ViopDto a = new ViopDto();
        a.setSymbol("F_XU030");
        a.setName("XU030 Future");
        a.setPrice(new BigDecimal("400"));
        a.setChangePercent(new BigDecimal("1.5"));
        a.setVolume(1000L);
        a.setAssetType("FUTURE");
        a.setAssetCategory("VIOP");
        a.setChartType("CANDLE");
        a.setYahooSymbol("F_XU030");
        assertNotNull(a.toString());
    }

    @Test
    void bankCurrencyDto() {
        BankCurrencyDto a = new BankCurrencyDto();
        a.setCurrencyCode("USD");
        a.setCurrencyName("Dolar");
        a.setForexBuying(new BigDecimal("33"));
        a.setForexSelling(new BigDecimal("34"));
        a.setBankName("Garanti");
        a.setChangePercent(new BigDecimal("0.5"));
        a.setYahooSymbol("USDTRY=X");
        a.setChartType("LINE");
        a.setAssetCategory("BANK_CURRENCY");
        assertNotNull(a.toString());
    }

    // ===== portfolio DTOs =====

    @Test
    void portfolioItemDto() {
        PortfolioItemDto a = new PortfolioItemDto("BTC", "CRYPTO", BigDecimal.ONE, new BigDecimal("50000"),
                BigDecimal.ONE, new BigDecimal("50000"), new BigDecimal("60000"), new BigDecimal("60000"),
                new BigDecimal("10000"), new BigDecimal("20"));
        PortfolioItemDto b = new PortfolioItemDto("BTC", "CRYPTO", BigDecimal.ONE, new BigDecimal("50000"),
                BigDecimal.ONE, new BigDecimal("50000"), new BigDecimal("60000"), new BigDecimal("60000"),
                new BigDecimal("10000"), new BigDecimal("20"));
        rountTrip(a, b);
    }

    @Test
    void portfolioSummaryDto() {
        PortfolioSummaryDto a = new PortfolioSummaryDto();
        a.setTotalAssetCost(new BigDecimal("100000"));
        a.setTotalAssetValue(new BigDecimal("120000"));
        a.setGrandTotal(new BigDecimal("120000"));
        a.setTotalProfitLoss(new BigDecimal("20000"));
        a.setTotalProfitLossPct(new BigDecimal("20"));
        a.setDistribution(List.of());
        assertNotNull(a.toString());
    }

    @Test
    void assetDistributionDto() {
        AssetDistributionDto a = new AssetDistributionDto("BTC", new BigDecimal("60000"), new BigDecimal("100"));
        AssetDistributionDto b = new AssetDistributionDto("BTC", new BigDecimal("60000"), new BigDecimal("100"));
        rountTrip(a, b);
    }

    // ===== preferences DTOs =====

    @Test
    void userPreferencesDto() {
        UserPreferencesDto a = new UserPreferencesDto(List.of(new TickerSymbolDto("BTC", AssetType.CRYPTO)),
                TickerScope.HOME_ONLY);
        UserPreferencesDto b = new UserPreferencesDto(List.of(new TickerSymbolDto("BTC", AssetType.CRYPTO)),
                TickerScope.HOME_ONLY);
        rountTrip(a, b);
    }

    @Test
    void tickerSymbolDto() {
        TickerSymbolDto a = new TickerSymbolDto("BTC", AssetType.CRYPTO);
        TickerSymbolDto b = new TickerSymbolDto("BTC", AssetType.CRYPTO);
        rountTrip(a, b);
    }

    // ===== simulation DTOs =====

    @Test
    void pricePointDto() {
        PricePointDto a = new PricePointDto(LocalDate.of(2024, 1, 1), new BigDecimal("1000"));
        PricePointDto b = new PricePointDto(LocalDate.of(2024, 1, 1), new BigDecimal("1000"));
        rountTrip(a, b);
    }

    @Test
    void simulationResultDto_builder() {
        SimulationResultDto r = SimulationResultDto.builder()
                .unitsBought(new BigDecimal("1"))
                .entryPrice(new BigDecimal("50000"))
                .effectiveStartDate(LocalDate.now())
                .currentPrice(new BigDecimal("60000"))
                .currentValue(new BigDecimal("60000"))
                .pnlTry(new BigDecimal("10000"))
                .pnlPct(new BigDecimal("20"))
                .series(List.of())
                .warning(null)
                .build();
        assertEquals(0, r.getUnitsBought().compareTo(BigDecimal.ONE));
        assertNotNull(r.toString());
    }

    // ===== user DTOs =====

    @Test
    void userDto_builder() {
        UserDto d = UserDto.builder()
                .id(UUID.randomUUID())
                .username("alice")
                .email("alice@example.com")
                .isBanned(false)
                .banPermanent(false)
                .bannedUntil(null)
                .role(Role.USER)
                .realmRoles(List.of())
                .build();
        assertEquals("alice", d.getUsername());
        assertNotNull(d.toString());
    }

    @Test
    void userResponseDto() {
        UserResponseDto a = new UserResponseDto();
        a.setId(UUID.randomUUID());
        a.setName("alice");
        a.setEmail("a@b.com");
        a.setCreatedAt(LocalDateTime.now());
        assertEquals("alice", a.getName());
        assertNotNull(a.toString());
    }

    // ===== whatif DTOs =====

    @Test
    void whatIfAssetRef() {
        WhatIfAssetRef a = new WhatIfAssetRef("BTC", AssetType.CRYPTO, BigDecimal.ONE);
        WhatIfAssetRef b = new WhatIfAssetRef("BTC", AssetType.CRYPTO, BigDecimal.ONE);
        rountTrip(a, b);
    }

    @Test
    void whatIfRequestDto() {
        WhatIfRequestDto a = new WhatIfRequestDto(LocalDate.now(), new BigDecimal("1000"),
                List.of(new WhatIfAssetRef("BTC", AssetType.CRYPTO, null)));
        WhatIfRequestDto b = new WhatIfRequestDto(LocalDate.now(), new BigDecimal("1000"),
                List.of(new WhatIfAssetRef("BTC", AssetType.CRYPTO, null)));
        rountTrip(a, b);
    }

    @Test
    void whatIfAssetSeries() {
        WhatIfAssetSeries a = new WhatIfAssetSeries();
        a.setKey("CRYPTO:BTC");
        a.setSymbol("BTC");
        a.setAssetType(AssetType.CRYPTO);
        a.setLabel("BTC");
        a.setCurrentValue(new BigDecimal("60000"));
        a.setPnlTry(new BigDecimal("10000"));
        a.setPnlPct(new BigDecimal("20"));
        a.setSeries(List.of());
        a.setWarning("warn");
        assertNotNull(a.toString());
    }

    @Test
    void whatIfResultDto() {
        WhatIfResultDto a = new WhatIfResultDto(LocalDate.now(), new BigDecimal("1000"), List.of());
        WhatIfResultDto b = new WhatIfResultDto(LocalDate.now(), new BigDecimal("1000"), List.of());
        rountTrip(a, b);
    }

    // ===== chart DTOs =====

    @Test
    void savedChartRequest() {
        SavedChartRequest a = new SavedChartRequest();
        a.setSymbol("BTC");
        a.setAssetCategory("CRYPTO");
        a.setName("My BTC Chart");
        a.setPayload("{\"overlays\":[]}");
        assertEquals("BTC", a.getSymbol());
        assertNotNull(a.toString());
    }

    @Test
    void savedChartDto() {
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        SavedChartDto a = new SavedChartDto(id, "BTC", "CRYPTO", "Name", "{}", now, now);
        SavedChartDto b = new SavedChartDto(id, "BTC", "CRYPTO", "Name", "{}", now, now);
        // Record accessor metotları
        assertEquals("BTC", a.symbol());
        assertEquals("CRYPTO", a.assetCategory());
        assertEquals(id, a.id());
        rountTrip(a, b);
    }

    // ===== economic calendar event DTO =====

    @Test
    void economicEventDto() {
        EconomicEventDto a = new EconomicEventDto();
        a.setId("US|CPI|2026-06-15");
        a.setCountry("US");
        a.setEvent("CPI");
        a.setTime(LocalDateTime.now());
        a.setImpact(com.financeportal.model.enums.EventImpact.HIGH);
        a.setActual(new BigDecimal("2.5"));
        a.setEstimate(new BigDecimal("2.4"));
        a.setPrevious(new BigDecimal("2.3"));
        a.setUnit("%");
        assertEquals("US", a.getCountry());
        assertNotNull(a.toString());
    }

    // ===== enums (toString + valueOf) =====

    @Test
    void enums_valueOfAndValues() {
        assertEquals(AssetType.STOCK, AssetType.valueOf("STOCK"));
        assertTrue(AssetType.values().length > 0);
        assertEquals(Role.USER, Role.valueOf("USER"));
        assertEquals(TickerScope.HOME_ONLY, TickerScope.valueOf("HOME_ONLY"));
        assertEquals(TradeSide.BUY, TradeSide.valueOf("BUY"));
        assertEquals(com.financeportal.model.enums.EventImpact.HIGH,
                com.financeportal.model.enums.EventImpact.valueOf("HIGH"));
    }
}
