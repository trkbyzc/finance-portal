package com.financeportal.domains.crypto.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CryptoDto {
    private String currencyCode; // Örn: BTC, ETH
    private String currencyName; // Örn: Kripto - Bitcoin
    private BigDecimal forexBuying;
    private BigDecimal forexSelling; // Anlık Fiyat (Frontend ve Portföy burayı okuyor)
    private BigDecimal changePercent;

    private String yahooSymbol;   // Örn: BTC-USD (Grafikler için)
    private String chartType;     // "CANDLE"
    private String assetCategory; // "CRYPTO"
}