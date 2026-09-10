package com.financeportal.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Kullanıcının adlandırılmış portföyü. Bir kullanıcının birden çok portföyü olabilir;
 * her {@link PortfolioItem} bir portföye bağlıdır. İlk erişimde "Ana Portföy" otomatik oluşur.
 */
@Entity
@Table(name = "portfolios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Portfolio {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
