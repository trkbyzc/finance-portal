package com.financeportal.controller.finance;

import com.financeportal.model.dto.simulation.SimulationCreateRequestDto;
import com.financeportal.model.dto.simulation.SimulationDto;
import com.financeportal.model.dto.simulation.SimulationResultDto;
import com.financeportal.service.portfolio.SimulationService;
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
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
@Tag(name = "Simülasyon", description = "Kullanıcıya özel 'şu tarihte şu varlığı X TL ile alsaydım' senaryoları.")
public class SimulationController {

    private final SimulationService simulationService;

    @GetMapping("/me")
    @Operation(summary = "Kayıtlı simülasyonlarım",
            description = "Giriş yapmış kullanıcının kaydettiği tüm senaryoları her biri için anlık hesaplanmış sonuçla birlikte döner.")
    public ResponseEntity<List<SimulationDto>> getMyList() {
        return ResponseEntity.ok(simulationService.getMyList());
    }

    @PostMapping("/preview")
    @Operation(summary = "Önizle (stateless)",
            description = "Senaryoyu DB'ye kaydetmeden anlık hesabını döner — kullanıcı 'Kaydet' demeden sonucu görmek istediğinde.")
    public ResponseEntity<SimulationResultDto> preview(@RequestBody SimulationCreateRequestDto request) {
        return ResponseEntity.ok(simulationService.preview(request));
    }

    @PostMapping
    @Operation(summary = "Yeni simülasyon kaydet",
            description = "Senaryoyu kullanıcının listesine ekler ve anlık hesaplanmış sonucuyla birlikte döner.")
    public ResponseEntity<SimulationDto> save(@RequestBody SimulationCreateRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(simulationService.save(request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Simülasyon sil",
            description = "Belirtilen senaryoyu kaldırır. Sadece sahibi silebilir; başka kullanıcının kaydı 404 döner.")
    public ResponseEntity<Map<String, String>> delete(@PathVariable UUID id) {
        simulationService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Simülasyon silindi."));
    }
}
