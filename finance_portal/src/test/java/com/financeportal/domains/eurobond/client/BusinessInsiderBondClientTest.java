package com.financeportal.domains.eurobond.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.eurobond.client.BusinessInsiderBondClient.BusinessInsiderBondDetail;
import com.financeportal.model.dto.market.HistoricalDataDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BusinessInsiderBondClientTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private BusinessInsiderBondClient client;

    private final ObjectMapper mapper = new ObjectMapper();

    // Gerçek businessinsider bono sayfasındaki alanların minimal kopyası
    private static final String DETAIL_HTML = """
            <html><head><title>TÜRKEI, REPUBLIKDL-NOTES 2026(31) Bond | Markets Insider</title></head>
            <body>
            <span class="price-section__current-value">99.37</span>
            <span class="price-section__absolute-value">+0.39</span>
            <span class="price-section__relative-value">+0.39%</span>
            <p>... has a maturity date of 5/22/2031 and offers a coupon of 6.3750%.
               The current yield of 6.55%. ...</p>
            <script> var data = { "Currency" : "USD", "TKData" : "1,155688342,1330,333" }; </script>
            </body></html>
            """;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(client, "baseUrl", "http://test");
    }

    @Test
    void fetchDetail_blankSlug_returnsNull_skipsHttp() {
        assertNull(client.fetchDetail("  "));
        verifyNoInteractions(restTemplate);
    }

    @Test
    void fetchDetail_parsesAllFields() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(DETAIL_HTML));

        BusinessInsiderBondDetail d = client.fetchDetail("some-slug");

        assertEquals("1,155688342,1330,333", d.getTkData());
        assertEquals("USD", d.getCurrency());
        assertEquals(new BigDecimal("6.3750"), d.getCoupon());
        assertEquals(new BigDecimal("6.55"), d.getBondYield());
        assertEquals(new BigDecimal("99.37"), d.getPrice());
        assertEquals(new BigDecimal("0.39"), d.getChangePercent());
        assertEquals("2031-05-22", d.getMaturity()); // 5/22/2031 → ISO
    }

    @Test
    void fetchDetail_httpError_returnsNull() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("503"));
        assertNull(client.fetchDetail("slug"));
    }

    @Test
    void fetchChart_blankTk_returnsEmpty_skipsHttp() {
        assertTrue(client.fetchChart("", "1y").isEmpty());
        verifyNoInteractions(restTemplate);
    }

    @Test
    void fetchChart_mapsPointsAndNullsOutZeroOhlc() throws Exception {
        JsonNode body = mapper.readTree("""
                [
                  {"Close":139.2,"Open":0,"High":0,"Low":0,"Volume":0,"Date":"2015-01-19 00:00:00"},
                  {"Close":139.7,"Open":139.8,"High":140.1,"Low":139.5,"Volume":0,"Date":"2015-01-20 00:00:00"}
                ]
                """);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok(body));

        List<HistoricalDataDto> data = client.fetchChart("1,155688342,1330,333", "5y");

        assertEquals(2, data.size());
        HistoricalDataDto p0 = data.get(0);
        assertEquals(LocalDate.of(2015, 1, 19), p0.getDate());
        assertEquals(new BigDecimal("139.2"), p0.getClose());
        assertEquals(p0.getClose(), p0.getPrice());
        assertNull(p0.getOpen()); // Open=0 → null (veri yok)

        HistoricalDataDto p1 = data.get(1);
        assertEquals(new BigDecimal("139.8"), p1.getOpen()); // gerçek değer korunur
    }

    @Test
    void fetchChart_nonArrayBody_returnsEmpty() throws Exception {
        JsonNode obj = mapper.readTree("{\"error\":\"x\"}");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok(obj));
        assertTrue(client.fetchChart("1,2,3,4", "1y").isEmpty());
    }
}
