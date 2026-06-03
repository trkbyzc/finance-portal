package com.financeportal.controller.alarm;

import com.financeportal.model.dto.alarm.CreatePriceAlarmRequest;
import com.financeportal.model.dto.alarm.PriceAlarmDto;
import com.financeportal.service.alarm.PriceAlarmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/alarms")
@RequiredArgsConstructor
@Tag(name = "Fiyat Alarmları", description = "Kullanıcının fiyat alarmlarını kurma, listeleme ve silme")
public class PriceAlarmController {

    private final PriceAlarmService alarmService;

    @GetMapping
    @Operation(summary = "Alarmlarımı Listele")
    public ResponseEntity<List<PriceAlarmDto>> listMine() {
        return ResponseEntity.ok(alarmService.listMyAlarms());
    }

    @PostMapping
    @Operation(summary = "Yeni Fiyat Alarmı Oluştur")
    public ResponseEntity<PriceAlarmDto> create(@RequestBody CreatePriceAlarmRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alarmService.createAlarm(req));
    }

    @PutMapping("/{id}/active")
    @Operation(summary = "Alarm Aç/Kapat")
    public ResponseEntity<PriceAlarmDto> setActive(@PathVariable UUID id, @RequestParam boolean active) {
        return ResponseEntity.ok(alarmService.setActive(id, active));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Alarmı Sil")
    public ResponseEntity<Map<String, String>> delete(@PathVariable UUID id) {
        alarmService.deleteAlarm(id);
        return ResponseEntity.ok(Map.of("message", "Alarm silindi."));
    }
}
