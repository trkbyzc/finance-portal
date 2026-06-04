package com.financeportal.model.dto.portfolio;

import com.financeportal.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TradeRequestDto {
    private String symbol;       // THYAO.IS, BTC vb.
    private AssetType assetType; // STOCK, CRYPTO vb.
    private BigDecimal quantity; // Kaç adet/miktar alınacak?
    private BigDecimal price;    // Anlık alış fiyatı
    private BigDecimal contractSize; // VİOP sözleşme büyüklüğü (çarpan); opsiyonel, yoksa 1
    private UUID portfolioId;    // Hedef portföy; yoksa kullanıcının varsayılan portföyü
    private LocalDate purchaseDate; // Alış tarihi (opsiyonel); reel getiri/enflasyon için işlem tarihi
}