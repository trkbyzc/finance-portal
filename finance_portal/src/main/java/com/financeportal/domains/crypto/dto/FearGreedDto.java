package com.financeportal.domains.crypto.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Crypto Fear & Greed Index'in tek bir günlük noktası (alternative.me).
 * value: 0–100 (0 = Extreme Fear, 100 = Extreme Greed), classification: metin sınıf,
 * timestamp: unix saniye (günlük).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FearGreedDto {
    private int value;
    private String classification;
    private long timestamp;
}
