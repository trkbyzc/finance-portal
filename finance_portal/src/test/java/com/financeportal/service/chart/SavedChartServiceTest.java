package com.financeportal.service.chart;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.chart.SavedChartDto;
import com.financeportal.model.dto.chart.SavedChartRequest;
import com.financeportal.model.entity.SavedChart;
import com.financeportal.model.entity.User;
import com.financeportal.repository.SavedChartRepository;
import com.financeportal.repository.UserRepository;
import com.financeportal.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SavedChartServiceTest {

    @Mock private SavedChartRepository repo;
    @Mock private UserRepository userRepo;
    @Mock private SecurityUtils securityUtils;

    @InjectMocks private SavedChartService service;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
    }

    private SavedChart chartOf(String name) {
        SavedChart c = new SavedChart();
        c.setId(UUID.randomUUID());
        c.setUser(user);
        c.setSymbol("AAPL");
        c.setAssetCategory("STOCK");
        c.setName(name);
        c.setPayload("{}");
        c.setCreatedAt(LocalDateTime.now());
        c.setUpdatedAt(LocalDateTime.now());
        return c;
    }

    @Test
    void listMyCharts_omitsPayload() {
        when(repo.findByUser_IdOrderByCreatedAtDesc(userId)).thenReturn(List.of(chartOf("A"), chartOf("B")));

        List<SavedChartDto> dtos = service.listMyCharts();

        assertEquals(2, dtos.size());
        assertNull(dtos.get(0).payload());
    }

    @Test
    void getMyChart_returnsWithPayload() {
        SavedChart c = chartOf("X");
        when(repo.findById(c.getId())).thenReturn(Optional.of(c));

        SavedChartDto dto = service.getMyChart(c.getId());

        assertEquals("X", dto.name());
        assertEquals("{}", dto.payload());
    }

    @Test
    void getMyChart_notFound_throws() {
        UUID id = UUID.randomUUID();
        when(repo.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.getMyChart(id));
    }

    @Test
    void getMyChart_notOwned_throws() {
        SavedChart c = chartOf("X");
        User other = new User();
        other.setId(UUID.randomUUID());
        c.setUser(other);
        when(repo.findById(c.getId())).thenReturn(Optional.of(c));
        assertThrows(ResourceNotFoundException.class, () -> service.getMyChart(c.getId()));
    }

    @Test
    void getMyChart_nullOwner_throws() {
        SavedChart c = chartOf("X");
        c.setUser(null);
        when(repo.findById(c.getId())).thenReturn(Optional.of(c));
        assertThrows(ResourceNotFoundException.class, () -> service.getMyChart(c.getId()));
    }

    @Test
    void createChart_userNotFound_throws() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        SavedChartRequest req = new SavedChartRequest();
        req.setSymbol("AAPL");
        assertThrows(ResourceNotFoundException.class, () -> service.createChart(req));
    }

    @Test
    void createChart_withAllFields_persistsAndReturnsDto() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(repo.save(any(SavedChart.class))).thenAnswer(inv -> inv.getArgument(0));

        SavedChartRequest req = new SavedChartRequest();
        req.setSymbol("AAPL"); req.setAssetCategory("STOCK"); req.setName("MyChart"); req.setPayload("{x:1}");

        SavedChartDto dto = service.createChart(req);
        assertEquals("AAPL", dto.symbol());
        assertEquals("STOCK", dto.assetCategory());
        assertEquals("MyChart", dto.name());
        assertEquals("{x:1}", dto.payload());
    }

    @Test
    void createChart_nameBlank_fallsBackToSymbol() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(repo.save(any(SavedChart.class))).thenAnswer(inv -> inv.getArgument(0));

        SavedChartRequest req = new SavedChartRequest();
        req.setSymbol("BTC"); req.setName("   ");

        SavedChartDto dto = service.createChart(req);
        assertEquals("BTC", dto.name());
    }

    @Test
    void createChart_symbolNullOrBlank_usesGrafikDefault() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(repo.save(any(SavedChart.class))).thenAnswer(inv -> inv.getArgument(0));

        SavedChartRequest req = new SavedChartRequest();
        // symbol null, name also null
        SavedChartDto dto = service.createChart(req);
        assertEquals("Grafik", dto.symbol());
        assertEquals("Grafik", dto.name());
    }

    @Test
    void updateChart_updatesProvidedFields() {
        SavedChart c = chartOf("Old");
        when(repo.findById(c.getId())).thenReturn(Optional.of(c));
        when(repo.save(any(SavedChart.class))).thenAnswer(inv -> inv.getArgument(0));

        SavedChartRequest req = new SavedChartRequest();
        req.setName("NewName"); req.setPayload("xx"); req.setAssetCategory("CRYPTO");

        SavedChartDto dto = service.updateChart(c.getId(), req);
        assertEquals("NewName", dto.name());
        assertEquals("xx", dto.payload());
        assertEquals("CRYPTO", dto.assetCategory());
    }

    @Test
    void updateChart_nullFields_preservesOriginals() {
        SavedChart c = chartOf("Old");
        when(repo.findById(c.getId())).thenReturn(Optional.of(c));
        when(repo.save(any(SavedChart.class))).thenAnswer(inv -> inv.getArgument(0));

        SavedChartRequest req = new SavedChartRequest();

        SavedChartDto dto = service.updateChart(c.getId(), req);
        assertEquals("Old", dto.name());
        assertEquals("{}", dto.payload());
        assertEquals("STOCK", dto.assetCategory());
    }

    @Test
    void updateChart_blankName_preserved() {
        SavedChart c = chartOf("Old");
        when(repo.findById(c.getId())).thenReturn(Optional.of(c));
        when(repo.save(any(SavedChart.class))).thenAnswer(inv -> inv.getArgument(0));

        SavedChartRequest req = new SavedChartRequest();
        req.setName("   ");

        SavedChartDto dto = service.updateChart(c.getId(), req);
        assertEquals("Old", dto.name());
    }

    @Test
    void deleteChart_callsRepoDelete() {
        SavedChart c = chartOf("X");
        when(repo.findById(c.getId())).thenReturn(Optional.of(c));

        service.deleteChart(c.getId());

        verify(repo).delete(c);
    }
}
