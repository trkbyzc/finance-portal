package com.financeportal.service.portfolio;

import com.financeportal.model.dto.simulation.PricePointDto;
import com.financeportal.model.dto.simulation.SimulationResultDto;
import com.financeportal.model.dto.whatif.WhatIfAssetRef;
import com.financeportal.model.dto.whatif.WhatIfAssetSeries;
import com.financeportal.model.dto.whatif.WhatIfRequestDto;
import com.financeportal.model.dto.whatif.WhatIfResultDto;
import com.financeportal.model.enums.AssetType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Stateless what-if karşılaştırma servisi: "X TL'yi Y tarihinde {THYAO, BTC, USD, ...}'a yatırsaydım?"
 * <p>
 * Mantık {@link SimulationService#compute} ile DRY — her asset için paralel olarak compute'u çağırır,
 * series'leri server-side ~300 nokta'ya downsample edip merge eder. 8sn asset bazlı timeout var:
 * Fintables / EVDS / Yahoo'dan biri yavaşsa hepsini bekletmesin.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatIfService {

    private static final int MAX_SERIES_POINTS = 300;
    private static final long PER_ASSET_TIMEOUT_SEC = 8;

    private final SimulationService simulationService;

    /** Asset başına ayrılmış bağımsız thread pool — TomcatRequest thread'lerini bloklamamak için. */
    private final ExecutorService executor = Executors.newFixedThreadPool(
            Math.max(4, Runtime.getRuntime().availableProcessors())
    );

    public WhatIfResultDto compare(WhatIfRequestDto req) {
        if (req == null || req.getInvestmentDate() == null
                || req.getAssets() == null || req.getAssets().isEmpty()) {
            return new WhatIfResultDto(
                    req != null ? req.getInvestmentDate() : null,
                    req != null ? req.getAmountTry() : null,
                    Collections.emptyList()
            );
        }
        // Tutar VEYA miktar mode kabul edilir. İkisi de yoksa boş sonuç.
        boolean hasGlobalAmount = req.getAmountTry() != null && req.getAmountTry().signum() > 0;
        boolean allAssetsHaveQty = req.getAssets().stream()
                .allMatch(a -> a.getQuantity() != null && a.getQuantity().signum() > 0);
        if (!hasGlobalAmount && !allAssetsHaveQty) {
            return new WhatIfResultDto(req.getInvestmentDate(), req.getAmountTry(), Collections.emptyList());
        }

        List<CompletableFuture<WhatIfAssetSeries>> futures = new ArrayList<>(req.getAssets().size());
        for (WhatIfAssetRef ref : req.getAssets()) {
            futures.add(computeOneAsync(ref, req.getInvestmentDate(), req.getAmountTry()));
        }

        List<WhatIfAssetSeries> result = new ArrayList<>(futures.size());
        for (CompletableFuture<WhatIfAssetSeries> f : futures) {
            try {
                result.add(f.get(PER_ASSET_TIMEOUT_SEC + 2, TimeUnit.SECONDS));
            } catch (Exception e) {
                // computeOneAsync zaten completeOnTimeout ile error series döner — buraya düşmesi beklenmez,
                // ama olursa generic warning ekle.
                log.warn("[WHAT-IF] Future bekleme hatası: {}", e.getMessage());
                result.add(errorSeries(null, "İşlem zaman aşımına uğradı."));
            }
        }
        return new WhatIfResultDto(req.getInvestmentDate(), req.getAmountTry(), result);
    }

    private CompletableFuture<WhatIfAssetSeries> computeOneAsync(WhatIfAssetRef ref, LocalDate date, BigDecimal amount) {
        return CompletableFuture
                .supplyAsync(() -> computeOne(ref, date, amount), executor)
                .completeOnTimeout(errorSeries(ref, "Veri kaynağı yavaş, zaman aşımı."), PER_ASSET_TIMEOUT_SEC, TimeUnit.SECONDS);
    }

    private WhatIfAssetSeries computeOne(WhatIfAssetRef ref, LocalDate date, BigDecimal amount) {
        // Asset bazlı quantity verildiyse miktar mode (her asset için ayrı amountTry hesaplanır);
        // yoksa global amountTry (tutar mode, varsayılan davranış).
        SimulationResultDto sim = (ref.getQuantity() != null && ref.getQuantity().signum() > 0)
                ? simulationService.computeFromQuantity(ref.getSymbol(), ref.getAssetType(), date, ref.getQuantity())
                : simulationService.compute(ref.getSymbol(), ref.getAssetType(), date, amount);
        WhatIfAssetSeries out = new WhatIfAssetSeries();
        out.setKey(keyOf(ref));
        out.setSymbol(ref.getSymbol());
        out.setAssetType(ref.getAssetType());
        out.setLabel(ref.getSymbol()); // basit; frontend görünür isim üretmek isterse map eder
        out.setCurrentValue(sim.getCurrentValue());
        out.setPnlTry(sim.getPnlTry());
        out.setPnlPct(sim.getPnlPct());
        out.setSeries(downsample(sim.getSeries(), MAX_SERIES_POINTS));
        if (sim.getWarning() != null) out.setWarning(sim.getWarning());
        return out;
    }

    private static String keyOf(WhatIfAssetRef ref) {
        if (ref == null) return "UNKNOWN";
        AssetType t = ref.getAssetType();
        return (t != null ? t.name() : "ASSET") + ":" + (ref.getSymbol() != null ? ref.getSymbol() : "?");
    }

    private WhatIfAssetSeries errorSeries(WhatIfAssetRef ref, String warning) {
        WhatIfAssetSeries s = new WhatIfAssetSeries();
        if (ref != null) {
            s.setKey(keyOf(ref));
            s.setSymbol(ref.getSymbol());
            s.setAssetType(ref.getAssetType());
            s.setLabel(ref.getSymbol());
        } else {
            s.setKey("UNKNOWN");
        }
        s.setCurrentValue(BigDecimal.ZERO);
        s.setPnlTry(BigDecimal.ZERO);
        s.setPnlPct(BigDecimal.ZERO);
        s.setSeries(Collections.emptyList());
        s.setWarning(warning);
        return s;
    }

    /**
     * Equally-spaced bucketing. Series uzunluğu max'tan küçükse aynen döner; aksi halde
     * step = size / max ile sample'lar (son nokta her zaman korunur — current value görünsün).
     */
    private static List<PricePointDto> downsample(List<PricePointDto> series, int max) {
        if (series == null || series.isEmpty() || series.size() <= max) {
            return series != null ? series : Collections.emptyList();
        }
        List<PricePointDto> out = new ArrayList<>(max);
        double step = (double) series.size() / max;
        for (int i = 0; i < max - 1; i++) {
            int idx = (int) Math.floor(i * step);
            out.add(series.get(idx));
        }
        out.add(series.get(series.size() - 1)); // last point invariant
        return out;
    }
}
