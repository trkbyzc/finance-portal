package com.financeportal.service.chat.tools;

import com.financeportal.model.dto.alarm.PriceAlarmDto;
import com.financeportal.model.enums.AlarmCondition;
import com.financeportal.model.enums.AlarmFrequency;
import com.financeportal.model.enums.AssetType;
import com.financeportal.service.alarm.PriceAlarmService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GetMyAlarmsToolTest {

    private PriceAlarmService alarmService;
    private GetMyAlarmsTool tool;

    @BeforeEach
    void setUp() {
        alarmService = mock(PriceAlarmService.class);
        tool = new GetMyAlarmsTool(alarmService);
    }

    private PriceAlarmDto sample(String symbol, AlarmCondition cond, String threshold, boolean active) {
        return PriceAlarmDto.builder()
                .id(UUID.randomUUID())
                .symbol(symbol)
                .assetType(AssetType.STOCK)
                .condition(cond)
                .threshold(new BigDecimal(threshold))
                .frequency(AlarmFrequency.ONCE)
                .active(active)
                .createdAt(LocalDateTime.now())
                .triggerCount(0)
                .build();
    }

    @Test
    void name_ve_schema_dogru() {
        assertEquals("get_my_alarms", tool.name());
        assertNotNull(tool.description());
    }

    @Test
    void alarm_listesi_simplify_olur() {
        when(alarmService.listMyAlarms()).thenReturn(List.of(
                sample("BTC", AlarmCondition.ABOVE, "70000", true),
                sample("THYAO", AlarmCondition.BELOW, "100", false)
        ));

        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.execute(Map.of());

        assertEquals(2, out.get("count"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> alarms = (List<Map<String, Object>>) out.get("alarms");
        assertEquals("BTC", alarms.get(0).get("symbol"));
        assertEquals(AlarmCondition.ABOVE, alarms.get(0).get("condition"));
        assertEquals(true, alarms.get(0).get("active"));
        assertEquals(false, alarms.get(1).get("active"));
    }

    @Test
    void bos_alarm_listesi_count_0() {
        when(alarmService.listMyAlarms()).thenReturn(List.of());
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.execute(Map.of());
        assertEquals(0, out.get("count"));
    }
}
