package com.financeportal.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String accountName;

    @Column(nullable = false)
    private BigDecimal balance;

    @Column(nullable = false, length = 3)
    private String currency;

    // --- YENİ EKLENEN MEVDUAT ALANLARI ---
    @Column(nullable = false, length = 20)
    private String accountType = "CHECKING"; // Varsayılan: "CHECKING", Vadeli ise "DEPOSIT"

    @Column(precision = 5, scale = 2)
    private BigDecimal interestRate; // Yıllık faiz oranı

    private LocalDateTime maturityDate; // Vade sonu tarihi
    // -------------------------------------

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}