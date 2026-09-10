package com.financeportal.service.chat.tools;

import com.financeportal.model.dto.alarm.PriceAlarmDto;
import com.financeportal.service.alarm.PriceAlarmService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetMyAlarmsTool implements ChatToolBean {

    private final PriceAlarmService alarmService;

    @Tool(name = "get_my_alarms", description = "Kullanıcının fiyat alarmlarını döner (sembol, eşik, koşul, frekans, aktif mi). "
                + "'Alarmlarım', 'aktif alarmım var mı', 'X için alarm kurdum mu' gibi sorularda kullan.")
    public Object myAlarms() {
        List<PriceAlarmDto> alarms = alarmService.listMyAlarms();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("count", alarms.size());
        out.put("alarms", alarms.stream().map(this::simplify).toList());
        return out;
    }

    private Map<String, Object> simplify(PriceAlarmDto a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("symbol", a.getSymbol());
        m.put("assetType", a.getAssetType());
        m.put("condition", a.getCondition()); // ABOVE / BELOW
        m.put("threshold", a.getThreshold());
        m.put("frequency", a.getFrequency()); // ONCE / CONTINUOUS
        m.put("active", a.isActive());
        m.put("triggerCount", a.getTriggerCount());
        m.put("lastTriggeredAt", a.getLastTriggeredAt());
        return m;
    }
}
