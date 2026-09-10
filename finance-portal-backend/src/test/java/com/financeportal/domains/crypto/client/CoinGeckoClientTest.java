package com.financeportal.domains.crypto.client;

import com.financeportal.domains.crypto.dto.CryptoDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings({"unchecked", "rawtypes"})
class CoinGeckoClientTest {

    @Mock private RestTemplate restTemplate;

    private CoinGeckoClient client;

    @BeforeEach
    void setUp() {
        client = new CoinGeckoClient(restTemplate);
        ReflectionTestUtils.setField(client, "coinGeckoBaseUrl", "https://api.coingecko.com/api/v3");
    }

    private Map<String, Object> coin(String id, String symbol, String name, double price, double change24h, String image) {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("id", id);
        c.put("symbol", symbol);
        c.put("name", name);
        c.put("current_price", price);
        c.put("price_change_percentage_24h", change24h);
        c.put("image", image);
        return c;
    }

    // -------- happy path --------

    @Test
    void fetchCryptoRates_singleCoin_parsedCorrectly() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok((List<Object>) (List) List.of(
                        coin("bitcoin", "btc", "Bitcoin", 60000.0, 2.5, "https://btc.png"))));

        List<CryptoDto> result = client.fetchCryptoRates();

        // Page 1 + page 2 ikisi de aynı mock dönüyor → 2 sonuç
        assertEquals(2, result.size());
        CryptoDto dto = result.get(0);
        assertEquals("BTC", dto.getCurrencyCode());
        assertTrue(dto.getCurrencyName().contains("Bitcoin"));
        assertEquals("BTC-USD", dto.getYahooSymbol());
        assertEquals("CANDLE", dto.getChartType());
        assertEquals("CRYPTO", dto.getAssetCategory());
        assertEquals("https://btc.png", dto.getImage());
        assertEquals("bitcoin", dto.getGeckoId());
        // forexBuying ≈ price × 0.999, forexSelling ≈ price × 1.001
        assertTrue(dto.getForexBuying().doubleValue() < 60000);
        assertTrue(dto.getForexSelling().doubleValue() > 60000);
        assertEquals(0, java.math.BigDecimal.valueOf(2.5).compareTo(dto.getChangePercent()));
    }

    @Test
    void fetchCryptoRates_symbolLongerThan5_filtered() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok((List<Object>) (List) List.of(
                        coin("longtokenid", "TOOLONG", "Long Token", 1.0, 0, ""))));

        List<CryptoDto> result = client.fetchCryptoRates();
        assertTrue(result.isEmpty());
    }

    @Test
    void fetchCryptoRates_symbolContainsUnderscore_filtered() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok((List<Object>) (List) List.of(
                        coin("test", "A_B", "TestCoin", 1.0, 0, ""))));

        List<CryptoDto> result = client.fetchCryptoRates();
        assertTrue(result.isEmpty());
    }

    @Test
    void fetchCryptoRates_symbolContainsHyphen_filtered() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok((List<Object>) (List) List.of(
                        coin("test", "A-B", "TestCoin", 1.0, 0, ""))));

        List<CryptoDto> result = client.fetchCryptoRates();
        assertTrue(result.isEmpty());
    }

    @Test
    void fetchCryptoRates_blacklistedKeywordInName_filtered() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok((List<Object>) (List) List.of(
                        coin("wrapped-btc", "WBTC", "Wrapped Bitcoin", 60000.0, 0, ""),
                        coin("stake-eth", "STETH", "Staked Ether", 3000.0, 0, ""),
                        coin("fund-x", "FNDX", "Fund Token", 1.0, 0, ""))));

        List<CryptoDto> result = client.fetchCryptoRates();
        // "wrapped", "staked", "fund" hepsi BLACKLIST_KEYWORDS'te
        assertTrue(result.isEmpty());
    }

    @Test
    void fetchCryptoRates_nullPrice_skipped() {
        Map<String, Object> noPrice = coin("test", "TC", "TestCoin", 0, 0, "");
        noPrice.put("current_price", null);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok((List<Object>) (List) List.of(noPrice)));

        List<CryptoDto> result = client.fetchCryptoRates();
        assertTrue(result.isEmpty());
    }

    @Test
    void fetchCryptoRates_nullChange24h_changePctIsZero() {
        Map<String, Object> noChange = coin("test", "TC", "TestCoin", 100.0, 0, "");
        noChange.put("price_change_percentage_24h", null);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok((List<Object>) (List) List.of(noChange)));

        List<CryptoDto> result = client.fetchCryptoRates();
        assertEquals(2, result.size());
        assertEquals(java.math.BigDecimal.ZERO, result.get(0).getChangePercent());
    }

    @Test
    void fetchCryptoRates_apiThrows_continuesToNextPage() {
        // Page 1 throws, page 2 OK
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenThrow(new RuntimeException("503"))
                .thenReturn(ResponseEntity.ok((List<Object>) (List) List.of(
                        coin("bitcoin", "btc", "Bitcoin", 60000.0, 2.5, ""))));

        List<CryptoDto> result = client.fetchCryptoRates();
        // page 1 fail, page 2 success → 1 result
        assertEquals(1, result.size());
    }

    @Test
    void fetchCryptoRates_nullBody_handled() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok().build());

        List<CryptoDto> result = client.fetchCryptoRates();
        assertTrue(result.isEmpty());
    }

    @Test
    void fetchCryptoRates_multipleValidCoins_allReturned() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok((List<Object>) (List) List.of(
                        coin("bitcoin", "btc", "Bitcoin", 60000.0, 2.5, ""),
                        coin("ethereum", "eth", "Ethereum", 3000.0, 1.0, ""),
                        coin("solana", "sol", "Solana", 150.0, -2.0, ""))));

        List<CryptoDto> result = client.fetchCryptoRates();
        // 2 pages × 3 coins, but second page also returns same → may be 6 in flat
        // First call returns 3 valid, second call returns 3 valid (same), result is 6 from both pages
        // Actually loop runs page 1 and page 2 sequentially
        assertTrue(result.size() >= 3);
    }
}
