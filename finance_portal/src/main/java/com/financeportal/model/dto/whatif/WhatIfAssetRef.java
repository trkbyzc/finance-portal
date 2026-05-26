package com.financeportal.model.dto.whatif;

import com.financeportal.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WhatIfAssetRef {
    private String symbol;
    private AssetType assetType;
}
