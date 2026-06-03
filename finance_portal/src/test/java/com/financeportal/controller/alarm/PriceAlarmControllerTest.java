package com.financeportal.controller.alarm;

import com.financeportal.model.dto.alarm.CreatePriceAlarmRequest;
import com.financeportal.model.dto.alarm.PriceAlarmDto;
import com.financeportal.model.enums.AlarmCondition;
import com.financeportal.model.enums.AlarmFrequency;
import com.financeportal.model.enums.AssetType;
import com.financeportal.service.alarm.PriceAlarmService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PriceAlarmControllerTest {

    @Mock private PriceAlarmService service;

    @InjectMocks private PriceAlarmController controller;

    private PriceAlarmDto dto(UUID id) {
        return PriceAlarmDto.builder()
                .id(id != null ? id : UUID.randomUUID())
                .symbol("BTC")
                .assetType(AssetType.CRYPTO)
                .condition(AlarmCondition.ABOVE)
                .threshold(new BigDecimal("60000"))
                .frequency(AlarmFrequency.ONCE)
                .active(true)
                .build();
    }

    @Test
    void list_returnsService() {
        when(service.listMyAlarms()).thenReturn(List.of(dto(null)));
        ResponseEntity<List<PriceAlarmDto>> resp = controller.listMine();
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(1, resp.getBody().size());
    }

    @Test
    void create_returns201() {
        CreatePriceAlarmRequest req = new CreatePriceAlarmRequest();
        PriceAlarmDto created = dto(null);
        when(service.createAlarm(req)).thenReturn(created);

        ResponseEntity<PriceAlarmDto> resp = controller.create(req);

        assertEquals(HttpStatus.CREATED, resp.getStatusCode());
        assertSame(created, resp.getBody());
    }

    @Test
    void setActive_returnsUpdatedDto() {
        UUID id = UUID.randomUUID();
        PriceAlarmDto updated = dto(id);
        updated.setActive(false);
        when(service.setActive(id, false)).thenReturn(updated);

        ResponseEntity<PriceAlarmDto> resp = controller.setActive(id, false);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertFalse(resp.getBody().isActive());
    }

    @Test
    void delete_callsServiceAndReturnsMessage() {
        UUID id = UUID.randomUUID();
        ResponseEntity<Map<String, String>> resp = controller.delete(id);
        verify(service).deleteAlarm(id);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertTrue(resp.getBody().get("message").contains("silindi"));
    }
}
