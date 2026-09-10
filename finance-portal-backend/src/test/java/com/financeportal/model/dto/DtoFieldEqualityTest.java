package com.financeportal.model.dto;

import com.financeportal.domains.crypto.dto.CryptoDto;
import com.financeportal.domains.economy.dto.EconomyDto;
import com.financeportal.domains.economy_us.dto.EconomyUsDto;
import com.financeportal.domains.future.dto.FutureDto;
import com.financeportal.domains.news.dto.NewsDto;
import com.financeportal.model.dto.chart.SavedChartRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Field-by-field equality testleri. Lombok @Data equals/hashCode bytecode'unu
 * tam kapsam altına almak için her field için "one different" branch kapatılır.
 */
class DtoFieldEqualityTest {

    @Test
    void savedChartRequest_eachFieldDifference() {
        SavedChartRequest base = new SavedChartRequest();
        base.setSymbol("AAPL"); base.setAssetCategory("STOCK"); base.setName("MyChart"); base.setPayload("{}");

        SavedChartRequest equal = new SavedChartRequest();
        equal.setSymbol("AAPL"); equal.setAssetCategory("STOCK"); equal.setName("MyChart"); equal.setPayload("{}");

        assertEquals(base, equal);
        assertEquals(base.hashCode(), equal.hashCode());
        assertNotNull(base.toString());
        assertNotNull(base);

        // Each field differs in turn — exercises each branch of equals()
        SavedChartRequest diffSymbol = new SavedChartRequest();
        diffSymbol.setSymbol("MSFT"); diffSymbol.setAssetCategory("STOCK"); diffSymbol.setName("MyChart"); diffSymbol.setPayload("{}");
        assertNotEquals(base, diffSymbol);

        SavedChartRequest diffCat = new SavedChartRequest();
        diffCat.setSymbol("AAPL"); diffCat.setAssetCategory("CRYPTO"); diffCat.setName("MyChart"); diffCat.setPayload("{}");
        assertNotEquals(base, diffCat);

        SavedChartRequest diffName = new SavedChartRequest();
        diffName.setSymbol("AAPL"); diffName.setAssetCategory("STOCK"); diffName.setName("Other"); diffName.setPayload("{}");
        assertNotEquals(base, diffName);

        SavedChartRequest diffPayload = new SavedChartRequest();
        diffPayload.setSymbol("AAPL"); diffPayload.setAssetCategory("STOCK"); diffPayload.setName("MyChart"); diffPayload.setPayload("xx");
        assertNotEquals(base, diffPayload);

        // Each field null in turn
        SavedChartRequest nullSymbol = new SavedChartRequest();
        nullSymbol.setAssetCategory("STOCK"); nullSymbol.setName("MyChart"); nullSymbol.setPayload("{}");
        assertNotEquals(base, nullSymbol);
        assertNotEquals(nullSymbol, base);

        SavedChartRequest allNull = new SavedChartRequest();
        assertNotEquals(base, allNull);
        assertNotEquals(allNull, base);
        assertNotNull(allNull.toString());
        allNull.hashCode();
    }

    @Test
    void economyUsDto_eachFieldDifference() {
        EconomyUsDto base = new EconomyUsDto(308.4, 3.5, "2024-01-01");
        EconomyUsDto equal = new EconomyUsDto(308.4, 3.5, "2024-01-01");
        EconomyUsDto diffCpi = new EconomyUsDto(310.0, 3.5, "2024-01-01");
        EconomyUsDto diffYoY = new EconomyUsDto(308.4, 4.0, "2024-01-01");
        EconomyUsDto diffDate = new EconomyUsDto(308.4, 3.5, "2024-02-01");
        EconomyUsDto allNull = new EconomyUsDto();

        assertEquals(base, equal);
        assertEquals(base.hashCode(), equal.hashCode());
        assertNotEquals(base, diffCpi);
        assertNotEquals(base, diffYoY);
        assertNotEquals(base, diffDate);
        assertNotEquals(base, allNull);
        assertNotEquals(allNull, base);
        assertNotNull(base);
        assertNotNull(base.toString());
        assertNotNull(allNull.toString());

        // setters
        EconomyUsDto built = new EconomyUsDto();
        built.setCpiIndex(308.4);
        built.setYoyChangePct(3.5);
        built.setLastUpdated("2024-01-01");
        assertEquals(308.4, built.getCpiIndex());
        assertEquals(3.5, built.getYoyChangePct());
        assertEquals("2024-01-01", built.getLastUpdated());
        assertEquals(base, built);
    }

    @Test
    void economyDto_eachFieldDifference() {
        EconomyDto base = new EconomyDto(50.0, 67.0, 8.7, "2024-01-01");
        EconomyDto equal = new EconomyDto(50.0, 67.0, 8.7, "2024-01-01");
        EconomyDto diffInterest = new EconomyDto(51.0, 67.0, 8.7, "2024-01-01");
        EconomyDto diffInflation = new EconomyDto(50.0, 68.0, 8.7, "2024-01-01");
        EconomyDto diffUnemp = new EconomyDto(50.0, 67.0, 9.0, "2024-01-01");
        EconomyDto diffDate = new EconomyDto(50.0, 67.0, 8.7, "2024-02-01");
        EconomyDto allNull = new EconomyDto();

        assertEquals(base, equal);
        assertEquals(base.hashCode(), equal.hashCode());
        assertNotEquals(base, diffInterest);
        assertNotEquals(base, diffInflation);
        assertNotEquals(base, diffUnemp);
        assertNotEquals(base, diffDate);
        assertNotEquals(base, allNull);
        assertNotEquals(allNull, base);
        assertNotNull(base);
        assertNotNull(base.toString());
        assertNotNull(allNull.toString());

        EconomyDto built = new EconomyDto();
        built.setInterestRate(50.0);
        built.setInflationRate(67.0);
        built.setUnemploymentRate(8.7);
        built.setLastUpdated("2024-01-01");
        assertEquals(base, built);
        assertEquals(50.0, built.getInterestRate());
    }

    @Test
    void futureDto_eachFieldDifference() {
        FutureDto base = new FutureDto("ES=F", "S&P", "FUTURE", new BigDecimal("4500"), new BigDecimal("0.5"), 1000L, "ES=F", "CANDLE", "FUTURE");
        FutureDto equal = new FutureDto("ES=F", "S&P", "FUTURE", new BigDecimal("4500"), new BigDecimal("0.5"), 1000L, "ES=F", "CANDLE", "FUTURE");
        assertEquals(base, equal);
        assertEquals(base.hashCode(), equal.hashCode());

        // Each field differs
        assertNotEquals(base, new FutureDto("X", "S&P", "FUTURE", new BigDecimal("4500"), new BigDecimal("0.5"), 1000L, "ES=F", "CANDLE", "FUTURE"));
        assertNotEquals(base, new FutureDto("ES=F", "X", "FUTURE", new BigDecimal("4500"), new BigDecimal("0.5"), 1000L, "ES=F", "CANDLE", "FUTURE"));
        assertNotEquals(base, new FutureDto("ES=F", "S&P", "X", new BigDecimal("4500"), new BigDecimal("0.5"), 1000L, "ES=F", "CANDLE", "FUTURE"));
        assertNotEquals(base, new FutureDto("ES=F", "S&P", "FUTURE", new BigDecimal("5000"), new BigDecimal("0.5"), 1000L, "ES=F", "CANDLE", "FUTURE"));
        assertNotEquals(base, new FutureDto("ES=F", "S&P", "FUTURE", new BigDecimal("4500"), new BigDecimal("0.6"), 1000L, "ES=F", "CANDLE", "FUTURE"));
        assertNotEquals(base, new FutureDto("ES=F", "S&P", "FUTURE", new BigDecimal("4500"), new BigDecimal("0.5"), 2000L, "ES=F", "CANDLE", "FUTURE"));
        assertNotEquals(base, new FutureDto("ES=F", "S&P", "FUTURE", new BigDecimal("4500"), new BigDecimal("0.5"), 1000L, "OTHER", "CANDLE", "FUTURE"));
        assertNotEquals(base, new FutureDto("ES=F", "S&P", "FUTURE", new BigDecimal("4500"), new BigDecimal("0.5"), 1000L, "ES=F", "LINE", "FUTURE"));
        assertNotEquals(base, new FutureDto("ES=F", "S&P", "FUTURE", new BigDecimal("4500"), new BigDecimal("0.5"), 1000L, "ES=F", "CANDLE", "STOCK"));
        assertNotEquals(base, new FutureDto());
        assertNotEquals(new FutureDto(), base);
        assertNotNull(base);
        assertNotNull(base.toString());
        assertNotNull(new FutureDto().toString());

        FutureDto built = new FutureDto();
        built.setSymbol("ES=F"); built.setName("S&P"); built.setAssetType("FUTURE");
        built.setPrice(new BigDecimal("4500")); built.setChangePercent(new BigDecimal("0.5"));
        built.setVolume(1000L); built.setYahooSymbol("ES=F"); built.setChartType("CANDLE");
        built.setAssetCategory("FUTURE");
        assertEquals(base, built);
        assertEquals("ES=F", built.getSymbol());
        assertEquals(new BigDecimal("4500"), built.getPrice());
    }

    @Test
    void newsDto_eachFieldDifference() {
        NewsDto base = new NewsDto("Title", "Desc", "http://link", "2024-01-01", "Source", "http://img", "Cat");
        NewsDto equal = new NewsDto("Title", "Desc", "http://link", "2024-01-01", "Source", "http://img", "Cat");
        assertEquals(base, equal);
        assertEquals(base.hashCode(), equal.hashCode());

        assertNotEquals(base, new NewsDto("X", "Desc", "http://link", "2024-01-01", "Source", "http://img", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "X", "http://link", "2024-01-01", "Source", "http://img", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "Desc", "X", "2024-01-01", "Source", "http://img", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "Desc", "http://link", "X", "Source", "http://img", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "Desc", "http://link", "2024-01-01", "X", "http://img", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "Desc", "http://link", "2024-01-01", "Source", "X", "Cat"));
        assertNotEquals(base, new NewsDto("Title", "Desc", "http://link", "2024-01-01", "Source", "http://img", "X"));
        assertNotEquals(base, new NewsDto());
        assertNotEquals(new NewsDto(), base);
        assertNotNull(base);
        assertNotNull(base.toString());
        assertNotNull(new NewsDto().toString());

        NewsDto built = new NewsDto();
        built.setTitle("Title"); built.setDescription("Desc"); built.setLink("http://link");
        built.setPubDate("2024-01-01"); built.setSource("Source"); built.setImageUrl("http://img");
        built.setCategory("Cat");
        assertEquals(base, built);
        assertEquals("Title", built.getTitle());
    }

    @Test
    void cryptoDto_eachFieldDifference() {
        BigDecimal b = new BigDecimal("60000");
        BigDecimal s = new BigDecimal("60100");
        BigDecimal c = new BigDecimal("2.5");
        CryptoDto base = new CryptoDto("BTC", "Bitcoin", b, s, c, "BTC-USD", "CANDLE", "CRYPTO", "https://img", "bitcoin", null, null);
        CryptoDto equal = new CryptoDto("BTC", "Bitcoin", b, s, c, "BTC-USD", "CANDLE", "CRYPTO", "https://img", "bitcoin", null, null);
        assertEquals(base, equal);
        assertEquals(base.hashCode(), equal.hashCode());

        assertNotEquals(base, new CryptoDto("ETH", "Bitcoin", b, s, c, "BTC-USD", "CANDLE", "CRYPTO", "https://img", "bitcoin", null, null));
        assertNotEquals(base, new CryptoDto("BTC", "X", b, s, c, "BTC-USD", "CANDLE", "CRYPTO", "https://img", "bitcoin", null, null));
        assertNotEquals(base, new CryptoDto("BTC", "Bitcoin", new BigDecimal("1"), s, c, "BTC-USD", "CANDLE", "CRYPTO", "https://img", "bitcoin", null, null));
        assertNotEquals(base, new CryptoDto("BTC", "Bitcoin", b, new BigDecimal("2"), c, "BTC-USD", "CANDLE", "CRYPTO", "https://img", "bitcoin", null, null));
        assertNotEquals(base, new CryptoDto("BTC", "Bitcoin", b, s, new BigDecimal("9.9"), "BTC-USD", "CANDLE", "CRYPTO", "https://img", "bitcoin", null, null));
        assertNotEquals(base, new CryptoDto("BTC", "Bitcoin", b, s, c, "X", "CANDLE", "CRYPTO", "https://img", "bitcoin", null, null));
        assertNotEquals(base, new CryptoDto("BTC", "Bitcoin", b, s, c, "BTC-USD", "X", "CRYPTO", "https://img", "bitcoin", null, null));
        assertNotEquals(base, new CryptoDto("BTC", "Bitcoin", b, s, c, "BTC-USD", "CANDLE", "X", "https://img", "bitcoin", null, null));
        assertNotEquals(base, new CryptoDto("BTC", "Bitcoin", b, s, c, "BTC-USD", "CANDLE", "CRYPTO", "X", "bitcoin", null, null));
        assertNotEquals(base, new CryptoDto("BTC", "Bitcoin", b, s, c, "BTC-USD", "CANDLE", "CRYPTO", "https://img", "X", null, null));
        assertNotEquals(base, new CryptoDto());
        assertNotNull(base);
        assertNotNull(base.toString());
        assertNotNull(new CryptoDto().toString());

        CryptoDto built = new CryptoDto();
        built.setCurrencyCode("BTC"); built.setCurrencyName("Bitcoin");
        built.setForexBuying(b); built.setForexSelling(s); built.setChangePercent(c);
        built.setYahooSymbol("BTC-USD"); built.setChartType("CANDLE"); built.setAssetCategory("CRYPTO");
        built.setImage("https://img"); built.setGeckoId("bitcoin");
        assertEquals(base, built);
        assertEquals("BTC", built.getCurrencyCode());
        assertEquals("bitcoin", built.getGeckoId());
    }
}
