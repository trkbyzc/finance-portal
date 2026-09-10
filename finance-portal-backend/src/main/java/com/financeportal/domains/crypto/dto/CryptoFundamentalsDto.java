package com.financeportal.domains.crypto.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kripto detay sayfası "Temel Veriler" kartı için CoinGecko market verisi.
 * Eksik alanlar null kalır (frontend "—" gösterir).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CryptoFundamentalsDto {
    private String symbol;
    private String name;
    private Double priceUsd;
    private Double changePct24h;
    private Long marketCapRank;
    private Double marketCapUsd;
    private Double volume24hUsd;
    private Double high24h;
    private Double low24h;
    private Double ath;             // All Time High
    private Double athChangePct;    // ATH'den % uzaklık
    private Double atl;             // All Time Low
    private Double circulatingSupply;
    private Double totalSupply;
    private Double maxSupply;
}
