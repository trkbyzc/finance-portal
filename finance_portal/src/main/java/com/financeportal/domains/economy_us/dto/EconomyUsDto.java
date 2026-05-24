package com.financeportal.domains.economy_us.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ABD makro ekonomi göstergeleri (anlık).
 * cpiIndex = en güncel CPIAUCSL endeks değeri (örn. 308.4)
 * yoyChangePct = yıllık % değişim (kullanıcıya gösterilecek "ABD enflasyonu = %X" rakamı)
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EconomyUsDto {
    private Double cpiIndex;
    private Double yoyChangePct;
    private String lastUpdated;
}
