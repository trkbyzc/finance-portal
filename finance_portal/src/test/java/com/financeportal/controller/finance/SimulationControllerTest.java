package com.financeportal.controller.finance;

import com.financeportal.model.dto.common.MessageResponseDto;
import com.financeportal.model.dto.simulation.EarliestDateResponseDto;
import com.financeportal.model.dto.simulation.SimulationCreateRequestDto;
import com.financeportal.model.dto.simulation.SimulationDto;
import com.financeportal.model.dto.simulation.SimulationResultDto;
import com.financeportal.model.enums.AssetType;
import com.financeportal.service.portfolio.SimulationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SimulationControllerTest {

    @Mock private SimulationService service;

    @InjectMocks private SimulationController controller;

    @Test
    void getMyList_returns200() {
        when(service.getMyList()).thenReturn(List.of(new SimulationDto()));
        ResponseEntity<List<SimulationDto>> resp = controller.getMyList();
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(1, resp.getBody().size());
    }

    @Test
    void preview_returnsResult() {
        SimulationCreateRequestDto req = new SimulationCreateRequestDto();
        SimulationResultDto result = new SimulationResultDto();
        when(service.preview(req)).thenReturn(result);
        ResponseEntity<SimulationResultDto> resp = controller.preview(req);
        assertSame(result, resp.getBody());
    }

    @Test
    void save_returns201() {
        SimulationCreateRequestDto req = new SimulationCreateRequestDto();
        SimulationDto saved = new SimulationDto();
        when(service.save(req)).thenReturn(saved);

        ResponseEntity<SimulationDto> resp = controller.save(req);

        assertEquals(HttpStatus.CREATED, resp.getStatusCode());
        assertSame(saved, resp.getBody());
    }

    @Test
    void delete_callsServiceAndReturnsMessage() {
        UUID id = UUID.randomUUID();
        ResponseEntity<MessageResponseDto> resp = controller.delete(id);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertTrue(resp.getBody().getMessage().contains("silindi"));
        verify(service).delete(id);
    }

    @Test
    void earliestDate_returnsBodyWithSymbol() {
        LocalDate date = LocalDate.of(2024, 1, 1);
        when(service.getEarliestAvailableDate("BTC", AssetType.CRYPTO)).thenReturn(date);

        ResponseEntity<EarliestDateResponseDto> resp = controller.earliestDate("BTC", AssetType.CRYPTO);

        assertEquals("BTC", resp.getBody().getSymbol());
        assertEquals(AssetType.CRYPTO, resp.getBody().getAssetType());
        assertEquals(date, resp.getBody().getEarliestDate());
    }
}
