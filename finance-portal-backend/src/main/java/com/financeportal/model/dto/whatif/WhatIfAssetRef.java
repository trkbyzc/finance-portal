package com.financeportal.model.dto.whatif;

import com.financeportal.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WhatIfAssetRef {
    private String symbol;
    private AssetType assetType;

    /**
     * Opsiyonel: kullanıcı miktar mode'unda bu varlıktan kaç birim aldığını söyler.
     * Doluysa WhatIfService bunu kullanarak amountTry'ı hesaplar (quantity × entryPrice);
     * boşsa request-level amountTry her asset'e uygulanır (mevcut tutar mode davranışı).
     */
    private BigDecimal quantity;
}
