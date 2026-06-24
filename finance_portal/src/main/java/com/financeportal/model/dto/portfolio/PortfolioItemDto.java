package com.financeportal.model.dto.portfolio;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class PortfolioItemDto {
    private String symbol;
    private String assetType;
    private BigDecimal quantity;
    private BigDecimal averagePrice;
    private BigDecimal contractSize;    // VİOP çarpanı (diğer varlıklarda 1)
    private BigDecimal totalCost;       // Adet * Çarpan * Maliyet (Toplam Maliyet)

    private BigDecimal currentPrice;
    private BigDecimal currentValue;    // Güncel Değer (Adet * Anlık Fiyat)
    private BigDecimal profitLoss;      // Kar/Zarar (TL bazlı)
    private BigDecimal profitLossPct;   // Kar/Zarar (Yüzde bazlı)

    // VİOP uzantısı — yalnızca FUTURE pozisyonlarda dolu; diğer varlık türlerinde null
    private String direction;           // Pozisyon yönü: LONG / SHORT
    private BigDecimal notional;        // Notional = adet × güncelFiyat × çarpan (piyasada kontrol edilen tutar)
    private BigDecimal marginPosted;    // Bağlanan teminat (VİOP'ta gerçek maliyet — totalCost bununla aynı)
    private BigDecimal leverage;        // Kaldıraç = notional / teminat

    /**
     * Çekirdek değerleme alanları için pozisyonel ctor (geriye uyumlu — mevcut çağıranlar bozulmasın).
     * VİOP uzantı alanları (direction/notional/marginPosted/leverage) setter ile set edilir.
     */
    public PortfolioItemDto(String symbol, String assetType, BigDecimal quantity, BigDecimal averagePrice,
                            BigDecimal contractSize, BigDecimal totalCost, BigDecimal currentPrice,
                            BigDecimal currentValue, BigDecimal profitLoss, BigDecimal profitLossPct) {
        this.symbol = symbol;
        this.assetType = assetType;
        this.quantity = quantity;
        this.averagePrice = averagePrice;
        this.contractSize = contractSize;
        this.totalCost = totalCost;
        this.currentPrice = currentPrice;
        this.currentValue = currentValue;
        this.profitLoss = profitLoss;
        this.profitLossPct = profitLossPct;
    }
}
