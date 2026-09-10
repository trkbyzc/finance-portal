package com.financeportal.model.dto.preferences;

import com.financeportal.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TickerSymbolDto {
    private String symbol;
    private AssetType assetType;
}
