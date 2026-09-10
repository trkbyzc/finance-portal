package com.financeportal.model.entity;

import com.financeportal.model.enums.AssetType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Kullanıcının market ticker bar'ında görmek istediği bir varlık. Sıra önemli — displayOrder ile sıralanır.
 * Kullanıcı PreferencesPage'den bu listeyi yönetir; MarketTicker bunu okur ve karşılığı canlı fiyatı çeker.
 */
@Entity
@Table(
        name = "user_ticker_prefs",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_ticker_user_symbol_type",
                columnNames = {"user_id", "symbol", "asset_type"}
        )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserTickerPref {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 50)
    private AssetType assetType;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;
}
