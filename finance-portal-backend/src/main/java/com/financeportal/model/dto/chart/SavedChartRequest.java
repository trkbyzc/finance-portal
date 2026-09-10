package com.financeportal.model.dto.chart;

import lombok.Data;

/**
 * Grafik kaydetme/güncelleme isteği. {@code payload} frontend'in serileştirdiği
 * çizim (overlay) listesi + grafik ayarları JSON string'idir.
 */
@Data
public class SavedChartRequest {
    private String symbol;
    private String assetCategory;
    private String name;
    private String payload;
}
