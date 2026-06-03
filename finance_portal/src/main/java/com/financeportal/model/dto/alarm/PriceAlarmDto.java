package com.financeportal.model.dto.alarm;

import com.financeportal.model.enums.AlarmCondition;
import com.financeportal.model.enums.AlarmFrequency;
import com.financeportal.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAlarmDto {
    private UUID id;
    private String symbol;
    private AssetType assetType;
    private AlarmCondition condition;
    private BigDecimal threshold;
    private AlarmFrequency frequency;
    private String note;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime lastTriggeredAt;
    private int triggerCount;
}
