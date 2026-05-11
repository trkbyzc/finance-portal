package com.financeportal.service;

import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.model.dto.portfolio.AssetDistributionDto;
import com.financeportal.model.entity.Account;
import com.financeportal.model.entity.PortfolioItem;

import com.financeportal.unitofwork.IUnitOfWork;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PortfolioService {

    private final IUnitOfWork unitOfWork;

    public void buyAsset(UUID userId, TradeRequestDto request) {
        log.info("Alış işlemi başlatıldı. Kullanıcı ID: {}, Varlık: {}", userId, request.getSymbol());

        try {
            // 1. Kullanıcının ana hesabını (TRY) bul
            Account tryAccount = unitOfWork.getAccounts().findByUserId(userId)
                    .stream().filter(a -> "TRY".equals(a.getCurrency())).findFirst()
                    .orElseThrow(() -> new RuntimeException("TRY hesabı bulunamadı"));

            BigDecimal totalCost = request.getPrice().multiply(request.getQuantity());

            // 2. Bakiye kontrolü
            if (tryAccount.getBalance().compareTo(totalCost) < 0) {
                throw new RuntimeException("Yetersiz bakiye! Gerekli: " + totalCost + ", Mevcut: " + tryAccount.getBalance());
            }

            // 3. TRY bakiyesini düş
            tryAccount.setBalance(tryAccount.getBalance().subtract(totalCost));

            // 4. Portföyü güncelle (Repository'deki yeni isme göre güncelledik)
            PortfolioItem item = unitOfWork.getPortfolioItems().findByUser_IdAndSymbol(userId, request.getSymbol())
                    .orElse(new PortfolioItem());

            if (item.getId() == null) {
                item.setId(UUID.randomUUID());
                item.setUser(tryAccount.getUser());
                item.setSymbol(request.getSymbol());
                item.setAssetType(request.getAssetType());
                item.setQuantity(request.getQuantity());
                item.setAveragePrice(request.getPrice());
            } else {
                // Ortalama maliyet hesapla: ((Eski Adet * Eski Fiyat) + (Yeni Adet * Yeni Fiyat)) / Toplam Adet
                BigDecimal oldTotal = item.getQuantity().multiply(item.getAveragePrice());
                BigDecimal newQuantity = item.getQuantity().add(request.getQuantity());
                item.setAveragePrice(oldTotal.add(totalCost).divide(newQuantity, RoundingMode.HALF_UP));
                item.setQuantity(newQuantity);
            }

            // 5. Kaydet ve Mühürle
            unitOfWork.getAccounts().save(tryAccount);
            unitOfWork.getPortfolioItems().save(item);
            unitOfWork.commit();

            log.info("Alış işlemi başarılı! Portföye eklendi.");

        } catch (Exception e) {
            log.error("Alış işlemi sırasında hata oluştu: {}", e.getMessage());
            throw e;
        }

    }
    public List<PortfolioItemDto> getPortfolioByUserId(UUID userId) {
        log.info("Portföy ve kar/zarar analizi getiriliyor. ID: {}", userId);

        return unitOfWork.getPortfolioItems().findByUser_Id(userId).stream().map(item -> {

            // 1. Toplam Maliyet
            BigDecimal totalCost = item.getQuantity().multiply(item.getAveragePrice());

            // 2. Anlık Fiyatı Bul (Buraya gerçek MarketDataService metodunu bağlayabilirsin)
            // Şimdilik test için varlık %5 değer kazanmış gibi simüle ediyoruz:
            BigDecimal currentPrice = item.getAveragePrice().multiply(new BigDecimal("1.05"));

            // 3. İsterler: Güncel Değer, Kar/Zarar(TL), Kar/Zarar(%)
            BigDecimal currentValue = item.getQuantity().multiply(currentPrice);
            BigDecimal profitLoss = currentValue.subtract(totalCost);
            BigDecimal profitLossPct = BigDecimal.ZERO;

            if (totalCost.compareTo(BigDecimal.ZERO) > 0) {
                // (Kar / Maliyet) * 100
                profitLossPct = profitLoss.divide(totalCost, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            }

            return new PortfolioItemDto(
                    item.getSymbol(),
                    item.getAssetType().name(),
                    item.getQuantity(),
                    item.getAveragePrice(),
                    totalCost,
                    currentPrice,
                    currentValue,
                    profitLoss,
                    profitLossPct
            );
        }).toList();
    }

    public void sellAsset(UUID userId, TradeRequestDto request) {
        log.info("Satış işlemi başlatıldı. Kullanıcı ID: {}, Varlık: {}", userId, request.getSymbol());

        try {
            // 1. Kullanıcının ana hesabını (TRY) bul
            Account tryAccount = unitOfWork.getAccounts().findByUserId(userId)
                    .stream().filter(a -> "TRY".equals(a.getCurrency())).findFirst()
                    .orElseThrow(() -> new RuntimeException("TRY hesabı bulunamadı"));

            // 2. Portföyde bu varlık var mı kontrol et
            PortfolioItem item = unitOfWork.getPortfolioItems().findByUser_IdAndSymbol(userId, request.getSymbol())
                    .orElseThrow(() -> new RuntimeException("Portföyünüzde bu varlık bulunmamaktadır: " + request.getSymbol()));

            // 3. Yeterli miktar (adet) var mı kontrol et
            if (item.getQuantity().compareTo(request.getQuantity()) < 0) {
                throw new RuntimeException("Yetersiz varlık miktarı! Mevcut: " + item.getQuantity() + ", Satılmak istenen: " + request.getQuantity());
            }

            // 4. Satış gelirini hesapla ve TRY bakiyesine ekle (Cüzdana para giriyor)
            BigDecimal totalRevenue = request.getPrice().multiply(request.getQuantity());
            tryAccount.setBalance(tryAccount.getBalance().add(totalRevenue));

            // 5. Portföydeki miktarı düşür
            BigDecimal remainingQuantity = item.getQuantity().subtract(request.getQuantity());

            if (remainingQuantity.compareTo(BigDecimal.ZERO) == 0) {
                // Eğer elindeki her şeyi (tamamını) sattıysa, portföyden o satırı tamamen sil
                unitOfWork.getPortfolioItems().delete(item);
            } else {
                // Bir kısmı satıldıysa sadece miktarı güncelle (DİKKAT: Ortalama maliyet değişmez!)
                item.setQuantity(remainingQuantity);
                unitOfWork.getPortfolioItems().save(item);
            }

            // 6. Hesapları kaydet ve UoW ile mühürle
            unitOfWork.getAccounts().save(tryAccount);
            unitOfWork.commit();

            log.info("Satış işlemi başarılı! Elde edilen gelir: {} TL", totalRevenue);

        } catch (Exception e) {
            log.error("Satış işlemi sırasında hata oluştu: {}", e.getMessage());
            throw e; // Hata fırlat ki işlem geri alınsın (Rollback)
        }
    }

    public PortfolioSummaryDto getPortfolioSummary(UUID userId) {
        log.info("Portföy özeti ve toplam getiri hazırlanıyor. ID: {}", userId);

        // 1. Nakit hesabını (TRY) bul
        Account tryAccount = unitOfWork.getAccounts().findByUserId(userId)
                .stream().filter(a -> "TRY".equals(a.getCurrency())).findFirst()
                .orElseThrow(() -> new RuntimeException("TRY hesabı bulunamadı"));

        BigDecimal totalCash = tryAccount.getBalance();

        // 2. Portföydeki varlıkları getir
        var items = unitOfWork.getPortfolioItems().findByUser_Id(userId);

        // 3. Varlıkların Toplam Maliyeti ve Güncel Değerini Hesapla
        BigDecimal totalAssetCost = BigDecimal.ZERO;
        BigDecimal totalAssetValue = BigDecimal.ZERO;
        java.util.List<AssetDistributionDto> distribution = new java.util.ArrayList<>();

        for (PortfolioItem item : items) {
            BigDecimal itemCost = item.getQuantity().multiply(item.getAveragePrice());
            // Şimdilik yine %5 kâr simülasyonu (Gerçek MarketDataService'e bağlayana kadar)
            BigDecimal currentPrice = item.getAveragePrice().multiply(new BigDecimal("1.05"));
            BigDecimal itemValue = item.getQuantity().multiply(currentPrice);

            totalAssetCost = totalAssetCost.add(itemCost);
            totalAssetValue = totalAssetValue.add(itemValue);

            // Dağılım grafiği (Pie Chart) için güncel değeri baz alıyoruz
            distribution.add(new AssetDistributionDto(item.getSymbol(), itemValue, BigDecimal.ZERO)); // Yüzdeleri aşağıda hesaplayacağız
        }

        // 4. Genel Toplam (Pastanın tamamı = Nakit + Güncel Varlıklar)
        BigDecimal grandTotal = totalCash.add(totalAssetValue);

        // 5. Yüzdeleri Hesapla (Dağılım için)
        if (grandTotal.compareTo(BigDecimal.ZERO) > 0) {
            // Nakit dilimini ekle
            if (totalCash.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal cashPct = totalCash.divide(grandTotal, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
                distribution.add(new AssetDistributionDto("Nakit (TRY)", totalCash, cashPct));
            }
            // Varlık dilimlerinin yüzdelerini güncelle
            for (AssetDistributionDto dist : distribution) {
                if (!dist.getAssetName().equals("Nakit (TRY)") && dist.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal pct = dist.getAmount().divide(grandTotal, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
                    dist.setPercentage(pct);
                }
            }
        }

        // 6. Toplam Kâr/Zarar Hesapları (SADECE varlıklar üzerinden hesaplanır, nakit kâr etmez)
        BigDecimal totalProfitLoss = totalAssetValue.subtract(totalAssetCost);
        BigDecimal totalProfitLossPct = BigDecimal.ZERO;

        if (totalAssetCost.compareTo(BigDecimal.ZERO) > 0) {
            totalProfitLossPct = totalProfitLoss.divide(totalAssetCost, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
        }

        // 7. DTO'yu doldur ve dön
        PortfolioSummaryDto summary = new PortfolioSummaryDto();
        summary.setTotalCash(totalCash);
        summary.setTotalAssetCost(totalAssetCost);
        summary.setTotalAssetValue(totalAssetValue);
        summary.setGrandTotal(grandTotal);
        summary.setTotalProfitLoss(totalProfitLoss);
        summary.setTotalProfitLossPct(totalProfitLossPct);
        summary.setDistribution(distribution);

        return summary;
    }

}