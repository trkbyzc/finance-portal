package com.financeportal.service.chat.tools;

import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.service.portfolio.PortfolioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

class GetMyPortfolioToolTest {

    private PortfolioService portfolioService;
    private GetMyPortfolioTool tool;

    @BeforeEach
    void setUp() {
        portfolioService = mock(PortfolioService.class);
        tool = new GetMyPortfolioTool(portfolioService);
    }

    private PortfolioItemDto sample(String symbol, String quantity, String avg, String current) {
        return new PortfolioItemDto(symbol, "STOCK",
                new BigDecimal(quantity), new BigDecimal(avg), BigDecimal.ONE,
                new BigDecimal(quantity).multiply(new BigDecimal(avg)),
                new BigDecimal(current),
                new BigDecimal(quantity).multiply(new BigDecimal(current)),
                BigDecimal.ZERO, BigDecimal.ZERO);
    }

    @Test
    void portfoy_listesi_count_ve_holdings_dondurur() {
        when(portfolioService.getMyPortfolio(isNull())).thenReturn(List.of(
                sample("THYAO", "100", "150", "200"),
                sample("AAPL", "10", "180", "220")
        ));

        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.myPortfolio();

        assertEquals(2, out.get("count"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> holdings = (List<Map<String, Object>>) out.get("holdings");
        assertEquals("THYAO", holdings.get(0).get("symbol"));
        assertEquals("AAPL", holdings.get(1).get("symbol"));
        assertNotNull(holdings.get(0).get("currentPrice"));
        assertNotNull(holdings.get(0).get("profitLoss"));
    }

    @Test
    void bos_portfoy_count_0() {
        when(portfolioService.getMyPortfolio(isNull())).thenReturn(List.of());
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.myPortfolio();
        assertEquals(0, out.get("count"));
        @SuppressWarnings("unchecked")
        List<?> holdings = (List<?>) out.get("holdings");
        assertTrue(holdings.isEmpty());
    }

    @Test
    void default_portfoy_icin_null_ile_cagriliyor() {
        when(portfolioService.getMyPortfolio(isNull())).thenReturn(List.of());
        tool.myPortfolio();
        verify(portfolioService).getMyPortfolio(isNull());
    }
}
