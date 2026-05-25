package com.financeportal.model.dto.watchlist;

import com.financeportal.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistAddRequestDto {

    private String symbol;
    private AssetType assetType;
}
