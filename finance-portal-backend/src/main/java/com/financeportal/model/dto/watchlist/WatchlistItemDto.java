package com.financeportal.model.dto.watchlist;

import com.financeportal.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistItemDto {

    private UUID id;
    private String symbol;
    private AssetType assetType;
    private LocalDateTime addedAt;

    private BigDecimal currentPrice;
    private BigDecimal dailyChangePct;
    private List<BigDecimal> sparkline;
}
