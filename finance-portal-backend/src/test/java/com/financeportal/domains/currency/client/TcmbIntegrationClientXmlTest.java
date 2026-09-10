package com.financeportal.domains.currency.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.currency.dto.CurrencyDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TcmbIntegrationClientXmlTest {

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;

    private TcmbIntegrationClient client;

    @BeforeEach
    void setUp() {
        client = new TcmbIntegrationClient(redisTemplate, new ObjectMapper());
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    private Path writeXml(Path dir, String content) throws IOException {
        Path file = dir.resolve("tcmb.xml");
        Files.writeString(file, content);
        return file;
    }

    @Test
    void fetch_validXmlWithVipCurrencies_parses(@TempDir Path tmp) throws Exception {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <Tarih_Date>
                  <Currency CurrencyCode="USD">
                    <Isim>ABD DOLARI</Isim>
                    <ForexBuying>34.10</ForexBuying>
                    <ForexSelling>34.20</ForexSelling>
                  </Currency>
                  <Currency CurrencyCode="EUR">
                    <Isim>EURO</Isim>
                    <ForexBuying>37.00</ForexBuying>
                    <ForexSelling>37.10</ForexSelling>
                  </Currency>
                  <Currency CurrencyCode="XYZ">
                    <Isim>Olmayan</Isim>
                    <ForexBuying>1.0</ForexBuying>
                    <ForexSelling>1.0</ForexSelling>
                  </Currency>
                </Tarih_Date>
                """;
        Path xmlFile = writeXml(tmp, xml);
        ReflectionTestUtils.setField(client, "tcmbXmlUrl", xmlFile.toUri().toString());

        // Redis history empty → changes 0
        when(valueOps.get(org.mockito.ArgumentMatchers.anyString())).thenReturn(null);

        List<CurrencyDto> result = client.fetchTcmbCurrencyRates();

        // Sadece USD ve EUR VIP, XYZ atlanır
        assertEquals(2, result.size());
        assertEquals("USD", result.get(0).getCurrencyCode());
        assertEquals("ABD DOLARI", result.get(0).getCurrencyName());
        assertEquals("USDTRY=X", result.get(0).getYahooSymbol());
        assertEquals("CURRENCY", result.get(0).getAssetCategory());
    }

    @Test
    void fetch_emptyForexValuesSkipped(@TempDir Path tmp) throws Exception {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <Tarih_Date>
                  <Currency CurrencyCode="USD">
                    <Isim>ABD DOLARI</Isim>
                    <ForexBuying></ForexBuying>
                    <ForexSelling></ForexSelling>
                  </Currency>
                </Tarih_Date>
                """;
        Path xmlFile = writeXml(tmp, xml);
        ReflectionTestUtils.setField(client, "tcmbXmlUrl", xmlFile.toUri().toString());

        List<CurrencyDto> result = client.fetchTcmbCurrencyRates();
        assertTrue(result.isEmpty());
    }

    @Test
    void fetch_invalidUrl_returnsEmpty() {
        ReflectionTestUtils.setField(client, "tcmbXmlUrl", "file:///nonexistent/tcmb.xml");
        assertTrue(client.fetchTcmbCurrencyRates().isEmpty());
    }

    @Test
    void fetch_withRedisHistory_computesChanges(@TempDir Path tmp) throws Exception {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <Tarih_Date>
                  <Currency CurrencyCode="USD">
                    <Isim>ABD DOLARI</Isim>
                    <ForexBuying>34.10</ForexBuying>
                    <ForexSelling>34.20</ForexSelling>
                  </Currency>
                </Tarih_Date>
                """;
        Path xmlFile = writeXml(tmp, xml);
        ReflectionTestUtils.setField(client, "tcmbXmlUrl", xmlFile.toUri().toString());

        // Redis history with 2 points so calculateChangesFromHistory hits all branches
        String today = java.time.LocalDate.now().toString();
        String yesterday = java.time.LocalDate.now().minusDays(1).toString();
        String json = "[{\"date\":\"" + yesterday + "\",\"close\":33.0},{\"date\":\"" + today + "\",\"close\":34.0}]";
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        List<CurrencyDto> result = client.fetchTcmbCurrencyRates();
        assertEquals(1, result.size());
        // daily ≈ +3.03% — at least not zero
        assertNotNull(result.get(0).getChangePercent());
    }

    @Test
    void fetchHistory_redisWithCustomRange_filtersByDates() {
        String json = "[" +
                "{\"date\":\"2024-01-01\",\"close\":33.0}," +
                "{\"date\":\"2024-06-01\",\"close\":34.0}," +
                "{\"date\":\"2024-12-01\",\"close\":35.0}]";
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        var result = client.fetchCurrencyHistoryFromRedis("USD", "custom", "2024-05-01", "2024-11-01");
        // Sadece 2024-06-01 geçer
        assertEquals(1, result.size());
    }

    @Test
    void fetchHistory_customNullStartDate_noFromFilter() {
        String json = "[{\"date\":\"2020-01-01\",\"close\":7.0},{\"date\":\"2024-01-01\",\"close\":33.0}]";
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        var result = client.fetchCurrencyHistoryFromRedis("USD", "custom", null, "2024-06-01");
        // Tüm tarihler geçer (from null → from check yok)
        assertEquals(2, result.size());
    }

    @Test
    void fetchHistory_customNullEndDate_noToFilter() {
        String json = "[{\"date\":\"2020-01-01\",\"close\":7.0},{\"date\":\"2026-01-01\",\"close\":33.0}]";
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        var result = client.fetchCurrencyHistoryFromRedis("USD", "custom", "2024-01-01", null);
        // Sadece 2026 geçer (from = 2024-01-01)
        assertEquals(1, result.size());
    }

    @Test
    void fetchHistory_currencyWithSuffix_strippedForKey() {
        when(valueOps.get("evds:currency:EUR")).thenReturn("[]");
        client.fetchCurrencyHistoryFromRedis("EURTRY=X", "1y");
        // Test: redis key EUR (suffix stripped)
        org.mockito.Mockito.verify(valueOps).get("evds:currency:EUR");
    }

    @Test
    void fetchHistory_missingDateOrClose_skipped() {
        String json = "[{\"close\":33.0},{\"date\":\"2026-01-01\"},{\"date\":\"2026-02-01\",\"close\":35.0}]";
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        var result = client.fetchCurrencyHistoryFromRedis("USD", "max");
        // Sadece 3.cü kayıt
        assertEquals(1, result.size());
    }

    @Test
    void fetchHistory_invalidDateFormat_skipped() {
        String json = "[{\"date\":\"not-a-date\",\"close\":33.0},{\"date\":\"2026-02-01\",\"close\":35.0}]";
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        var result = client.fetchCurrencyHistoryFromRedis("USD", "max");
        assertEquals(1, result.size());
    }

    @Test
    void fetchHistory_allRanges_coverGetCutoff() {
        String json = "[{\"date\":\"" + java.time.LocalDate.now().toString() + "\",\"close\":33.0}]";
        when(valueOps.get("evds:currency:USD")).thenReturn(json);
        for (String range : new String[]{"1w", "1mo", "3mo", "6mo", "1y", "5y", "10y", "all", "max", "garbage", null}) {
            assertNotNull(client.fetchCurrencyHistoryFromRedis("USD", range));
        }
    }
}
