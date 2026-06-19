package com.financeportal.service.portfolio;

import com.financeportal.domains.viop.config.ViopContractSpec;
import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.model.entity.PortfolioItem;
import com.financeportal.model.enums.AssetType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PortfolioAnalyticsServiceTest {

    @Mock
    private PortfolioPriceService priceService;

    @Mock
    private ViopContractSpec viopContractSpec;

    @InjectMocks
    private PortfolioAnalyticsService analytics;

    // -------- buildPortfolioItems --------

    @Test
    void buildItems_profitablePosition_calculatesPLAndPct() {
        PortfolioItem item = makeItem("BTC", AssetType.CRYPTO, "1", "50000");
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(new BigDecimal("60000"));

        List<PortfolioItemDto> result = analytics.buildPortfolioItems(List.of(item));

        assertEquals(1, result.size());
        PortfolioItemDto dto = result.get(0);
        assertEquals(new BigDecimal("50000"), dto.getTotalCost());
        assertEquals(new BigDecimal("60000"), dto.getCurrentValue());
        assertEquals(new BigDecimal("10000"), dto.getProfitLoss());
        // 10000 / 50000 = 0.2 * 100 = 20.00
        assertEquals(0, new BigDecimal("20.0000").multiply(new BigDecimal("100")).movePointLeft(2).compareTo(dto.getProfitLossPct()));
    }

    @Test
    void buildItems_lossPosition_negativePL() {
        PortfolioItem item = makeItem("AAPL", AssetType.STOCK, "10", "200");
        when(priceService.getCurrentPrice("AAPL", AssetType.STOCK)).thenReturn(new BigDecimal("150"));

        List<PortfolioItemDto> result = analytics.buildPortfolioItems(List.of(item));

        PortfolioItemDto dto = result.get(0);
        // 10 × (150-200) = -500
        assertEquals(0, new BigDecimal("-500").compareTo(dto.getProfitLoss()));
        // -500/2000 × 100 = -25%
        assertTrue(dto.getProfitLossPct().compareTo(BigDecimal.ZERO) < 0);
    }

    @Test
    void buildItems_zeroTotalCost_pctIsZero() {
        // Anomali edge case: quantity=0 (hayalet pozisyon)
        PortfolioItem item = makeItem("X", AssetType.STOCK, "0", "100");
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(new BigDecimal("100"));

        List<PortfolioItemDto> result = analytics.buildPortfolioItems(List.of(item));

        // Division by zero guard — pct sıfır kalır
        assertEquals(BigDecimal.ZERO, result.get(0).getProfitLossPct());
    }

    @Test
    void buildItems_emptyList_returnsEmpty() {
        assertTrue(analytics.buildPortfolioItems(List.of()).isEmpty());
    }

    @Test
    void buildItems_assetTypeNameInDto() {
        PortfolioItem item = makeItem("ETH", AssetType.CRYPTO, "1", "1000");
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(new BigDecimal("1100"));

        List<PortfolioItemDto> result = analytics.buildPortfolioItems(List.of(item));

        assertEquals("CRYPTO", result.get(0).getAssetType());
    }

    // -------- buildPortfolioSummary --------

    @Test
    void summary_singleItem_distributionIs100Percent() {
        PortfolioItem item = makeItem("BTC", AssetType.CRYPTO, "1", "50000");
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(new BigDecimal("60000"));

        PortfolioSummaryDto summary = analytics.buildPortfolioSummary(List.of(item));

        assertEquals(new BigDecimal("50000"), summary.getTotalAssetCost());
        assertEquals(new BigDecimal("60000"), summary.getTotalAssetValue());
        assertEquals(new BigDecimal("60000"), summary.getGrandTotal());
        assertEquals(new BigDecimal("10000"), summary.getTotalProfitLoss());
        // %100 distribution (tek asset)
        assertEquals(0, new BigDecimal("100.0000").compareTo(summary.getDistribution().get(0).getPercentage()));
    }

    @Test
    void summary_twoEqualItems_distributionIs50_50() {
        PortfolioItem btc = makeItem("BTC", AssetType.CRYPTO, "1", "50000");
        PortfolioItem eth = makeItem("ETH", AssetType.CRYPTO, "1", "3000");
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(new BigDecimal("50000"));
        when(priceService.getCurrentPrice("ETH", AssetType.CRYPTO)).thenReturn(new BigDecimal("50000"));

        PortfolioSummaryDto summary = analytics.buildPortfolioSummary(List.of(btc, eth));

        assertEquals(2, summary.getDistribution().size());
        assertEquals(0, new BigDecimal("50.0000").compareTo(summary.getDistribution().get(0).getPercentage()));
        assertEquals(0, new BigDecimal("50.0000").compareTo(summary.getDistribution().get(1).getPercentage()));
    }

    @Test
    void summary_emptyPortfolio_allZeros() {
        PortfolioSummaryDto summary = analytics.buildPortfolioSummary(List.of());

        assertEquals(BigDecimal.ZERO, summary.getTotalAssetCost());
        assertEquals(BigDecimal.ZERO, summary.getTotalAssetValue());
        assertEquals(BigDecimal.ZERO, summary.getTotalProfitLoss());
        assertEquals(BigDecimal.ZERO, summary.getTotalProfitLossPct());
        assertTrue(summary.getDistribution().isEmpty());
    }

    @Test
    void summary_lossPortfolio_negativeProfitLoss() {
        PortfolioItem item = makeItem("X", AssetType.STOCK, "10", "100");
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(new BigDecimal("80"));

        PortfolioSummaryDto summary = analytics.buildPortfolioSummary(List.of(item));

        // 10×80 - 10×100 = -200
        assertEquals(0, new BigDecimal("-200").compareTo(summary.getTotalProfitLoss()));
        assertTrue(summary.getTotalProfitLossPct().compareTo(BigDecimal.ZERO) < 0);
    }

    // -------- VİOP: teminat-bazlı değerleme (kaldıraç + yön) --------

    @Test
    void buildItems_viopLong_marginBasedValuationNotNotional() {
        // 2 sözleşme × giriş 100 × çarpan 100; fiyat 100→110; teminat oranı %10
        PortfolioItem item = makeViopItem("F_XU030", "2", "100", "100", "LONG");
        when(priceService.getCurrentPrice("F_XU030", AssetType.FUTURE)).thenReturn(new BigDecimal("110"));
        when(viopContractSpec.getSpec("F_XU030"))
                .thenReturn(new ViopContractSpec.ViopSpec(new BigDecimal("100"), new BigDecimal("0.10"), "TRY"));

        PortfolioItemDto dto = analytics.buildPortfolioItems(List.of(item)).get(0);

        // notional = 2×110×100 = 22.000 (piyasada kontrol edilen tutar — maliyet DEĞİL)
        assertEquals(0, new BigDecimal("22000").compareTo(dto.getNotional()));
        // maliyet = bağlanan teminat = 2×100×100×0.10 = 2.000
        assertEquals(0, new BigDecimal("2000").compareTo(dto.getMarginPosted()));
        assertEquals(0, new BigDecimal("2000").compareTo(dto.getTotalCost()));
        // pnl = 2×(110-100)×100 = +2.000 → portföye katkı = teminat + pnl = 4.000
        assertEquals(0, new BigDecimal("2000").compareTo(dto.getProfitLoss()));
        assertEquals(0, new BigDecimal("4000").compareTo(dto.getCurrentValue()));
        // getiri yüzdesi teminata göre (kaldıraçlı): 2000/2000 = %100
        assertEquals(0, new BigDecimal("100.0000").compareTo(dto.getProfitLossPct()));
        // kaldıraç = notional/teminat = 22000/2000 = 11x
        assertEquals(0, new BigDecimal("11.00").compareTo(dto.getLeverage()));
        assertEquals("LONG", dto.getDirection());
    }

    @Test
    void buildItems_viopShort_profitsWhenPriceFalls() {
        PortfolioItem item = makeViopItem("F_XU030", "1", "100", "100", "SHORT");
        when(priceService.getCurrentPrice("F_XU030", AssetType.FUTURE)).thenReturn(new BigDecimal("90"));
        when(viopContractSpec.getSpec("F_XU030"))
                .thenReturn(new ViopContractSpec.ViopSpec(new BigDecimal("100"), new BigDecimal("0.10"), "TRY"));

        PortfolioItemDto dto = analytics.buildPortfolioItems(List.of(item)).get(0);

        // SHORT, fiyat 100→90 (düşüş): pnl = 1×(90-100)×100×(-1) = +1.000 → short DÜŞÜŞTE kazanır
        assertTrue(dto.getProfitLoss().signum() > 0);
        assertEquals(0, new BigDecimal("1000").compareTo(dto.getProfitLoss()));
        assertEquals("SHORT", dto.getDirection());
    }

    @Test
    void buildItems_viopNullDirection_treatedAsLong() {
        // Bu özellikten önce eklenmiş VİOP pozisyonu (direction=null) → LONG sayılır (geriye uyumlu)
        PortfolioItem item = makeViopItem("F_XU030", "1", "100", "100", null);
        when(priceService.getCurrentPrice("F_XU030", AssetType.FUTURE)).thenReturn(new BigDecimal("110"));
        when(viopContractSpec.getSpec("F_XU030"))
                .thenReturn(new ViopContractSpec.ViopSpec(new BigDecimal("100"), new BigDecimal("0.10"), "TRY"));

        PortfolioItemDto dto = analytics.buildPortfolioItems(List.of(item)).get(0);

        assertEquals("LONG", dto.getDirection());
        assertTrue(dto.getProfitLoss().signum() > 0); // yükselişte LONG kazanır
    }

    // -------- helper --------

    private PortfolioItem makeItem(String symbol, AssetType type, String qty, String avgPrice) {
        PortfolioItem item = new PortfolioItem();
        item.setSymbol(symbol);
        item.setAssetType(type);
        item.setQuantity(new BigDecimal(qty));
        item.setAveragePrice(new BigDecimal(avgPrice));
        return item;
    }

    private PortfolioItem makeViopItem(String symbol, String qty, String avgPrice, String contractSize, String direction) {
        PortfolioItem item = makeItem(symbol, AssetType.FUTURE, qty, avgPrice);
        item.setContractSize(new BigDecimal(contractSize));
        item.setDirection(direction);
        return item;
    }
}
