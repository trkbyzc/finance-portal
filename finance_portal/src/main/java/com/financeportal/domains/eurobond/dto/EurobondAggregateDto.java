package com.financeportal.domains.eurobond.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * "Türkiye Dış Borçlanma Görünümü" aggregate dashboard verisi (EVDS Yol B).
 *
 * - totalStockByYear: yıllık toplam Eurobond stoku (USD milyon).
 *     [{ year: "2020", value: 92500 }, { year: "2021", value: 105000 }, ...]
 *
 * - currencyMix: ihraç döviz cinsi dağılımı (% paylar).
 *     [{ currency: "USD", value: 78.5 }, { currency: "EUR", value: 18.2 }, { currency: "JPY", value: 3.3 }]
 *
 * - maturityMix: vade dağılımı (% paylar).
 *     [{ bucket: "Kısa (0-3y)", value: 12.4 }, { bucket: "Orta (3-10y)", value: 41.2 }, { bucket: "Uzun (10y+)", value: 46.4 }]
 *
 * - lastUpdated: kaynak verinin son güncellenme tarihi (EVDS metadata).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EurobondAggregateDto {
    private List<Map<String, Object>> totalStockByYear;
    private List<Map<String, Object>> currencyMix;
    private List<Map<String, Object>> maturityMix;
    private String lastUpdated;
}
