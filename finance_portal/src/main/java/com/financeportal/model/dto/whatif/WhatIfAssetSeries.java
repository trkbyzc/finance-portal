package com.financeportal.model.dto.whatif;

import com.financeportal.model.dto.simulation.PricePointDto;
import com.financeportal.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Tek asset için what-if hesabının sonucu. Frontend bunu line chart'ta tek bir line ve
 * altındaki kartta ayrı bir satır olarak gösteriyor.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WhatIfAssetSeries {

    /** Frontend chart legend + tablo etiketi için kompozit key — "STOCK:THYAO" gibi. */
    private String key;

    private String symbol;
    private AssetType assetType;

    /** Görünen label, frontend i18n yapmasın diye sembolün insanca hali. */
    private String label;

    private BigDecimal currentValue;
    private BigDecimal pnlTry;
    private BigDecimal pnlPct;

    /**
     * Downsample edilmiş seri (max 300 nokta). Chart performance için server'da inceltiyoruz —
     * 5 asset × 10 yıl daily = 12,500 nokta recharts'ı kasıyor, 1500'e indi.
     */
    private List<PricePointDto> series;

    /** Veri bulunamadıysa veya timeout olduysa kullanıcıya gösterilecek uyarı. */
    private String warning;
}
