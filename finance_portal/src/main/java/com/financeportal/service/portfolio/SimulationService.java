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
 * Hesap (compute) her okumada anlık yapılır — series + currentValue + P&amp;L DB'de saklanmaz,
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

    /**
     * Miktar-bazlı varyant. Kullanıcı "şu tarihte X birim aldıydım" der; biz o tarihteki entry price ile
     * çarpıp amountTry'a çevirir, sonra normal {@link #compute} akışını kullanırız (tek tane series formülü).
     * <p>
     * WhatIfService'in miktar mode'unda her asset için ayrı amountTry hesaplanmasını sağlar — global
     * tek amountTry yetersiz çünkü her varlığın birim fiyatı farklı.
     */
    public SimulationResultDto computeFromQuantity(String symbol, AssetType assetType, LocalDate investmentDate, BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            return warningResult(BigDecimal.ZERO, "Geçersiz miktar.");
        }

        List<?> history = safeFetchHistory(symbol, assetType);
        if (history == null || history.isEmpty()) {
            return warningResult(BigDecimal.ZERO, "Bu varlık için historical veri yok.");
        }

        // Entry tarihindeki fiyatı bul — compute() ile aynı tarihçe lookup mantığı, sonra amountTry türet
        List<Object> sorted = new ArrayList<>(history);
        sorted.sort(Comparator.comparing(p -> {
            LocalDate d = dateOf(p);
            return d == null ? LocalDate.MIN : d;
        }));
        BigDecimal entryPrice = null;
        for (Object p : sorted) {
            LocalDate d = dateOf(p);
            if (d != null && !d.isBefore(investmentDate)) {
                entryPrice = closeOf(p);
                break;
            }
        }
        if (entryPrice == null || entryPrice.signum() <= 0) {
            return warningResult(BigDecimal.ZERO, "Entry tarihindeki fiyat geçersiz.");
        }

        BigDecimal amountTry = quantity.multiply(entryPrice).setScale(4, RoundingMode.HALF_UP);
        return compute(symbol, assetType, investmentDate, amountTry);
    }

    private List<?> safeFetchHistory(String symbol, AssetType assetType) {
        try {
            // TR-altın, currency, crypto, vb. — özel strateji'ler ChartDataStrategy implementasyonlarında.
            // TurkishGoldChartStrategy GRAM_ALTIN/CEYREK_ALTIN/TAM_ALTIN... için GC=F × USDTRY synthesizer'ı koşturur.
            return marketChartService.getHistoricalDataWithEvdsFallback(
                    symbol, assetType.name(), "max", "1d", null, null, 0);
        } catch (Exception e) {
            log.warn("[SIM] {} için historical fetch başarısız: {}", symbol, e.getMessage());
            return Collections.emptyList();
        }
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
