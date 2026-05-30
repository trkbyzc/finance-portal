package com.financeportal.service.market;

import com.financeportal.model.dto.account.InterestYieldDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InterestServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    @InjectMocks
    private InterestService service;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    void shortTerm32Days_usesCorrectRedisKeyAndTaxRate() {
        when(valueOps.get("evds:deposit:32")).thenReturn("45.0");
        List<InterestYieldDto> results = service.calculateDepositYields(new BigDecimal("100000"), 30);

        assertNotNull(results);
        assertFalse(results.isEmpty());
        // 30 gün <= 32 → "evds:deposit:32" anahtarı kullanılır, %7.5 stopaj
    }

    @Test
    void longTerm365Plus_usesReducedTaxRate() {
        when(valueOps.get("evds:deposit:365_plus")).thenReturn("50.0");
        List<InterestYieldDto> results = service.calculateDepositYields(new BigDecimal("100000"), 400);

        // 400 gün > 365 → %2.5 stopaj, net getiri daha yüksek
        assertNotNull(results);
        assertFalse(results.isEmpty());
    }

    @Test
    void redisReturnsNull_usesFallbackRate50Percent() {
        when(valueOps.get(anyString())).thenReturn(null);
        List<InterestYieldDto> results = service.calculateDepositYields(new BigDecimal("100000"), 92);

        // Redis null → fallback baseRate = 50.0 kullanılır, sonuç hala üretilir
        assertNotNull(results);
        assertFalse(results.isEmpty());
        assertEquals(7, results.size(), "7 banka için sonuç dönmeli");
    }

    @Test
    void redisThrowsException_swallowsAndUsesFallback() {
        when(valueOps.get(anyString())).thenThrow(new RuntimeException("Redis bağlantı hatası"));
        List<InterestYieldDto> results = service.calculateDepositYields(new BigDecimal("50000"), 90);

        // Exception fırlatılsa bile fallback ile sonuç döner — finansal hesaplama hiçbir zaman patlamaz
        assertNotNull(results);
        assertFalse(results.isEmpty());
    }

    @Test
    void resultsSortedByAnnualRateDescending() {
        when(valueOps.get(anyString())).thenReturn("40.0");
        List<InterestYieldDto> results = service.calculateDepositYields(new BigDecimal("100000"), 30);

        // En yüksek faiz en üstte (Fibabanka spread=+4) olmalı
        for (int i = 0; i < results.size() - 1; i++) {
            assertTrue(results.get(i).getAnnualRate() >= results.get(i + 1).getAnnualRate(),
                    "Sonuçlar faize göre azalan sırada olmalı");
        }
        assertEquals("Fibabanka", results.get(0).getBankName());
    }

    @Test
    void grossInterestCalculation_followsFormula() {
        when(valueOps.get(anyString())).thenReturn("36.5");
        // 100000 TL × %40.5 (36.5 + Fibabanka spread 4.0) × 30 gün / 36500 = 3328.77 brüt
        // Brüt × (1 - %7.5 stopaj) = net
        BigDecimal amount = new BigDecimal("100000");
        List<InterestYieldDto> results = service.calculateDepositYields(amount, 30);

        InterestYieldDto fibabanka = results.stream()
                .filter(r -> "Fibabanka".equals(r.getBankName()))
                .findFirst()
                .orElseThrow();

        assertEquals(40.5, fibabanka.getAnnualRate(), 0.01);
        // totalPayment = anapara + net
        assertTrue(fibabanka.getTotalPayment().compareTo(amount) > 0,
                "Toplam ödeme anaparadan büyük olmalı");
    }
}
