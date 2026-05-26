package com.financeportal.model.entity;

import com.financeportal.model.enums.AssetType;
import com.financeportal.model.enums.TradeSide;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tek tek BUY/SELL hareketlerini saklayan audit-trail entity'si.
 * {@link PortfolioItem} aggregate (toplam quantity + ortalama maliyet) bu hareketlerin
 * üst-küme özetidir; transactions tablosu ham hareket geçmişi (bir başka deyişle ledger).
 */
@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false)
    private AssetType assetType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 4)
    private TradeSide side;

    @Column(nullable = false, precision = 19, scale = 6)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal price;

    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;

    /** Backfilled satırları işaretlemek için: 'Backfilled from portfolio_items'. */
    @Column(columnDefinition = "TEXT")
    private String notes;
}
