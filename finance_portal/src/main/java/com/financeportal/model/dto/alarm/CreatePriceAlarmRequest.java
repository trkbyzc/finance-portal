package com.financeportal.model.dto.alarm;

import com.financeportal.model.enums.AlarmCondition;
import com.financeportal.model.enums.AlarmFrequency;
import com.financeportal.model.enums.AssetType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePriceAlarmRequest {
    private String symbol;
    private AssetType assetType;
    private AlarmCondition condition;
    private BigDecimal threshold;
    private AlarmFrequency frequency;
    private String note;
}
