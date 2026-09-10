package com.financeportal.service.portfolio;

import com.financeportal.model.dto.simulation.PricePointDto;
import com.financeportal.model.dto.simulation.SimulationResultDto;
import com.financeportal.model.dto.whatif.WhatIfAssetRef;
import com.financeportal.model.dto.whatif.WhatIfAssetSeries;
import com.financeportal.model.dto.whatif.WhatIfRequestDto;
import com.financeportal.model.dto.whatif.WhatIfResultDto;
import com.financeportal.model.enums.AssetType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WhatIfServiceTest {

    @Mock private SimulationService simulationService;

    @InjectMocks private WhatIfService service;

    // -------- compare: input validation --------

    @Test
    void compare_nullRequest_returnsEmptyResult() {
        WhatIfResultDto result = service.compare(null);
        assertTrue(result.getAssets().isEmpty());
        assertNull(result.getInvestmentDate());
    }

    @Test
    void compare_nullInvestmentDate_returnsEmptyResult() {
        WhatIfRequestDto req = new WhatIfRequestDto(null, new BigDecimal("1000"), List.of(
                new WhatIfAssetRef("BTC", AssetType.CRYPTO, null)));
        WhatIfResultDto result = service.compare(req);
        assertTrue(result.getAssets().isEmpty());
    }

    @Test
    void compare_nullAssets_returnsEmptyResult() {
        WhatIfRequestDto req = new WhatIfRequestDto(LocalDate.now(), new BigDecimal("1000"), null);
        WhatIfResultDto result = service.compare(req);
        assertTrue(result.getAssets().isEmpty());
    }

    @Test
    void compare_emptyAssets_returnsEmptyResult() {
        WhatIfRequestDto req = new WhatIfRequestDto(LocalDate.now(), new BigDecimal("1000"), List.of());
        WhatIfResultDto result = service.compare(req);
        assertTrue(result.getAssets().isEmpty());
    }

    @Test
    void compare_noAmountNoQuantity_returnsEmptyResult() {
        WhatIfRequestDto req = new WhatIfRequestDto(LocalDate.now(), null, List.of(
                new WhatIfAssetRef("BTC", AssetType.CRYPTO, null)));
        WhatIfResultDto result = service.compare(req);
        assertTrue(result.getAssets().isEmpty());
    }

    @Test
    void compare_zeroAmount_treatedAsNoAmount() {
        WhatIfRequestDto req = new WhatIfRequestDto(LocalDate.now(), BigDecimal.ZERO, List.of(
                new WhatIfAssetRef("BTC", AssetType.CRYPTO, null)));
        WhatIfResultDto result = service.compare(req);
        assertTrue(result.getAssets().isEmpty());
    }

    // -------- compare: amount mode --------

    @Test
    void compare_amountMode_callsComputeForEachAsset() {
        WhatIfRequestDto req = new WhatIfRequestDto(
                LocalDate.of(2024, 1, 1),
                new BigDecimal("10000"),
                List.of(
                        new WhatIfAssetRef("BTC", AssetType.CRYPTO, null),
                        new WhatIfAssetRef("AAPL", AssetType.STOCK, null)));

        when(simulationService.compute(anyString(), any(), any(), any())).thenReturn(simResult());

        WhatIfResultDto result = service.compare(req);

        assertEquals(2, result.getAssets().size());
        verify(simulationService).compute(eq("BTC"), eq(AssetType.CRYPTO), any(), eq(new BigDecimal("10000")));
        verify(simulationService).compute(eq("AAPL"), eq(AssetType.STOCK), any(), eq(new BigDecimal("10000")));
    }

    // -------- compare: quantity mode --------

    @Test
    void compare_quantityModeAllAssets_usesComputeFromQuantity() {
        WhatIfRequestDto req = new WhatIfRequestDto(
                LocalDate.of(2024, 1, 1),
                null,  // no global amount
                List.of(new WhatIfAssetRef("BTC", AssetType.CRYPTO, new BigDecimal("1"))));

        when(simulationService.computeFromQuantity(anyString(), any(), any(), any())).thenReturn(simResult());

        WhatIfResultDto result = service.compare(req);

        assertEquals(1, result.getAssets().size());
        verify(simulationService).computeFromQuantity(eq("BTC"), eq(AssetType.CRYPTO), any(), eq(new BigDecimal("1")));
    }

    @Test
    void compare_quantityModeButOneAssetMissingQty_treatedAsNoQtyMode() {
        // one of two assets has no quantity → falls back to amount check → no amount → empty
        WhatIfRequestDto req = new WhatIfRequestDto(
                LocalDate.of(2024, 1, 1),
                null,
                List.of(
                        new WhatIfAssetRef("BTC", AssetType.CRYPTO, new BigDecimal("1")),
                        new WhatIfAssetRef("ETH", AssetType.CRYPTO, null)));

        WhatIfResultDto result = service.compare(req);
        assertTrue(result.getAssets().isEmpty());
    }

    // -------- result series shape --------

    @Test
    void compare_amountMode_responseContainsSymbolsAndValues() {
        WhatIfRequestDto req = new WhatIfRequestDto(
                LocalDate.of(2024, 1, 1),
                new BigDecimal("1000"),
                List.of(new WhatIfAssetRef("BTC", AssetType.CRYPTO, null)));

        SimulationResultDto sim = SimulationResultDto.builder()
                .currentValue(new BigDecimal("2000"))
                .pnlTry(new BigDecimal("1000"))
                .pnlPct(new BigDecimal("100"))
                .series(List.of(new PricePointDto(LocalDate.now(), new BigDecimal("1000"))))
                .build();
        when(simulationService.compute(anyString(), any(), any(), any())).thenReturn(sim);

        WhatIfResultDto result = service.compare(req);

        assertEquals(1, result.getAssets().size());
        WhatIfAssetSeries series = result.getAssets().get(0);
        assertEquals("BTC", series.getSymbol());
        assertEquals(AssetType.CRYPTO, series.getAssetType());
        assertEquals("CRYPTO:BTC", series.getKey());
        assertEquals(0, new BigDecimal("2000").compareTo(series.getCurrentValue()));
    }

    @Test
    void compare_simulationWithWarning_propagated() {
        WhatIfRequestDto req = new WhatIfRequestDto(
                LocalDate.of(2024, 1, 1),
                new BigDecimal("1000"),
                List.of(new WhatIfAssetRef("XYZ", AssetType.STOCK, null)));

        SimulationResultDto sim = SimulationResultDto.builder()
                .currentValue(BigDecimal.ZERO)
                .pnlTry(BigDecimal.ZERO)
                .pnlPct(BigDecimal.ZERO)
                .series(List.of())
                .warning("Yeterli historical yok")
                .build();
        when(simulationService.compute(anyString(), any(), any(), any())).thenReturn(sim);

        WhatIfResultDto result = service.compare(req);

        assertEquals("Yeterli historical yok", result.getAssets().get(0).getWarning());
    }

    // -------- downsample (via large series) --------

    @Test
    void compare_largeSeriesDownsampledTo300Points() {
        WhatIfRequestDto req = new WhatIfRequestDto(
                LocalDate.of(2020, 1, 1),
                new BigDecimal("1000"),
                List.of(new WhatIfAssetRef("BTC", AssetType.CRYPTO, null)));

        // 1500 noktalı series
        List<PricePointDto> bigSeries = new ArrayList<>();
        for (int i = 0; i < 1500; i++) {
            bigSeries.add(new PricePointDto(LocalDate.of(2020, 1, 1).plusDays(i), new BigDecimal(1000 + i)));
        }
        SimulationResultDto sim = SimulationResultDto.builder()
                .currentValue(new BigDecimal("2500"))
                .pnlTry(new BigDecimal("1500"))
                .pnlPct(new BigDecimal("150"))
                .series(bigSeries)
                .build();
        when(simulationService.compute(anyString(), any(), any(), any())).thenReturn(sim);

        WhatIfResultDto result = service.compare(req);

        // 300'e indirildi, son nokta korundu
        List<PricePointDto> sampled = result.getAssets().get(0).getSeries();
        assertEquals(300, sampled.size());
        assertEquals(bigSeries.get(bigSeries.size() - 1), sampled.get(sampled.size() - 1));
    }

    @Test
    void compare_smallSeriesNotDownsampled() {
        WhatIfRequestDto req = new WhatIfRequestDto(
                LocalDate.of(2024, 1, 1),
                new BigDecimal("1000"),
                List.of(new WhatIfAssetRef("BTC", AssetType.CRYPTO, null)));

        List<PricePointDto> small = List.of(
                new PricePointDto(LocalDate.of(2024, 1, 1), new BigDecimal("1000")),
                new PricePointDto(LocalDate.of(2024, 1, 2), new BigDecimal("1100")));
        SimulationResultDto sim = simResult();
        sim.setSeries(small);
        when(simulationService.compute(anyString(), any(), any(), any())).thenReturn(sim);

        WhatIfResultDto result = service.compare(req);

        assertEquals(2, result.getAssets().get(0).getSeries().size());
    }

    @Test
    void compare_nullSeriesInSim_treatedAsEmpty() {
        WhatIfRequestDto req = new WhatIfRequestDto(
                LocalDate.of(2024, 1, 1),
                new BigDecimal("1000"),
                List.of(new WhatIfAssetRef("BTC", AssetType.CRYPTO, null)));

        SimulationResultDto sim = SimulationResultDto.builder()
                .currentValue(BigDecimal.ZERO).pnlTry(BigDecimal.ZERO).pnlPct(BigDecimal.ZERO)
                .series(null)
                .build();
        when(simulationService.compute(anyString(), any(), any(), any())).thenReturn(sim);

        WhatIfResultDto result = service.compare(req);

        assertTrue(result.getAssets().get(0).getSeries().isEmpty());
    }

    // -------- helper --------

    private SimulationResultDto simResult() {
        return SimulationResultDto.builder()
                .unitsBought(new BigDecimal("1"))
                .entryPrice(new BigDecimal("1000"))
                .currentPrice(new BigDecimal("1500"))
                .currentValue(new BigDecimal("1500"))
                .pnlTry(new BigDecimal("500"))
                .pnlPct(new BigDecimal("50"))
                .series(List.of(new PricePointDto(LocalDate.now(), new BigDecimal("1000"))))
                .build();
    }
}
