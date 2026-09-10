package com.financeportal.model.dto.portfolio;

import com.financeportal.model.enums.AssetType;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
public class TradeRequestDto {
    private String symbol;
    private AssetType assetType;
    private BigDecimal quantity;
    private BigDecimal price;
    private BigDecimal contractSize; // VİOP sözleşme büyüklüğü (çarpan); opsiyonel, yoksa 1
    private String direction;    // VİOP pozisyon yönü: LONG/SHORT; null/boş = LONG (geriye uyumlu)
    private UUID portfolioId;    // Hedef portföy; yoksa kullanıcının varsayılan portföyü
    private LocalDate purchaseDate; // Alış tarihi (opsiyonel); reel getiri/enflasyon için işlem tarihi

    /**
     * Geriye uyumlu pozisyonel ctor (direction hariç — mevcut çağıranlar/testler bozulmasın).
     * VİOP yönü {@code direction} setter ile set edilir; JSON deserialization no-arg + setter kullanır.
     */
    public TradeRequestDto(String symbol, AssetType assetType, BigDecimal quantity, BigDecimal price,
                           BigDecimal contractSize, UUID portfolioId, LocalDate purchaseDate) {
        this.symbol = symbol;
        this.assetType = assetType;
        this.quantity = quantity;
        this.price = price;
        this.contractSize = contractSize;
        this.portfolioId = portfolioId;
        this.purchaseDate = purchaseDate;
    }
}
