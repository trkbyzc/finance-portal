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
    private String symbol;          // BTC
    private String name;            // Bitcoin
    private Double priceUsd;        // anlık fiyat (USD)
    private Double changePct24h;    // 24s % değişim
    private Long marketCapRank;     // piyasa değeri sırası (#1...)
    private Double marketCapUsd;    // piyasa değeri (USD)
    private Double volume24hUsd;    // 24s işlem hacmi (USD)
    private Double high24h;         // 24s en yüksek
    private Double low24h;          // 24s en düşük
    private Double ath;             // tüm zamanların en yükseği
    private Double athChangePct;    // ATH'den % uzaklık
    private Double atl;             // tüm zamanların en düşüğü
    private Double circulatingSupply;
    private Double totalSupply;
    private Double maxSupply;
}
