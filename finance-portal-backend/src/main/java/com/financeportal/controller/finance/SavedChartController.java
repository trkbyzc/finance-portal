package com.financeportal.controller.finance;

import com.financeportal.model.dto.chart.SavedChartDto;
import com.financeportal.model.dto.chart.SavedChartRequest;
import com.financeportal.service.chart.SavedChartService;
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
@RequestMapping("/charts")
@RequiredArgsConstructor
@Tag(name = "Kaydedilmiş Grafikler", description = "Kullanıcının çizim araçlarıyla kaydettiği grafikleri yönetir (Hesabım sayfası).")
public class SavedChartController {

    private final SavedChartService savedChartService;

    @GetMapping("/me")
    @Operation(summary = "Kaydedilmiş Grafiklerim", description = "Liste — payload taşımaz (hafif).")
    public ResponseEntity<List<SavedChartDto>> listMyCharts() {
        return ResponseEntity.ok(savedChartService.listMyCharts());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Grafiği Getir", description = "Çizimleri geri yüklemek için payload dahil tek grafik.")
    public ResponseEntity<SavedChartDto> getMyChart(@PathVariable UUID id) {
        return ResponseEntity.ok(savedChartService.getMyChart(id));
    }

    @PostMapping
    @Operation(summary = "Grafik Kaydet")
    public ResponseEntity<SavedChartDto> create(@RequestBody SavedChartRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(savedChartService.createChart(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Grafiği Güncelle")
    public ResponseEntity<SavedChartDto> update(@PathVariable UUID id, @RequestBody SavedChartRequest request) {
        return ResponseEntity.ok(savedChartService.updateChart(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Grafiği Sil")
    public ResponseEntity<Map<String, String>> delete(@PathVariable UUID id) {
        savedChartService.deleteChart(id);
        return ResponseEntity.ok(Map.of("message", "Grafik silindi."));
    }
}
