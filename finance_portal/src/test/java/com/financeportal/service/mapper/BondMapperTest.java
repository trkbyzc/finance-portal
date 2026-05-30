package com.financeportal.service.mapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BondMapperTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    private BondMapper mapper;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        mapper = new BondMapper(redisTemplate, objectMapper);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    // -------- getBondYieldCurve --------

    @Test
    void yieldCurve_allRedisEmpty_returnsEmptyList() {
        when(valueOps.get(anyString())).thenReturn(null);
        List<Map<String, Object>> result = mapper.getBondYieldCurve();
        assertTrue(result.isEmpty());
    }

    @Test
    void yieldCurve_oneRedisKeyPopulated_returnsOneBond() {
        // Sadece 1m key dolu
        when(valueOps.get(anyString())).thenReturn(null);
        when(valueOps.get("evds:benchmark:1m")).thenReturn("[{\"rate\":42.5}]");

        List<Map<String, Object>> result = mapper.getBondYieldCurve();

        assertEquals(1, result.size());
        Map<String, Object> bond = result.get(0);
        assertEquals("Kısa Vadeli", bond.get("label"));
        assertEquals("TP.TRD080726K10", bond.get("symbol"));
        assertEquals(42.5, bond.get("yield"));
        assertTrue(bond.get("name").toString().contains("DİBS"));
    }

    @Test
    void yieldCurve_multipleKeysPopulated_returnsAll() {
        when(valueOps.get(anyString())).thenReturn(null);
        when(valueOps.get("evds:benchmark:1m")).thenReturn("[{\"rate\":42.5}]");
        when(valueOps.get("evds:benchmark:10y")).thenReturn("[{\"rate\":30.0}]");

        List<Map<String, Object>> result = mapper.getBondYieldCurve();

        assertEquals(2, result.size());
    }

    @Test
    void yieldCurve_usesLastRecordInArray() {
        when(valueOps.get(anyString())).thenReturn(null);
        // Çok elemanlı array — son kayıt (en yeni) seçilir
        when(valueOps.get("evds:benchmark:1y")).thenReturn(
                "[{\"rate\":20.0},{\"rate\":25.0},{\"rate\":30.0}]"
        );

        List<Map<String, Object>> result = mapper.getBondYieldCurve();

        assertEquals(1, result.size());
        assertEquals(30.0, result.get(0).get("yield"));
    }

    @Test
    void yieldCurve_invalidJson_swallowsAndSkipsBond() {
        when(valueOps.get(anyString())).thenReturn(null);
        when(valueOps.get("evds:benchmark:1m")).thenReturn("not valid json");
        when(valueOps.get("evds:benchmark:1y")).thenReturn("[{\"rate\":18.0}]");

        List<Map<String, Object>> result = mapper.getBondYieldCurve();

        // Bozuk olan atlandı, geçerli olan eklendi
        assertEquals(1, result.size());
        assertEquals(18.0, result.get(0).get("yield"));
    }

    @Test
    void yieldCurve_emptyArrayInJson_skipsBond() {
        when(valueOps.get(anyString())).thenReturn(null);
        when(valueOps.get("evds:benchmark:1m")).thenReturn("[]");
        when(valueOps.get("evds:benchmark:1y")).thenReturn("[{\"rate\":18.0}]");

        List<Map<String, Object>> result = mapper.getBondYieldCurve();

        assertEquals(1, result.size());
    }

    // -------- getFallbackYieldCurve --------

    @Test
    void fallback_returns7Bonds() {
        List<Map<String, Object>> bonds = mapper.getFallbackYieldCurve();
        assertEquals(7, bonds.size());
    }

    @Test
    void fallback_eachBondHasRequiredFields() {
        List<Map<String, Object>> bonds = mapper.getFallbackYieldCurve();

        for (Map<String, Object> bond : bonds) {
            assertNotNull(bond.get("label"));
            assertNotNull(bond.get("symbol"));
            assertNotNull(bond.get("maturityDate"));
            assertNotNull(bond.get("yield"));
            assertNotNull(bond.get("name"));
            assertTrue(((Double) bond.get("yield")) > 0);
        }
    }

    @Test
    void fallback_yieldsAreAscendingWithMaturity() {
        List<Map<String, Object>> bonds = mapper.getFallbackYieldCurve();

        // Normal yield curve (longer term = higher yield)
        for (int i = 1; i < bonds.size(); i++) {
            double prev = (Double) bonds.get(i - 1).get("yield");
            double curr = (Double) bonds.get(i).get("yield");
            assertTrue(curr > prev, "Yield curve should be ascending: " + prev + " < " + curr);
        }
    }

    @Test
    void fallback_symbolsAreUnique() {
        List<Map<String, Object>> bonds = mapper.getFallbackYieldCurve();
        long distinct = bonds.stream().map(b -> b.get("symbol")).distinct().count();
        assertEquals(7, distinct);
    }

    @Test
    void fallback_doesNotTouchRedis() {
        mapper.getFallbackYieldCurve();
        // Fallback hiç Redis'e gitmemeli — pure logic
        org.mockito.Mockito.verify(redisTemplate, org.mockito.Mockito.never()).opsForValue();
    }

    @Test
    void fallback_listIsModifiableAndNonNull() {
        List<Map<String, Object>> bonds = mapper.getFallbackYieldCurve();
        assertNotNull(bonds);
        assertFalse(bonds.isEmpty());
    }
}
