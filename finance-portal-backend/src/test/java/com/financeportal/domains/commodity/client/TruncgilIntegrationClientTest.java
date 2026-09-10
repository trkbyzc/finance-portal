package com.financeportal.domains.commodity.client;

import com.financeportal.domains.commodity.dto.CommodityDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TruncgilIntegrationClientTest {

    @Mock private RestTemplate restTemplate;
    @InjectMocks private TruncgilIntegrationClient client;

    @Test
    void fetch_validJson_parsesGoldVariants() {
        String json = "{" +
                "\"gram-altin\":{\"Selling\":\"2500,50\",\"Buying\":\"2495,00\",\"Change\":\"2,5\"}," +
                "\"ceyrek-altin\":{\"Selling\":\"4100,00\",\"Buying\":\"4050,00\",\"Change\":\"2,3\"}}";

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(json));

        List<CommodityDto> result = client.fetchLiveTurkishGold();

        assertEquals(2, result.size());

        CommodityDto gram = result.stream().filter(c -> "GRAM_ALTIN".equals(c.getSymbol())).findFirst().orElseThrow();
        assertEquals("Gram Altın", gram.getName());
        assertEquals("TÜRK ALTINI", gram.getAssetType());
        assertEquals("COMMODITY", gram.getAssetCategory());
        assertEquals("CANDLE", gram.getChartType());
        assertEquals("XAUTRY=X", gram.getYahooSymbol());
        assertEquals(0, new BigDecimal("2500.50").compareTo(gram.getPrice()));
        assertEquals(0, new BigDecimal("2495.00").compareTo(gram.getBuyPrice()));
        assertEquals(0, new BigDecimal("2.5").compareTo(gram.getChangePercent()));
        assertEquals(0L, gram.getVolume());
    }

    @Test
    void fetch_emptyOrZeroPrice_skips() {
        String json = "{\"gram-altin\":{\"Selling\":\"0\",\"Buying\":\"0\",\"Change\":\"0\"}}";

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(json));

        // Zero price → skip
        assertTrue(client.fetchLiveTurkishGold().isEmpty());
    }

    @Test
    void fetch_changeWithPercentSign_stripped() {
        String json = "{\"gram-altin\":{\"Selling\":\"2500,00\",\"Buying\":\"2495,00\",\"Change\":\"%2,5\"}}";

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(json));

        List<CommodityDto> result = client.fetchLiveTurkishGold();
        assertEquals(0, new BigDecimal("2.5").compareTo(result.get(0).getChangePercent()));
    }

    @Test
    void fetch_negativeChange_preserved() {
        String json = "{\"gram-altin\":{\"Selling\":\"2500,00\",\"Buying\":\"2495,00\",\"Change\":\"-1,5\"}}";

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(json));

        List<CommodityDto> result = client.fetchLiveTurkishGold();
        assertTrue(result.get(0).getChangePercent().compareTo(BigDecimal.ZERO) < 0);
    }

    @Test
    void fetch_priceWithCurrencySymbol_stripped() {
        String json = "{\"gram-altin\":{\"Selling\":\"₺2.500,50\",\"Buying\":\"₺2.495,00\",\"Change\":\"2\"}}";

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(json));

        List<CommodityDto> result = client.fetchLiveTurkishGold();
        // ₺ + . binlik ayracı strip edilmeli, "2500,50" → 2500.50
        assertEquals(0, new BigDecimal("2500.50").compareTo(result.get(0).getPrice()));
    }

    @Test
    void fetch_nonJsonBody_returnsEmpty() {
        // Cloudflare HTML response
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("<html>Cloudflare</html>"));

        assertTrue(client.fetchLiveTurkishGold().isEmpty());
    }

    @Test
    void fetch_nullBody_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok().build());

        assertTrue(client.fetchLiveTurkishGold().isEmpty());
    }

    @Test
    void fetch_apiThrows_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("503"));

        assertTrue(client.fetchLiveTurkishGold().isEmpty());
    }

    @Test
    void fetch_missingGoldType_skipped() {
        // Only gram-altin var, diğerleri yok
        String json = "{\"gram-altin\":{\"Selling\":\"2500,50\",\"Buying\":\"2495,00\",\"Change\":\"2,5\"}}";

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(json));

        List<CommodityDto> result = client.fetchLiveTurkishGold();
        assertEquals(1, result.size());
    }

    @Test
    void fetch_allTargetGoldTypes_parsed() {
        // All 15 gold types present
        StringBuilder sb = new StringBuilder("{");
        String[] types = {"gram-altin", "gram-has-altin", "ceyrek-altin", "yarim-altin", "tam-altin",
                "cumhuriyet-altini", "ata-altin", "14-ayar-altin", "18-ayar-altin", "22-ayar-bilezik",
                "ikibucuk-altin", "besli-altin", "gremse-altin", "resat-altin", "hamit-altin"};
        for (int i = 0; i < types.length; i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(types[i]).append("\":{\"Selling\":\"1000\",\"Buying\":\"990\",\"Change\":\"1\"}");
        }
        sb.append("}");

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(sb.toString()));

        List<CommodityDto> result = client.fetchLiveTurkishGold();
        assertEquals(15, result.size());
    }
}
