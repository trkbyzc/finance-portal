package com.financeportal.service.chart;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.chart.SavedChartDto;
import com.financeportal.model.dto.chart.SavedChartRequest;
import com.financeportal.model.entity.SavedChart;
import com.financeportal.model.entity.User;
import com.financeportal.repository.SavedChartRepository;
import com.financeportal.repository.UserRepository;
import com.financeportal.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Kullanıcının kaydettiği grafiklerin (çizim araçları + ayarlar) CRUD yönetimi.
 * Tüm işlemler giriş yapan kullanıcıya kapsanır; başkasının grafiğine erişim 404 döner.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SavedChartService {

    private final SavedChartRepository savedChartRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    /** Liste — payload taşımaz (hafif). */
    @Transactional(readOnly = true)
    public List<SavedChartDto> listMyCharts() {
        UUID userId = securityUtils.getCurrentUserId();
        return savedChartRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(c -> toDto(c, false))
                .toList();
    }

    /** Tek grafik — payload dahil (açıp çizimleri geri yüklemek için). */
    @Transactional(readOnly = true)
    public SavedChartDto getMyChart(UUID id) {
        return toDto(requireOwned(id), true);
    }

    @Transactional
    public SavedChartDto createChart(SavedChartRequest request) {
        UUID userId = securityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        SavedChart chart = new SavedChart();
        chart.setId(UUID.randomUUID());
        chart.setUser(user);
        chart.setSymbol(safe(request.getSymbol()));
        chart.setAssetCategory(request.getAssetCategory());
        chart.setName(resolveName(request));
        chart.setPayload(request.getPayload());
        chart.setCreatedAt(LocalDateTime.now());
        chart.setUpdatedAt(LocalDateTime.now());
        return toDto(savedChartRepository.save(chart), true);
    }

    @Transactional
    public SavedChartDto updateChart(UUID id, SavedChartRequest request) {
        SavedChart chart = requireOwned(id);
        if (request.getName() != null && !request.getName().isBlank()) chart.setName(request.getName().trim());
        if (request.getPayload() != null) chart.setPayload(request.getPayload());
        if (request.getAssetCategory() != null) chart.setAssetCategory(request.getAssetCategory());
        chart.setUpdatedAt(LocalDateTime.now());
        return toDto(savedChartRepository.save(chart), true);
    }

    @Transactional
    public void deleteChart(UUID id) {
        savedChartRepository.delete(requireOwned(id));
    }

    private SavedChart requireOwned(UUID id) {
        UUID userId = securityUtils.getCurrentUserId();
        SavedChart chart = savedChartRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grafik bulunamadı"));
        if (chart.getUser() == null || !userId.equals(chart.getUser().getId())) {
            throw new ResourceNotFoundException("Grafik bulunamadı");
        }
        return chart;
    }

    private String resolveName(SavedChartRequest request) {
        if (request.getName() != null && !request.getName().isBlank()) return request.getName().trim();
        return safe(request.getSymbol());
    }

    private String safe(String s) {
        return (s == null || s.isBlank()) ? "Grafik" : s.trim();
    }

    private SavedChartDto toDto(SavedChart c, boolean includePayload) {
        return new SavedChartDto(
                c.getId(), c.getSymbol(), c.getAssetCategory(), c.getName(),
                includePayload ? c.getPayload() : null, c.getCreatedAt(), c.getUpdatedAt()
        );
    }
}
