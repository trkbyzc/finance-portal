package com.financeportal.service.mapper;

import com.financeportal.model.dto.market.CurrencyRateDto;
import com.financeportal.model.dto.market.HistoricalDataDto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ChartMapperTest {

    private final ChartMapper mapper = new ChartMapper();

    // -------- calculateMovingAverage --------

    @Test
    void movingAverage_nullInput_returnsNull() {
        assertNull(mapper.calculateMovingAverage(null, 20));
    }

    @Test
    void movingAverage_emptyInput_returnsEmpty() {
        List<HistoricalDataDto> empty = new ArrayList<>();
        assertTrue(mapper.calculateMovingAverage(empty, 20).isEmpty());
    }

    @Test
    void movingAverage_5DayPeriod_firstFourDontHaveMA() {
        List<HistoricalDataDto> data = buildSeries(100, 102, 104, 106, 108, 110, 112);
        mapper.calculateMovingAverage(data, 5);

        // İlk 4 nokta MA hesaplanmaz (5'inci güne kadar yeterli veri yok)
        assertNull(data.get(0).getMovingAverage());
        assertNull(data.get(3).getMovingAverage());
        // 5'inci günden itibaren MA dolu olmalı
        assertEquals(new BigDecimal("104.0000"), data.get(4).getMovingAverage()); // (100+102+104+106+108)/5
        assertEquals(new BigDecimal("106.0000"), data.get(5).getMovingAverage()); // (102+104+106+108+110)/5
        assertEquals(new BigDecimal("108.0000"), data.get(6).getMovingAverage()); // (104+106+108+110+112)/5
    }

    @Test
    void movingAverage_period1_everyDayHasMAEqualToClose() {
        List<HistoricalDataDto> data = buildSeries(50, 60, 70);
        mapper.calculateMovingAverage(data, 1);

        // MA(1) = kendi close değeri
        assertEquals(new BigDecimal("50.0000"), data.get(0).getMovingAverage());
        assertEquals(new BigDecimal("60.0000"), data.get(1).getMovingAverage());
        assertEquals(new BigDecimal("70.0000"), data.get(2).getMovingAverage());
    }

    // -------- convertCurrencyChart --------

    @Test
    void convertCurrency_nullChart_returnsNull() {
        assertNull(mapper.convertCurrencyChart(null, new BigDecimal("32.5")));
    }

    @Test
    void convertCurrency_emptyChart_returnsEmpty() {
        assertTrue(mapper.convertCurrencyChart(new ArrayList<>(), new BigDecimal("32.5")).isEmpty());
    }

    @Test
    void convertCurrency_zeroOrNegativeMultiplier_returnsUnchanged() {
        List<HistoricalDataDto> chart = buildOHLC(100, 105, 99, 102);
        List<HistoricalDataDto> result = mapper.convertCurrencyChart(chart, BigDecimal.ZERO);
        // 0 multiplier'da değişmez (compareTo: scale-insensitive eşitlik)
        assertEquals(0, BigDecimal.valueOf(100).compareTo(result.get(0).getOpen()));

        result = mapper.convertCurrencyChart(chart, new BigDecimal("-1"));
        assertEquals(0, BigDecimal.valueOf(100).compareTo(result.get(0).getOpen()));
    }

    @Test
    void convertCurrency_multipliesAllOHLCFields() {
        List<HistoricalDataDto> chart = buildOHLC(100, 110, 95, 105);
        BigDecimal multiplier = new BigDecimal("32.5");

        mapper.convertCurrencyChart(chart, multiplier);

        HistoricalDataDto bar = chart.get(0);
        assertEquals(new BigDecimal("3250.0000"), bar.getOpen());  // 100 × 32.5
        assertEquals(new BigDecimal("3575.0000"), bar.getHigh());  // 110 × 32.5
        assertEquals(new BigDecimal("3087.5000"), bar.getLow());   // 95 × 32.5
        assertEquals(new BigDecimal("3412.5000"), bar.getClose()); // 105 × 32.5
        // price = close olarak set edilir
        assertEquals(bar.getClose(), bar.getPrice());
    }

    // -------- calculateCurrencyMultiplier --------

    @Test
    void multiplier_eurAndUsdPresent_returnsCrossRate() {
        List<CurrencyRateDto> rates = List.of(
                rate("EUR", "35.00"),
                rate("USD", "33.00")
        );
        // EUR multiplier = EUR/USD = 35/33 ≈ 1.060606
        BigDecimal result = mapper.calculateCurrencyMultiplier("EUR", rates);
        assertEquals(0, new BigDecimal("1.060606").compareTo(result));
    }

    @Test
    void multiplier_symbolMissing_returnsOne() {
        List<CurrencyRateDto> rates = List.of(rate("USD", "33.00"));
        assertEquals(BigDecimal.ONE, mapper.calculateCurrencyMultiplier("GBP", rates));
    }

    @Test
    void multiplier_usdMissing_returnsOne() {
        List<CurrencyRateDto> rates = List.of(rate("EUR", "35.00"));
        assertEquals(BigDecimal.ONE, mapper.calculateCurrencyMultiplier("EUR", rates));
    }

    @Test
    void multiplier_usdZero_returnsOne() {
        List<CurrencyRateDto> rates = List.of(
                rate("EUR", "35.00"),
                rate("USD", "0")
        );
        // 0'a bölme — fallback ONE
        assertEquals(BigDecimal.ONE, mapper.calculateCurrencyMultiplier("EUR", rates));
    }

    @Test
    void multiplier_caseInsensitiveMatch() {
        List<CurrencyRateDto> rates = List.of(
                rate("eur", "35.00"),
                rate("usd", "33.00")
        );
        BigDecimal result = mapper.calculateCurrencyMultiplier("EUR", rates);
        assertEquals(0, new BigDecimal("1.060606").compareTo(result));
    }

    // -------- transformChartForCurrency (integration) --------

    @Test
    void transformChartForCurrency_endToEnd_appliesCrossRate() {
        List<HistoricalDataDto> chart = buildOHLC(100, 110, 95, 105);
        List<CurrencyRateDto> rates = List.of(
                rate("EUR", "35.00"),
                rate("USD", "33.00")
        );

        mapper.transformChartForCurrency(chart, "EUR", rates);

        // Multiplier ≈ 1.060606; close 105 × 1.060606 ≈ 111.36
        assertTrue(chart.get(0).getClose().compareTo(new BigDecimal("111.30")) > 0);
        assertTrue(chart.get(0).getClose().compareTo(new BigDecimal("111.40")) < 0);
    }

    // -------- helpers --------

    private List<HistoricalDataDto> buildSeries(double... closes) {
        List<HistoricalDataDto> list = new ArrayList<>();
        for (double c : closes) {
            HistoricalDataDto dto = new HistoricalDataDto();
            dto.setClose(BigDecimal.valueOf(c));
            list.add(dto);
        }
        return list;
    }

    private List<HistoricalDataDto> buildOHLC(double open, double high, double low, double close) {
        List<HistoricalDataDto> list = new ArrayList<>();
        HistoricalDataDto dto = new HistoricalDataDto();
        dto.setOpen(BigDecimal.valueOf(open));
        dto.setHigh(BigDecimal.valueOf(high));
        dto.setLow(BigDecimal.valueOf(low));
        dto.setClose(BigDecimal.valueOf(close));
        list.add(dto);
        return list;
    }

    private CurrencyRateDto rate(String code, String selling) {
        CurrencyRateDto r = new CurrencyRateDto();
        r.setCurrencyCode(code);
        r.setForexSelling(new BigDecimal(selling));
        return r;
    }
}
