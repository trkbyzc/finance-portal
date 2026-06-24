package com.financeportal.model.entity;

import com.financeportal.model.enums.AssetType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "portfolio_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioItem {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Hangi portföye ait. Geçişte nullable; yeni kayıtlarda her zaman set edilir.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id")
    private Portfolio portfolio;

    @Column(nullable = false)
    private String symbol; // Örn: THYAO.IS, BTC, USD

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false)
    private AssetType assetType;

    @Column(nullable = false, precision = 19, scale = 6)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal averagePrice;

    // VİOP sözleşme büyüklüğü (çarpan): nominal = fiyat × çarpan × adet.
    // VİOP dışı varlıklarda 1. Pozisyon ekleme anındaki değer snapshot'lanır.
    @Column(name = "contract_size", nullable = false, precision = 19, scale = 6)
    private BigDecimal contractSize;

    // VİOP pozisyon yönü: "LONG" (uzun) veya "SHORT" (kısa/açığa satış).
    // null = LONG (geriye uyumlu: VİOP dışı tüm varlıklar ve eski kayıtlar uzun sayılır).
    // Pozisyonlar symbol + direction ile gruplanır → aynı sembolde ayrı LONG ve SHORT pozisyonu olabilir.
    @Column(name = "direction", length = 5)
    private String direction;
}