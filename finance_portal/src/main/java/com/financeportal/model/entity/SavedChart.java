package com.financeportal.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Kullanıcının kaydettiği grafik: sembol + kategori + çizim araçları (overlay) ve
 * grafik ayarları JSON olarak {@code payload} içinde tutulur. "Hesabım" sayfasında listelenir,
 * tıklanınca grafik açılıp çizimler geri yüklenir.
 */
@Entity
@Table(name = "saved_charts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SavedChart {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String symbol;

    @Column(name = "asset_category")
    private String assetCategory;

    @Column(nullable = false)
    private String name;

    /** JSON: { overlays: [...], settings: { range, candleType, ... } } — çizimler + grafik durumu. */
    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
