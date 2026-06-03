package com.financeportal.controller.finance;

import com.financeportal.model.dto.portfolio.PortfolioDto;
import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.dto.portfolio.TransactionDto;
import com.financeportal.service.portfolio.PortfolioService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PortfolioControllerTest {

    @Mock private PortfolioService service;

    @InjectMocks private PortfolioController controller;

    @Test
    void listPortfolios_returnsServiceResult() {
        when(service.listPortfolios()).thenReturn(List.of(new PortfolioDto()));
        ResponseEntity<List<PortfolioDto>> resp = controller.listPortfolios();
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(1, resp.getBody().size());
    }

    @Test
    void createPortfolio_returns201() {
        PortfolioDto created = new PortfolioDto();
        when(service.createPortfolio("MyPortfolio")).thenReturn(created);

        ResponseEntity<PortfolioDto> resp = controller.createPortfolio(Map.of("name", "MyPortfolio"));

        assertEquals(HttpStatus.CREATED, resp.getStatusCode());
        assertSame(created, resp.getBody());
    }

    @Test
    void renamePortfolio_passesIdAndName() {
        UUID id = UUID.randomUUID();
        PortfolioDto renamed = new PortfolioDto();
        when(service.renamePortfolio(id, "NewName")).thenReturn(renamed);

        ResponseEntity<PortfolioDto> resp = controller.renamePortfolio(id, Map.of("name", "NewName"));

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertSame(renamed, resp.getBody());
    }

    @Test
    void deletePortfolio_callsService_returnsMessage() {
        UUID id = UUID.randomUUID();
        ResponseEntity<Map<String, String>> resp = controller.deletePortfolio(id);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertTrue(resp.getBody().get("message").contains("Portföy silindi"));
        verify(service).deletePortfolio(id);
    }

    @Test
    void getMyPortfolio_withPortfolioId_passedThrough() {
        UUID id = UUID.randomUUID();
        when(service.getMyPortfolio(id)).thenReturn(List.of(new PortfolioItemDto()));
        ResponseEntity<List<PortfolioItemDto>> resp = controller.getMyPortfolio(id);
        assertEquals(1, resp.getBody().size());
    }

    @Test
    void getMyPortfolio_nullPortfolioId_default() {
        when(service.getMyPortfolio(null)).thenReturn(List.of());
        ResponseEntity<List<PortfolioItemDto>> resp = controller.getMyPortfolio(null);
        assertTrue(resp.getBody().isEmpty());
    }

    @Test
    void getMyPortfolioSummary_delegates() {
        UUID id = UUID.randomUUID();
        PortfolioSummaryDto summary = new PortfolioSummaryDto();
        when(service.getMyPortfolioSummary(id)).thenReturn(summary);
        ResponseEntity<PortfolioSummaryDto> resp = controller.getMyPortfolioSummary(id);
        assertSame(summary, resp.getBody());
    }

    @Test
    void addManualEntry_returns201_withSymbolInMessage() {
        TradeRequestDto req = new TradeRequestDto();
        req.setSymbol("THYAO");
        ResponseEntity<Map<String, String>> resp = controller.addManualEntry(req);

        assertEquals(HttpStatus.CREATED, resp.getStatusCode());
        assertTrue(resp.getBody().get("message").contains("THYAO"));
        verify(service).addManualEntry(req);
    }

    @Test
    void updateManualEntry_returns200_withSymbolInMessage() {
        TradeRequestDto req = new TradeRequestDto();
        req.setSymbol("AKBNK");
        ResponseEntity<Map<String, String>> resp = controller.updateManualEntry(req);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertTrue(resp.getBody().get("message").contains("AKBNK"));
        verify(service).updateManualEntry(req);
    }

    @Test
    void removeFromPortfolio_returns200_withSymbolInMessage() {
        TradeRequestDto req = new TradeRequestDto();
        req.setSymbol("BTC");
        ResponseEntity<Map<String, String>> resp = controller.removeFromPortfolio(req);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertTrue(resp.getBody().get("message").contains("BTC"));
        verify(service).removeFromPortfolio(req);
    }

    @Test
    void getTransactions_passesAllParams() {
        LocalDate from = LocalDate.of(2024, 1, 1);
        LocalDate to = LocalDate.of(2024, 12, 31);
        Page<TransactionDto> page = new PageImpl<>(List.of(new TransactionDto()));
        when(service.getMyTransactions("THYAO", from, to, 0, 20)).thenReturn(page);

        ResponseEntity<Page<TransactionDto>> resp = controller.getTransactions("THYAO", from, to, 0, 20);

        assertEquals(1, resp.getBody().getTotalElements());
    }

    @Test
    void getTransactions_allNullFilters() {
        when(service.getMyTransactions(null, null, null, 0, 20)).thenReturn(Page.empty());
        ResponseEntity<Page<TransactionDto>> resp = controller.getTransactions(null, null, null, 0, 20);
        assertEquals(0, resp.getBody().getTotalElements());
    }
}
