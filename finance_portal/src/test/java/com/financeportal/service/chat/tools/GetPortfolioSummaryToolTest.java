package com.financeportal.service.chat.tools;

import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.service.portfolio.PortfolioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

class GetPortfolioSummaryToolTest {

    private PortfolioService portfolioService;
    private GetPortfolioSummaryTool tool;

    @BeforeEach
    void setUp() {
        portfolioService = mock(PortfolioService.class);
        tool = new GetPortfolioSummaryTool(portfolioService);
    }

    @Test
    void name_ve_schema_dogru() {
        assertEquals("get_portfolio_summary", tool.name());
        assertNotNull(tool.description());
    }

    @Test
    void ozet_alanlari_relay_ediyor() {
        PortfolioSummaryDto s = new PortfolioSummaryDto();
        s.setTotalAssetCost(new BigDecimal("10000"));
        s.setTotalAssetValue(new BigDecimal("12000"));
        s.setGrandTotal(new BigDecimal("12000"));
        s.setTotalProfitLoss(new BigDecimal("2000"));
        s.setTotalProfitLossPct(new BigDecimal("20"));
        s.setDistribution(java.util.List.of());

        when(portfolioService.getMyPortfolioSummary(isNull())).thenReturn(s);

        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.execute(Map.of());

        assertEquals(new BigDecimal("10000"), out.get("totalCost"));
        assertEquals(new BigDecimal("12000"), out.get("totalValue"));
        assertEquals(new BigDecimal("12000"), out.get("grandTotal"));
        assertEquals(new BigDecimal("2000"), out.get("totalProfitLoss"));
        assertEquals(new BigDecimal("20"), out.get("totalProfitLossPct"));
        assertNotNull(out.get("distribution"));
    }

    @Test
    void default_portfoy_null_ile_cagirir() {
        PortfolioSummaryDto s = new PortfolioSummaryDto();
        s.setTotalAssetCost(BigDecimal.ZERO);
        when(portfolioService.getMyPortfolioSummary(isNull())).thenReturn(s);
        tool.execute(Map.of());
        verify(portfolioService).getMyPortfolioSummary(isNull());
    }
}
