package com.financeportal.model.entity;

import com.financeportal.model.enums.AlarmCondition;
import com.financeportal.model.enums.AlarmFrequency;
import com.financeportal.model.enums.AssetType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Kullanıcının bir varlık için kurduğu fiyat alarmı.
 * Evaluation job (PriceAlarmEvaluationService) periyodik tarar; tetiklendiğinde mail yollar.
 */
@Entity
@Table(name = "price_alarms", indexes = {
        @Index(name = "idx_alarms_active", columnList = "active"),
        @Index(name = "idx_alarms_user", columnList = "user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAlarm {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 32)
    private AssetType assetType;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition", nullable = false, length = 16)
    private AlarmCondition condition;

    @Column(nullable = false, precision = 24, scale = 8)
    private BigDecimal threshold;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AlarmFrequency frequency;

    @Column(length = 500)
    private String note;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_triggered_at")
    private LocalDateTime lastTriggeredAt;

    @Column(name = "trigger_count", nullable = false)
    private int triggerCount;
}
