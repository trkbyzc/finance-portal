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

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String symbol; // Örn: THYAO.IS, BTC, USD

    @Enumerated(EnumType.STRING)
    private AssetType assetType;

    @Column(nullable = false)
    private BigDecimal quantity; // Adet veya Miktar

    @Column(nullable = false)
    private BigDecimal averagePrice; // Ortalama Alış Maliyeti
}