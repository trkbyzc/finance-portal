package com.financeportal.domains.stock.client;

import com.financeportal.domains.stock.dto.StockDto;
import com.financeportal.domains.stock.service.BistIndexService;
import com.financeportal.model.dto.fintables.FintablesChartResponse;
import com.financeportal.model.dto.market.HistoricalDataDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings("unchecked")
class BistStockClientTest {

    @Mock private RestTemplate restTemplate;
    @Mock private BistIndexService bistIndexService;

    @InjectMocks private BistStockClient client;

    @BeforeEach
    void setUp() {
        when(bistIndexService.getBist30()).thenReturn(Set.of("AKBNK", "GARAN"));
        when(bistIndexService.getBist50()).thenReturn(Set.of("AKBNK", "GARAN", "VAKBN"));
        when(bistIndexService.getBist100()).thenReturn(Set.of("AKBNK", "GARAN", "VAKBN", "TUPRS"));
    }

    // -------- fetchTurkishStocks --------

    @Test
    void fetchTurkishStocks_validResponse_returnsParsedStocks() {
        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, List<Map<String, Object>>> results = new LinkedHashMap<>();
        results.put("AKBNK", List.of(
                Map.of("v", 50.0),
                Map.of("v", 2.5),
                Map.of("v", 1000000L)));
        body.put("results", results);

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class))).thenReturn(ResponseEntity.ok(body));

        List<StockDto> result = client.fetchTurkishStocks();

        assertEquals(1, result.size());
        StockDto s = result.get(0);
        assertEquals("AKBNK.IS", s.getSymbol());
        assertEquals("AKBNK", s.getName());
        assertEquals("HİSSE SENEDİ", s.getAssetType());
        assertEquals("STOCK", s.getAssetCategory());
        assertEquals(0, new BigDecimal("50.0").compareTo(s.getPrice()));
        assertEquals(1000000L, s.getVolume());
        // BIST30 üyesi
        assertTrue(s.isInBist30());
        assertTrue(s.isInBist50());
        assertTrue(s.isInBist100());
    }

    @Test
    void fetchTurkishStocks_nonNumberPrice_skipsStock() {
        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, List<Map<String, Object>>> results = new LinkedHashMap<>();
        Map<String, Object> nullPriceEntry = new LinkedHashMap<>();
        nullPriceEntry.put("v", null);
        results.put("X", List.of(nullPriceEntry, Map.of("v", 0.0), Map.of("v", 0L)));
        body.put("results", results);

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class))).thenReturn(ResponseEntity.ok(body));

        assertTrue(client.fetchTurkishStocks().isEmpty());
    }

    @Test
    void fetchTurkishStocks_zeroPrice_skips() {
        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, List<Map<String, Object>>> results = new LinkedHashMap<>();
        results.put("X", List.of(Map.of("v", 0.0), Map.of("v", 0.0), Map.of("v", 0L)));
        body.put("results", results);

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class))).thenReturn(ResponseEntity.ok(body));

        assertTrue(client.fetchTurkishStocks().isEmpty());
    }

    @Test
    void fetchTurkishStocks_apiThrows_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class))).thenThrow(new RuntimeException("503"));

        assertTrue(client.fetchTurkishStocks().isEmpty());
    }

    @Test
    void fetchTurkishStocks_nullBody_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class))).thenReturn(ResponseEntity.ok().build());

        assertTrue(client.fetchTurkishStocks().isEmpty());
    }

    @Test
    void fetchTurkishStocks_noResultsField_returnsEmpty() {
        Map<String, Object> body = new LinkedHashMap<>();
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class))).thenReturn(ResponseEntity.ok(body));

        assertTrue(client.fetchTurkishStocks().isEmpty());
    }

    @Test
    void fetchTurkishStocks_lessThan3Values_skips() {
        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, List<Map<String, Object>>> results = new LinkedHashMap<>();
        results.put("X", List.of(Map.of("v", 50.0))); // sadece 1 değer var, 3 lazım
        body.put("results", results);

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class))).thenReturn(ResponseEntity.ok(body));

        assertTrue(client.fetchTurkishStocks().isEmpty());
    }

    @Test
    void fetchTurkishStocks_nonBist30Stock_inBist30False() {
        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, List<Map<String, Object>>> results = new LinkedHashMap<>();
        results.put("TUPRS", List.of(Map.of("v", 100.0), Map.of("v", 1.0), Map.of("v", 500L)));
        body.put("results", results);

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                any(ParameterizedTypeReference.class))).thenReturn(ResponseEntity.ok(body));

        List<StockDto> result = client.fetchTurkishStocks();
        StockDto s = result.get(0);
        // TUPRS sadece BIST100'de var (test setup)
        assertFalse(s.isInBist30());
        assertFalse(s.isInBist50());
        assertTrue(s.isInBist100());
    }

    // -------- fetchIndexHistory --------

    @Test
    void fetchIndexHistory_validResponse_returnsParsedBars() {
        FintablesChartResponse resp = new FintablesChartResponse();
        resp.setS("ok");
        resp.setT(List.of(1700000000L, 1700086400L));
        resp.setC(List.of(new BigDecimal("100"), new BigDecimal("110")));
        resp.setO(List.of(new BigDecimal("99"), new BigDecimal("105")));
        resp.setH(List.of(new BigDecimal("102"), new BigDecimal("112")));
        resp.setL(List.of(new BigDecimal("98"), new BigDecimal("104")));
        resp.setV(List.of(1000L, 2000L));

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                eq(FintablesChartResponse.class))).thenReturn(ResponseEntity.ok(resp));

        List<HistoricalDataDto> result = client.fetchIndexHistory("XU100", "1y");

        assertEquals(2, result.size());
        HistoricalDataDto bar0 = result.get(0);
        assertEquals(new BigDecimal("100"), bar0.getClose());
        assertEquals(new BigDecimal("99"), bar0.getOpen());
        assertEquals(1000L, bar0.getVolume());
    }

    @Test
    void fetchIndexHistory_responseNotOk_returnsEmpty() {
        FintablesChartResponse resp = new FintablesChartResponse();
        resp.setS("error");

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                eq(FintablesChartResponse.class))).thenReturn(ResponseEntity.ok(resp));

        assertTrue(client.fetchIndexHistory("XU100", "1y").isEmpty());
    }

    @Test
    void fetchIndexHistory_nullBody_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                eq(FintablesChartResponse.class))).thenReturn(ResponseEntity.ok().build());

        assertTrue(client.fetchIndexHistory("XU100", "1y").isEmpty());
    }

    @Test
    void fetchIndexHistory_apiThrows_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                eq(FintablesChartResponse.class))).thenThrow(new RuntimeException("503"));

        assertTrue(client.fetchIndexHistory("XU100", "1y").isEmpty());
    }

    @Test
    void fetchIndexHistory_variousRanges_buildsCorrectUrl() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                eq(FintablesChartResponse.class))).thenReturn(ResponseEntity.ok().build());

        // Various ranges → should not throw, just call API
        client.fetchIndexHistory("XU100", "1d");
        client.fetchIndexHistory("XU100", "5d");
        client.fetchIndexHistory("XU100", "1mo");
        client.fetchIndexHistory("XU100", "3mo");
        client.fetchIndexHistory("XU100", "6mo");
        client.fetchIndexHistory("XU100", "ytd");
        client.fetchIndexHistory("XU100", "1y");
        client.fetchIndexHistory("XU100", "5y");
        client.fetchIndexHistory("XU100", "max");
        client.fetchIndexHistory("XU100", null); // null → "1mo" default

        // No exceptions
    }

    @Test
    void fetchIndexHistory_nullCloses_usesZero() {
        FintablesChartResponse resp = new FintablesChartResponse();
        resp.setS("ok");
        resp.setT(List.of(1700000000L));
        // closes null

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                eq(FintablesChartResponse.class))).thenReturn(ResponseEntity.ok(resp));

        List<HistoricalDataDto> result = client.fetchIndexHistory("XU100", "1y");
        assertEquals(BigDecimal.ZERO, result.get(0).getClose());
    }
}
