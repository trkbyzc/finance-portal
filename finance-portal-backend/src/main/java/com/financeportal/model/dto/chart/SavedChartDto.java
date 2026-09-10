package com.financeportal.model.dto.chart;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Kaydedilmiş grafik yanıtı. {@code payload} liste görünümünde null bırakılabilir
 * (sadece detay/aç çağrısında doldurulur) — liste yükünü hafifletmek için.
 */
public record SavedChartDto(
        UUID id,
        String symbol,
        String assetCategory,
        String name,
        String payload,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
