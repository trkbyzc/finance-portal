package com.financeportal.service.portfolio;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.model.dto.simulation.SimulationCreateRequestDto;
import com.financeportal.model.dto.simulation.SimulationDto;
import com.financeportal.model.dto.simulation.SimulationResultDto;
import com.financeportal.model.entity.Simulation;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.AssetType;
import com.financeportal.repository.SimulationRepository;
import com.financeportal.repository.UserRepository;
import com.financeportal.security.SecurityUtils;
import com.financeportal.service.market.MarketChartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings({"unchecked", "rawtypes"})
class SimulationServiceTest {

    @Mock private SimulationRepository simRepo;
    @Mock private UserRepository userRepo;
    @Mock private SecurityUtils securityUtils;
    @Mock private MarketChartService chartService;

    @InjectMocks private SimulationService service;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
    }

    // -------- compute: input validation --------

    @Test
    void compute_nullSymbol_warningResult() {
        SimulationResultDto r = service.compute(null, AssetType.STOCK, LocalDate.now(), new BigDecimal("1000"));
        assertEquals("Geçersiz simülasyon girdisi.", r.getWarning());
    }

    @Test
    void compute_nullAssetType_warning() {
        SimulationResultDto r = service.compute("BTC", null, LocalDate.now(), new BigDecimal("1000"));
        assertEquals("Geçersiz simülasyon girdisi.", r.getWarning());
    }

    @Test
    void compute_nullDate_warning() {
        SimulationResultDto r = service.compute("BTC", AssetType.CRYPTO, null, new BigDecimal("1000"));
        assertEquals("Geçersiz simülasyon girdisi.", r.getWarning());
    }

    @Test
    void compute_zeroAmount_warning() {
        SimulationResultDto r = service.compute("BTC", AssetType.CRYPTO, LocalDate.now(), BigDecimal.ZERO);
        assertEquals("Geçersiz simülasyon girdisi.", r.getWarning());
    }

    @Test
    void compute_negativeAmount_warning() {
        SimulationResultDto r = service.compute("BTC", AssetType.CRYPTO, LocalDate.now(), new BigDecimal("-100"));
        assertEquals("Geçersiz simülasyon girdisi.", r.getWarning());
    }

    @Test
    void compute_historyEmpty_warning() {
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of());

        SimulationResultDto r = service.compute("BTC", AssetType.CRYPTO,
                LocalDate.now(), new BigDecimal("1000"));

        assertTrue(r.getWarning().contains("historical veri yok"));
    }

    @Test
    void compute_historyServiceThrows_warningEmptyData() {
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenThrow(new RuntimeException("Down"));

        SimulationResultDto r = service.compute("BTC", AssetType.CRYPTO,
                LocalDate.now(), new BigDecimal("1000"));

        assertTrue(r.getWarning().contains("historical veri yok"));
    }

    @Test
    void compute_investmentDateBeforeAllHistory_warning() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(yesterday, 100)));

        // Data starts at yesterday; investmentDate 5 years before that → no data point <= investmentDate
        SimulationResultDto r = service.compute("X", AssetType.STOCK,
                LocalDate.now().minusYears(5), new BigDecimal("1000"));

        assertTrue(r.getWarning().contains("historical aralığın dışında"));
    }

    @Test
    void compute_entryPriceZero_warning() {
        LocalDate today = LocalDate.now();
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(today, 0)));

        SimulationResultDto r = service.compute("X", AssetType.STOCK,
                today, new BigDecimal("1000"));

        assertTrue(r.getWarning().contains("Entry tarihindeki fiyat geçersiz"));
    }

    // -------- compute: happy path --------

    @Test
    void compute_validInputs_returnsPnLAndSeries() {
        LocalDate d1 = LocalDate.now().minusDays(2);
        LocalDate d2 = LocalDate.now().minusDays(1);
        LocalDate d3 = LocalDate.now();
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(d1, 100), bar(d2, 110), bar(d3, 120)));

        SimulationResultDto r = service.compute("X", AssetType.STOCK, d1, new BigDecimal("1000"));

        assertNull(r.getWarning());
        // 1000 / 100 = 10 units
        assertEquals(0, new BigDecimal("10.00000000").compareTo(r.getUnitsBought()));
        // Current value = 10 × 120 = 1200
        assertEquals(0, new BigDecimal("1200").compareTo(r.getCurrentValue()));
        // PnL = 200, 20%
        assertEquals(0, new BigDecimal("200").compareTo(r.getPnlTry()));
        assertEquals(0, new BigDecimal("20.00").compareTo(r.getPnlPct()));
        assertEquals(3, r.getSeries().size());
        assertEquals(d1, r.getEffectiveStartDate());
    }

    @Test
    void compute_investmentDateOnWeekend_usesPreviousAvailableDate() {
        LocalDate friday = LocalDate.now().minusDays(12);
        LocalDate weekendDate = LocalDate.now().minusDays(10);
        LocalDate today = LocalDate.now();
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(friday, 100), bar(today, 110)));

        SimulationResultDto r = service.compute("X", AssetType.STOCK, weekendDate, new BigDecimal("1000"));

        // Weekend → uses last available date before it (friday), matching preview behaviour
        assertEquals(friday, r.getEffectiveStartDate());
    }

    @Test
    void compute_supportsLinkedHashMapHistory() {
        LocalDate d1 = LocalDate.now().minusDays(1);
        LocalDate d2 = LocalDate.now();
        LinkedHashMap<String, Object> p1 = new LinkedHashMap<>();
        p1.put("date", d1.toString());
        p1.put("close", 100.0);
        LinkedHashMap<String, Object> p2 = new LinkedHashMap<>();
        p2.put("date", d2.toString());
        p2.put("close", "120");
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn((List) List.of(p1, p2));

        SimulationResultDto r = service.compute("X", AssetType.STOCK, d1, new BigDecimal("1000"));

        assertEquals(2, r.getSeries().size());
        assertEquals(0, new BigDecimal("1200").compareTo(r.getCurrentValue()));
    }

    @Test
    void compute_mapWithPriceFieldFallback() {
        LocalDate d = LocalDate.now();
        LinkedHashMap<String, Object> p = new LinkedHashMap<>();
        p.put("date", d.toString());
        p.put("price", 100.0); // close yok, price var
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn((List) List.of(p));

        SimulationResultDto r = service.compute("X", AssetType.STOCK, d, new BigDecimal("1000"));

        assertNull(r.getWarning());
    }

    @Test
    void compute_unsortedHistory_sortsAndComputes() {
        LocalDate d1 = LocalDate.now().minusDays(2);
        LocalDate d2 = LocalDate.now().minusDays(1);
        LocalDate d3 = LocalDate.now();
        // Reverse order
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(d3, 120), bar(d1, 100), bar(d2, 110)));

        SimulationResultDto r = service.compute("X", AssetType.STOCK, d1, new BigDecimal("1000"));

        // Sıralanıp doğru hesaplama
        assertEquals(d1, r.getEffectiveStartDate());
        assertEquals(0, new BigDecimal("1200").compareTo(r.getCurrentValue()));
    }

    @Test
    void compute_pointsWithNullCloseSkipped() {
        LocalDate d1 = LocalDate.now().minusDays(1);
        LocalDate d2 = LocalDate.now();
        HistoricalDataDto badPoint = new HistoricalDataDto();
        badPoint.setDate(d2);
        // close null

        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(d1, 100), badPoint));

        SimulationResultDto r = service.compute("X", AssetType.STOCK, d1, new BigDecimal("1000"));

        // 1 punto var (close=null atlandı)
        assertEquals(1, r.getSeries().size());
    }

    // -------- computeFromQuantity --------

    @Test
    void computeFromQuantity_nullQuantity_warning() {
        SimulationResultDto r = service.computeFromQuantity("X", AssetType.STOCK, LocalDate.now(), null);
        assertTrue(r.getWarning().contains("Geçersiz miktar"));
    }

    @Test
    void computeFromQuantity_zeroQuantity_warning() {
        SimulationResultDto r = service.computeFromQuantity("X", AssetType.STOCK, LocalDate.now(), BigDecimal.ZERO);
        assertTrue(r.getWarning().contains("Geçersiz miktar"));
    }

    @Test
    void computeFromQuantity_historyEmpty_warning() {
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of());
        SimulationResultDto r = service.computeFromQuantity("X", AssetType.STOCK, LocalDate.now(), new BigDecimal("1"));
        assertTrue(r.getWarning().contains("historical veri yok"));
    }

    @Test
    void computeFromQuantity_entryNotFound_warning() {
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(LocalDate.now().minusDays(10), 100)));
        // Data starts at now-10; investmentDate 5 years before that → no data point <= investmentDate
        SimulationResultDto r = service.computeFromQuantity("X", AssetType.STOCK,
                LocalDate.now().minusYears(5), new BigDecimal("1"));
        assertTrue(r.getWarning().contains("Entry tarihindeki fiyat geçersiz"));
    }

    @Test
    void computeFromQuantity_quantityMultipliedByEntryPrice() {
        LocalDate d1 = LocalDate.now().minusDays(2);
        LocalDate d3 = LocalDate.now();
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(d1, 100), bar(d3, 120)));

        // 5 unit alındı, entry price 100 → amountTry = 500
        SimulationResultDto r = service.computeFromQuantity("X", AssetType.STOCK, d1, new BigDecimal("5"));

        assertNull(r.getWarning());
        // 5 unit, current price 120 → currentValue 600
        assertEquals(0, new BigDecimal("600").compareTo(r.getCurrentValue()));
    }

    // -------- getEarliestAvailableDate --------

    @Test
    void earliest_nullArgs_returnsNull() {
        assertNull(service.getEarliestAvailableDate(null, AssetType.STOCK));
        assertNull(service.getEarliestAvailableDate("X", null));
    }

    @Test
    void earliest_emptyHistory_returnsNull() {
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of());

        assertNull(service.getEarliestAvailableDate("X", AssetType.STOCK));
    }

    @Test
    void earliest_returnsMinimumDate() {
        LocalDate d1 = LocalDate.of(2020, 1, 1);
        LocalDate d2 = LocalDate.of(2024, 1, 1);
        LocalDate d3 = LocalDate.of(2022, 1, 1);
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(d2, 100), bar(d1, 90), bar(d3, 110)));

        assertEquals(d1, service.getEarliestAvailableDate("X", AssetType.STOCK));
    }

    // -------- getMyList --------

    @Test
    void getMyList_empty_returnsEmpty() {
        when(simRepo.findByUser_IdOrderByCreatedAtDesc(userId)).thenReturn(List.of());
        assertTrue(service.getMyList().isEmpty());
    }

    @Test
    void getMyList_computesEachSim() {
        Simulation s = new Simulation();
        s.setId(UUID.randomUUID());
        s.setSymbol("BTC");
        s.setAssetType(AssetType.CRYPTO);
        s.setInvestmentDate(LocalDate.now().minusDays(1));
        s.setAmountTry(new BigDecimal("1000"));
        s.setCreatedAt(LocalDateTime.now());
        when(simRepo.findByUser_IdOrderByCreatedAtDesc(userId)).thenReturn(List.of(s));
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(LocalDate.now().minusDays(1), 100), bar(LocalDate.now(), 110)));

        List<SimulationDto> result = service.getMyList();

        assertEquals(1, result.size());
        assertNotNull(result.get(0).getResult());
        assertEquals("BTC", result.get(0).getSymbol());
    }

    // -------- save --------

    @Test
    void save_userMissing_throws404() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        SimulationCreateRequestDto req = new SimulationCreateRequestDto(
                "BTC", AssetType.CRYPTO, LocalDate.now(), new BigDecimal("1000"), null);
        assertThrows(ResourceNotFoundException.class, () -> service.save(req));
    }

    @Test
    void save_validRequest_savesAndReturnsDto() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(LocalDate.now().minusDays(1), 100), bar(LocalDate.now(), 110)));

        SimulationCreateRequestDto req = new SimulationCreateRequestDto(
                "BTC", AssetType.CRYPTO, LocalDate.now().minusDays(1),
                new BigDecimal("1000"), "test note");

        SimulationDto result = service.save(req);

        ArgumentCaptor<Simulation> cap = ArgumentCaptor.forClass(Simulation.class);
        verify(simRepo).save(cap.capture());
        assertEquals("BTC", cap.getValue().getSymbol());
        assertEquals("test note", cap.getValue().getNotes());
        assertNotNull(result.getResult());
    }

    // -------- delete --------

    @Test
    void delete_missing_throws404() {
        UUID simId = UUID.randomUUID();
        when(simRepo.findByIdAndUser_Id(simId, userId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.delete(simId));
    }

    @Test
    void delete_existing_deletes() {
        UUID simId = UUID.randomUUID();
        Simulation sim = new Simulation();
        sim.setId(simId);
        when(simRepo.findByIdAndUser_Id(simId, userId)).thenReturn(Optional.of(sim));

        service.delete(simId);

        verify(simRepo).delete(sim);
    }

    // -------- preview (calls compute) --------

    @Test
    void preview_delegatesToCompute() {
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(LocalDate.now().minusDays(1), 100), bar(LocalDate.now(), 110)));

        SimulationCreateRequestDto req = new SimulationCreateRequestDto(
                "BTC", AssetType.CRYPTO, LocalDate.now().minusDays(1),
                new BigDecimal("1000"), null);

        SimulationResultDto r = service.preview(req);

        assertNull(r.getWarning());
        assertNotNull(r.getCurrentValue());
        // No DB save
        verify(simRepo, never()).save(any());
    }

    private HistoricalDataDto bar(LocalDate date, double close) {
        HistoricalDataDto dto = new HistoricalDataDto();
        dto.setDate(date);
        dto.setClose(BigDecimal.valueOf(close));
        return dto;
    }
}
