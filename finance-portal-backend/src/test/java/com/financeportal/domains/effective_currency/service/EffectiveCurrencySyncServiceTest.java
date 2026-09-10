package com.financeportal.domains.effective_currency.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.EvdsClient;
import com.financeportal.service.bootstrap.BootstrapReadinessTracker;
import com.financeportal.service.cache.CacheService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EffectiveCurrencySyncServiceTest {

    @Mock private EvdsClient evdsClient;
    @Mock private CacheService cacheService;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private BootstrapReadinessTracker bootstrapTracker;

    private EffectiveCurrencySyncService service;

    @BeforeEach
    void setUp() {
        service = new EffectiveCurrencySyncService(evdsClient, cacheService, redisTemplate, new ObjectMapper(), bootstrapTracker);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    void registerBootstrap_callsTracker() {
        service.registerBootstrap();
        verify(bootstrapTracker).register("EffectiveCurrency");
    }

    private JsonNode jsonNode(String json) throws Exception {
        return new ObjectMapper().readTree(json);
    }

    private Path writeXml(Path dir, String content) throws IOException {
        Path file = dir.resolve("tcmb.xml");
        Files.writeString(file, content);
        return file;
    }

    @Test
    void syncEffective_validXml_savesCacheAndMarksComplete(@TempDir Path tmp) throws Exception {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <Tarih_Date>
                  <Currency CurrencyCode="USD">
                    <Isim>ABD DOLARI</Isim>
                    <BanknoteBuying>34.00</BanknoteBuying>
                    <BanknoteSelling>34.10</BanknoteSelling>
                  </Currency>
                  <Currency CurrencyCode="ZZZ">
                    <Isim>Unknown</Isim>
                    <BanknoteBuying>1.0</BanknoteBuying>
                    <BanknoteSelling>1.0</BanknoteSelling>
                  </Currency>
                </Tarih_Date>
                """;
        Path xmlFile = writeXml(tmp, xml);
        ReflectionTestUtils.setField(service, "tcmbXmlUrl", xmlFile.toUri().toString());

        // EVDS cache hit on every code → skip fetch
        when(redisTemplate.hasKey(anyString())).thenReturn(true);

        service.syncEffectiveCurrencies();

        // Save called with 1 entry (USD)
        verify(cacheService).save(eq("cache:effective-currencies"), any(), anyLong());
        verify(bootstrapTracker).markComplete("EffectiveCurrency");
    }

    @Test
    void syncEffective_emptyBanknoteSkipped(@TempDir Path tmp) throws Exception {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <Tarih_Date>
                  <Currency CurrencyCode="USD">
                    <Isim>ABD DOLARI</Isim>
                    <BanknoteBuying></BanknoteBuying>
                    <BanknoteSelling></BanknoteSelling>
                  </Currency>
                </Tarih_Date>
                """;
        Path xmlFile = writeXml(tmp, xml);
        ReflectionTestUtils.setField(service, "tcmbXmlUrl", xmlFile.toUri().toString());
        when(redisTemplate.hasKey(anyString())).thenReturn(true);

        service.syncEffectiveCurrencies();

        // Hiç sonuç yok → cache.save called with 0 elements means won't be called
        verify(cacheService, never()).save(eq("cache:effective-currencies"), any(), anyLong());
    }

    @Test
    void syncEffective_evdsCacheMiss_fetchesAndSaves(@TempDir Path tmp) throws Exception {
        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Tarih_Date></Tarih_Date>";
        Path xmlFile = writeXml(tmp, xml);
        ReflectionTestUtils.setField(service, "tcmbXmlUrl", xmlFile.toUri().toString());

        // Cache miss on USD → fetch happens
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        List<JsonNode> nodes = List.of(
                jsonNode("{\"Tarih\":\"01-01-2024\",\"TP.DK.USD.S.EF.YTL\":\"34.00\"}"),
                jsonNode("{\"Tarih\":\"02-01-2024\",\"TP.DK.USD.S.EF.YTL\":\"34.10\"}")
        );
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), anyInt())).thenReturn(nodes);
        when(evdsClient.extractValueFromNode(any(JsonNode.class), anyString()))
                .thenReturn(34.00).thenReturn(34.10);

        service.syncEffectiveCurrencies();

        // Saves at least once
        verify(valueOps, org.mockito.Mockito.atLeastOnce()).set(anyString(), anyString(), anyLong(), any());
    }

    @Test
    void syncEffective_invalidDatesInNodesSkipped(@TempDir Path tmp) throws Exception {
        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Tarih_Date></Tarih_Date>";
        Path xmlFile = writeXml(tmp, xml);
        ReflectionTestUtils.setField(service, "tcmbXmlUrl", xmlFile.toUri().toString());

        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        // Invalid date format, no "Tarih" field
        List<JsonNode> nodes = List.of(
                jsonNode("{\"Tarih\":\"not-a-date\",\"TP.DK.USD.S.EF.YTL\":\"34.00\"}"),
                jsonNode("{\"TP.DK.USD.S.EF.YTL\":\"34.10\"}")
        );
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), anyInt())).thenReturn(nodes);
        when(evdsClient.extractValueFromNode(any(JsonNode.class), anyString())).thenReturn(34.0);

        service.syncEffectiveCurrencies();
        // Tüm noktalar atlandı; history boş → set çağrılmaz
        verify(cacheService, never()).save(eq("cache:effective-currencies"), any(), anyLong());
    }

    @Test
    void syncEffective_evdsFetchThrows_swallowed(@TempDir Path tmp) throws Exception {
        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Tarih_Date></Tarih_Date>";
        Path xmlFile = writeXml(tmp, xml);
        ReflectionTestUtils.setField(service, "tcmbXmlUrl", xmlFile.toUri().toString());

        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), anyInt())).thenThrow(new RuntimeException("boom"));

        service.syncEffectiveCurrencies();
        verify(bootstrapTracker).markComplete("EffectiveCurrency");
    }

    private static final String USD_BANKNOTE_XML = """
            <?xml version="1.0" encoding="UTF-8"?>
            <Tarih_Date>
              <Currency CurrencyCode="USD">
                <Isim>ABD DOLARI</Isim>
                <BanknoteBuying>34.10</BanknoteBuying>
                <BanknoteSelling>34.20</BanknoteSelling>
              </Currency>
            </Tarih_Date>
            """;

    /**
     * calcChangesFromRedis branch'lerini tek parametreli test ile kapsar:
     * multi-point geçmiş (değişim hesaplanır), null (boş map), invalid JSON (swallow), tek nokta (zero changes).
     * Hepsinde TCMB banknote XML aynı → cache.save her durumda çağrılır.
     */
    @org.junit.jupiter.params.ParameterizedTest(name = "redis history = {0}")
    @org.junit.jupiter.params.provider.NullSource
    @org.junit.jupiter.params.provider.ValueSource(strings = {
            "[{\"date\":\"2020-01-01\",\"close\":7.0},{\"date\":\"2024-01-01\",\"close\":33.0}]",
            "garbage",
            "[{\"date\":\"2024-01-01\",\"close\":33.0}]"
    })
    void calcChanges_variousRedisHistories_alwaysSavesCache(String redisHistoryJson, @TempDir Path tmp) throws Exception {
        Path xmlFile = writeXml(tmp, USD_BANKNOTE_XML);
        ReflectionTestUtils.setField(service, "tcmbXmlUrl", xmlFile.toUri().toString());

        when(redisTemplate.hasKey(anyString())).thenReturn(true); // skip evds sync
        when(valueOps.get("evds:effective-currency:USD")).thenReturn(redisHistoryJson);

        service.syncEffectiveCurrencies();
        verify(cacheService).save(eq("cache:effective-currencies"), any(), anyLong());
    }

    @Test
    void xmlParseFails_swallowedAndMarksComplete() {
        ReflectionTestUtils.setField(service, "tcmbXmlUrl", "file:///nonexistent/tcmb.xml");
        when(redisTemplate.hasKey(anyString())).thenReturn(true);

        service.syncEffectiveCurrencies();

        verify(bootstrapTracker).markComplete("EffectiveCurrency");
    }
}
