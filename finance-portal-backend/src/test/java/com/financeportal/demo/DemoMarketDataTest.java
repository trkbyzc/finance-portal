package com.financeportal.demo;

import com.financeportal.domains.fund.dto.FundDto;
import com.financeportal.domains.stock.dto.StockDto;
import com.financeportal.domains.viop.dto.ViopDto;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DemoMarketDataTest {

    private DemoMarketData demo;

    @BeforeEach
    void setUp() {
        demo = new DemoMarketData();
    }

    @Test
    @DisplayName("BİST listesi dolu gelir ve her satır tam — arayüzde boş hücre olmasın")
    void turkishStocksAreComplete() {
        List<StockDto> stocks = demo.turkishStocks();

        assertThat(stocks).hasSizeGreaterThanOrEqualTo(25);
        assertThat(stocks).allSatisfy(s -> {
            assertThat(s.getSymbol()).endsWith(".IS");
            assertThat(s.getName()).isNotBlank();
            assertThat(s.getPrice()).isNotNull().isGreaterThan(BigDecimal.ZERO);
            assertThat(s.getChangePercent()).isNotNull();
            assertThat(s.getVolume()).isNotNull().isPositive();
        });
        assertThat(stocks).anySatisfy(s -> assertThat(s.isInBist30()).isTrue());
    }

    @Test
    @DisplayName("Aynı gün içinde deterministik — her yenilemede fiyat zıplamaz")
    void outputIsDeterministicWithinTheSameDay() {
        List<StockDto> first = demo.turkishStocks();
        List<StockDto> second = new DemoMarketData().turkishStocks();

        assertThat(first).hasSameSizeAs(second);
        for (int i = 0; i < first.size(); i++) {
            assertThat(first.get(i).getPrice()).isEqualByComparingTo(second.get(i).getPrice());
            assertThat(first.get(i).getChangePercent())
                    .isEqualByComparingTo(second.get(i).getChangePercent());
        }
    }

    @Test
    @DisplayName("Günlük değişim makul aralıkta (±%4) — grafik saçmalamasın")
    void dailyChangeStaysRealistic() {
        assertThat(demo.turkishStocks()).allSatisfy(s ->
                assertThat(s.getChangePercent().doubleValue()).isBetween(-4.0, 4.0));
    }

    @Test
    @DisplayName("Bilinmeyen sembolde de kotasyon üretir — liste yarım kalmasın")
    void quotesHandleUnknownSymbols() {
        List<MarketAssetDto> quotes = demo.quotes(new String[]{"AAPL", "BILINMEYEN123"}, "HİSSE");

        assertThat(quotes).hasSize(2);
        assertThat(quotes).allSatisfy(q -> {
            assertThat(q.getPrice()).isGreaterThan(BigDecimal.ZERO);
            assertThat(q.getName()).isNotBlank();
        });
        assertThat(quotes.get(0).getName()).isEqualTo("Apple Inc.");
    }

    @Test
    @DisplayName("null / boş sembol girdileri atlanır, patlamaz")
    void quotesIgnoreBlankSymbols() {
        assertThat(demo.quotes(new String[]{null, "  ", "AAPL"}, "HİSSE")).hasSize(1);
        assertThat(demo.quotes(null, "HİSSE")).isEmpty();
    }

    @Test
    @DisplayName("Grafik geçmişi istenen uzunlukta ve son bar güncel fiyata yakın")
    void historyEndsNearCurrentPrice() {
        List<HistoricalDataDto> bars = demo.history("THYAO.IS", "1mo");
        assertThat(bars).hasSize(30);

        BigDecimal current = demo.turkishStocks().stream()
                .filter(s -> s.getSymbol().equals("THYAO.IS"))
                .findFirst().orElseThrow().getPrice();

        double last = bars.get(bars.size() - 1).getClose().doubleValue();
        // Liste ile grafik tutarlı olmalı; son kapanış anlık fiyata eşit.
        assertThat(last).isCloseTo(current.doubleValue(), org.assertj.core.data.Offset.offset(0.01));
    }

    @Test
    @DisplayName("Aralık parametresi bar sayısını belirler, tanınmayan değer 3 aya düşer")
    void historyRangeMapping() {
        assertThat(demo.history("AAPL", "1y")).hasSize(365);
        assertThat(demo.history("AAPL", "6mo")).hasSize(180);
        assertThat(demo.history("AAPL", "sacma-deger")).hasSize(90);
    }

    @Test
    @DisplayName("OHLC tutarlı: high >= max(open,close), low <= min(open,close)")
    void ohlcBarsAreConsistent() {
        assertThat(demo.history("GARAN.IS", "1mo")).allSatisfy(b -> {
            double hi = b.getHigh().doubleValue();
            double lo = b.getLow().doubleValue();
            double op = b.getOpen().doubleValue();
            double cl = b.getClose().doubleValue();
            assertThat(hi).isGreaterThanOrEqualTo(Math.max(op, cl));
            assertThat(lo).isLessThanOrEqualTo(Math.min(op, cl));
        });
    }

    @Test
    @DisplayName("Fon ve VİOP listeleri de eksiksiz üretilir")
    void fundsAndViopArePopulated() {
        List<FundDto> funds = demo.turkishFunds();
        assertThat(funds).isNotEmpty().allSatisfy(f ->
                assertThat(f.getPrice()).isGreaterThan(BigDecimal.ZERO));

        List<ViopDto> viop = demo.viopContracts();
        assertThat(viop).isNotEmpty().allSatisfy(v -> {
            assertThat(v.getSymbol()).contains("Vadeli");
            assertThat(v.getContractSize()).isEqualByComparingTo(BigDecimal.valueOf(100));
        });
    }
}
