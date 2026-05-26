package com.financeportal.service.portfolio;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.model.dto.simulation.PricePointDto;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Kullanıcıya özel "Şu tarihte şu varlığı X TL ile alsaydım?" senaryolarını tutar ve hesaplar.
 * <p>
 * Hesap (compute) her okumada anlık yapılır — series + currentValue + P&L DB'de saklanmaz,
 * sadece kullanıcı'nın girdiği parametreler persistent.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SimulationService {

    private final SimulationRepository simulationRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final MarketChartService marketChartService;

    // ---------- Public API ----------

    public List<SimulationDto> getMyList() {
        UUID userId = securityUtils.getCurrentUserId();
        List<Simulation> sims = simulationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
        List<SimulationDto> result = new ArrayList<>(sims.size());
        for (Simulation s : sims) result.add(toDto(s, compute(s.getSymbol(), s.getAssetType(), s.getInvestmentDate(), s.getAmountTry())));
        return result;
    }

    public SimulationResultDto preview(SimulationCreateRequestDto req) {
        return compute(req.getSymbol(), req.getAssetType(), req.getInvestmentDate(), req.getAmountTry());
    }

    /**
     * Verilen varlık için historical veride mevcut olan en erken tarihi döner.
     * Frontend bunu date input'un <code>min</code> attribute'u olarak kullanır — kullanıcı
     * varlığın yokken bir tarihi seçemez. Veri yoksa null döner.
     */
    public LocalDate getEarliestAvailableDate(String symbol, AssetType assetType) {
        if (symbol == null || assetType == null) return null;
        List<?> history = safeFetchHistory(symbol, assetType);
        if (history == null || history.isEmpty()) return null;
        LocalDate earliest = null;
        for (Object point : history) {
            LocalDate d = dateOf(point);
            if (d != null && (earliest == null || d.isBefore(earliest))) earliest = d;
        }
        return earliest;
    }

    @Transactional
    public SimulationDto save(SimulationCreateRequestDto req) {
        UUID userId = securityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        Simulation sim = new Simulation();
        sim.setId(UUID.randomUUID());
        sim.setUser(user);
        sim.setSymbol(req.getSymbol());
        sim.setAssetType(req.getAssetType());
        sim.setInvestmentDate(req.getInvestmentDate());
        sim.setAmountTry(req.getAmountTry());
        sim.setNotes(req.getNotes());
        sim.setCreatedAt(LocalDateTime.now());
        simulationRepository.save(sim);

        log.info("[SIM] Kaydedildi: user={}, {}/{} on {} for {} TRY",
                userId, req.getSymbol(), req.getAssetType(), req.getInvestmentDate(), req.getAmountTry());

        return toDto(sim, compute(req.getSymbol(), req.getAssetType(), req.getInvestmentDate(), req.getAmountTry()));
    }

    @Transactional
    public void delete(UUID simId) {
        UUID userId = securityUtils.getCurrentUserId();
        Simulation sim = simulationRepository.findByIdAndUser_Id(simId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Simülasyon bulunamadı: " + simId));
        simulationRepository.delete(sim);
        log.info("[SIM] Silindi: {} (user={})", simId, userId);
    }

    // ---------- compute ----------

    /**
     * Tek-asset what-if hesabı. Cache'lenmiş historical veri'den entry tarihindeki birim fiyatı bulup
     * series'i yürütür. WhatIfService bu metodu her asset için paralel olarak çağırır (DRY).
     */
    public SimulationResultDto compute(String symbol, AssetType assetType, LocalDate investmentDate, BigDecimal amountTry) {
        if (symbol == null || assetType == null || investmentDate == null || amountTry == null || amountTry.signum() <= 0) {
            return warningResult(amountTry, "Geçersiz simülasyon girdisi.");
        }

        List<?> history = safeFetchHistory(symbol, assetType);
        if (history == null || history.isEmpty()) {
            return warningResult(amountTry, "Bu varlık için historical veri yok.");
        }

        // Tarihe göre sırala (UI'nın güveneceği invariant). Bazı strateji'ler zaten sıralı dönüyor ama garanti yok.
        List<Object> sorted = new ArrayList<>(history);
        sorted.sort(Comparator.comparing(p -> {
            LocalDate d = dateOf(p);
            return d == null ? LocalDate.MIN : d;
        }));

        // investmentDate'e en yakın >= tarihi bul
        int entryIdx = -1;
        for (int i = 0; i < sorted.size(); i++) {
            LocalDate d = dateOf(sorted.get(i));
            if (d != null && !d.isBefore(investmentDate)) { entryIdx = i; break; }
        }
        if (entryIdx < 0) {
            return warningResult(amountTry, "Seçilen tarih historical aralığın dışında (henüz veri yok).");
        }

        BigDecimal entryPrice = closeOf(sorted.get(entryIdx));
        LocalDate effectiveStartDate = dateOf(sorted.get(entryIdx));
        if (entryPrice == null || entryPrice.signum() <= 0) {
            return warningResult(amountTry, "Entry tarihindeki fiyat geçersiz.");
        }

        BigDecimal units = amountTry.divide(entryPrice, 8, RoundingMode.HALF_UP);

        List<PricePointDto> series = new ArrayList<>(sorted.size() - entryIdx);
        for (int i = entryIdx; i < sorted.size(); i++) {
            Object point = sorted.get(i);
            BigDecimal close = closeOf(point);
            LocalDate date = dateOf(point);
            if (close == null || date == null) continue;
            BigDecimal value = units.multiply(close).setScale(4, RoundingMode.HALF_UP);
            series.add(new PricePointDto(date, value));
        }

        if (series.isEmpty()) {
            return warningResult(amountTry, "Hesap için yeterli veri noktası yok.");
        }

        PricePointDto lastPoint = series.get(series.size() - 1);
        BigDecimal currentValue = lastPoint.getValue();
        BigDecimal currentPrice = sorted.size() > 0 ? closeOf(sorted.get(sorted.size() - 1)) : BigDecimal.ZERO;
        BigDecimal pnlTry = currentValue.subtract(amountTry).setScale(4, RoundingMode.HALF_UP);
        BigDecimal pnlPct = pnlTry.divide(amountTry, 6, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);

        return SimulationResultDto.builder()
                .unitsBought(units.setScale(8, RoundingMode.HALF_UP))
                .entryPrice(entryPrice)
                .effectiveStartDate(effectiveStartDate)
                .currentPrice(currentPrice)
                .currentValue(currentValue)
                .pnlTry(pnlTry)
                .pnlPct(pnlPct)
                .series(series)
                .build();
    }

    // ---------- helpers ----------

    private List<?> safeFetchHistory(String symbol, AssetType assetType) {
        try {
            // TR altın için özel hesap: Yahoo'da gram-altın-TRY sembolü yok (XAUTRY=X 404 dönüyor).
            // GC=F (gold futures USD/oz) × USDTRY=X ÷ 31.1035 (oz→gram) ile synthesize ediyoruz.
            if (isTurkishGoldSymbol(symbol, assetType)) {
                return fetchGramGoldTryHistory();
            }
            // "max" → tüm available history.
            return (List<?>) (List) marketChartService.getHistoricalDataWithEvdsFallback(
                    symbol, assetType.name(), "max", "1d", null, null, 0);
        } catch (Exception e) {
            log.warn("[SIM] {} için historical fetch başarısız: {}", symbol, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Truncgil'in döndürdüğü TR altın sembollerini tespit eder
     * (GRAM_ALTIN, CEYREK_ALTIN, YARIM_ALTIN, TAM_ALTIN, CUMHURIYET_ALTINI vs.).
     */
    private boolean isTurkishGoldSymbol(String symbol, AssetType assetType) {
        if (assetType != AssetType.COMMODITY || symbol == null) return false;
        String upper = symbol.toUpperCase();
        return upper.endsWith("_ALTIN") || "GRAM_HAS_ALTIN".equals(upper)
                || "CUMHURIYET_ALTINI".equals(upper)
                || upper.contains("ALTIN") || upper.contains("BILEZIK");
    }

    /**
     * Gram altın TRY tarihçesini synthesize eder: GC=F (gold futures USD/oz)
     * × USDTRY=X (USD/TRY) ÷ 31.1034768 (troy oz → gram).
     * <p>
     * GC=F Yahoo'da 2000-08-30'dan beri var. Her altın türü (gram, çeyrek, tam, yarım,
     * cumhuriyet vs.) bu eğriye göre oransal hareket eder; simülasyon mantığı
     * <code>units = amountTry / entryPrice</code> olduğundan getiri yüzdesi tüm
     * altın türleri için doğrudur (sadece absolute price farklı, oransal değişim aynı).
     */
    private List<HistoricalDataDto> fetchGramGoldTryHistory() {
        @SuppressWarnings({"unchecked", "rawtypes"})
        List<Object> gcfRaw = (List<Object>) (List) marketChartService.getHistoricalDataWithEvdsFallback(
                "GC=F", "COMMODITY", "max", "1d", null, null, 0);
        @SuppressWarnings({"unchecked", "rawtypes"})
        List<Object> usdRaw = (List<Object>) (List) marketChartService.getHistoricalDataWithEvdsFallback(
                "USDTRY=X", "CURRENCY", "max", "1d", null, null, 0);

        if (gcfRaw == null || gcfRaw.isEmpty()) {
            log.warn("[SIM-GOLD] GC=F historical boş döndü.");
            return List.of();
        }
        if (usdRaw == null || usdRaw.isEmpty()) {
            log.warn("[SIM-GOLD] USDTRY=X historical boş döndü.");
            return List.of();
        }

        // USDTRY'yi date'e göre indexle (hızlı lookup).
        Map<LocalDate, BigDecimal> usdMap = new HashMap<>();
        for (Object p : usdRaw) {
            LocalDate d = dateOf(p);
            BigDecimal c = closeOf(p);
            if (d != null && c != null && c.signum() > 0) usdMap.put(d, c);
        }
        if (usdMap.isEmpty()) {
            log.warn("[SIM-GOLD] USDTRY=X parse edilemedi (boş map).");
            return List.of();
        }

        // GC=F üzerinden walk et, her gün için USDTRY ile çarp + 31.1035'e böl.
        BigDecimal ozToGram = new BigDecimal("31.1034768");
        List<HistoricalDataDto> result = new ArrayList<>(gcfRaw.size());
        BigDecimal lastUsdTry = null; // hafta sonu/tatil GC=F günü USDTRY yoksa son bilineni kullan
        for (Object p : gcfRaw) {
            LocalDate d = dateOf(p);
            BigDecimal ozUsd = closeOf(p);
            if (d == null || ozUsd == null || ozUsd.signum() <= 0) continue;

            BigDecimal usdTry = usdMap.get(d);
            if (usdTry == null) usdTry = lastUsdTry;
            if (usdTry == null) continue;
            lastUsdTry = usdTry;

            BigDecimal gramTry = ozUsd.multiply(usdTry).divide(ozToGram, 4, RoundingMode.HALF_UP);
            HistoricalDataDto dto = new HistoricalDataDto();
            dto.setDate(d);
            dto.setTimestamp(d.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());
            dto.setOpen(gramTry); dto.setHigh(gramTry); dto.setLow(gramTry);
            dto.setClose(gramTry); dto.setPrice(gramTry); dto.setVolume(0L);
            result.add(dto);
        }
        result.sort(Comparator.comparingLong(HistoricalDataDto::getTimestamp));
        log.info("[SIM-GOLD] Synthesized gram altın TRY: {} nokta (GC=F × USDTRY ÷ 31.1035).", result.size());
        return result;
    }

    /**
     * Cache hit'te LinkedHashMap, miss'te HistoricalDataDto döner — ikisine de toleranslı close okuyucu.
     * Watchlist'in <code>closeOf</code> paterninin aynısı.
     */
    private BigDecimal closeOf(Object point) {
        if (point == null) return null;
        if (point instanceof HistoricalDataDto dto) return dto.getClose();
        if (point instanceof Map<?, ?> map) {
            Object close = map.get("close");
            if (close == null) close = map.get("price");
            return toBigDecimal(close);
        }
        return null;
    }

    private LocalDate dateOf(Object point) {
        if (point == null) return null;
        if (point instanceof HistoricalDataDto dto) return dto.getDate();
        if (point instanceof Map<?, ?> map) {
            Object date = map.get("date");
            if (date == null) return null;
            if (date instanceof LocalDate ld) return ld;
            if (date instanceof String s) {
                try { return LocalDate.parse(s); } catch (Exception ignored) { return null; }
            }
        }
        return null;
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return null;
        if (val instanceof BigDecimal bd) return bd;
        if (val instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        if (val instanceof String s) {
            try { return new BigDecimal(s); } catch (NumberFormatException ignored) { return null; }
        }
        return null;
    }

    private SimulationResultDto warningResult(BigDecimal amountTry, String message) {
        return SimulationResultDto.builder()
                .unitsBought(BigDecimal.ZERO)
                .entryPrice(BigDecimal.ZERO)
                .currentPrice(BigDecimal.ZERO)
                .currentValue(amountTry != null ? amountTry : BigDecimal.ZERO)
                .pnlTry(BigDecimal.ZERO)
                .pnlPct(BigDecimal.ZERO)
                .series(List.of())
                .warning(message)
                .build();
    }

    private SimulationDto toDto(Simulation sim, SimulationResultDto result) {
        return SimulationDto.builder()
                .id(sim.getId())
                .symbol(sim.getSymbol())
                .assetType(sim.getAssetType())
                .investmentDate(sim.getInvestmentDate())
                .amountTry(sim.getAmountTry())
                .notes(sim.getNotes())
                .createdAt(sim.getCreatedAt())
                .result(result)
                .build();
    }
}
