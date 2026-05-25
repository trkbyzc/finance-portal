package com.financeportal.model.entity;

import com.financeportal.model.enums.AssetType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "watchlist_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_watchlist_user_symbol_type",
                columnNames = {"user_id", "symbol", "asset_type"}
        )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistItem {

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

    @Column(name = "added_at", nullable = false)
    private LocalDateTime addedAt;
}
