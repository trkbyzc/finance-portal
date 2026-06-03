package com.financeportal.service.portfolio;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.entity.Portfolio;
import com.financeportal.model.entity.PortfolioItem;
import com.financeportal.model.entity.Transaction;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.TradeSide;
import com.financeportal.repository.PortfolioItemRepository;
import com.financeportal.repository.TransactionRepository;
import com.financeportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class PortfolioTradeService {

    private final PortfolioItemRepository portfolioItemRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Feature flag: dual-write transactions tablosu. Production'da geçici olarak kapatmak için
     * application.yaml'a {@code portfolio.transaction-write.enabled: false} eklenebilir.
     * Default true — aggregate ve audit trail birlikte yazılır.
     */
    @Value("${portfolio.transaction-write.enabled:true}")
    private boolean transactionWriteEnabled;

    /**
     * Tek bir {@code @Transactional} sınırı içinde çağrılır (caller PortfolioService).
     * Hem portfolio_items aggregate hem transactions audit satırı aynı tx'te commit/rollback olur.
     */
    public void executeManualEntry(UUID userId, Portfolio portfolio, TradeRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));
        PortfolioItem item = portfolioItemRepository.findByPortfolio_IdAndSymbol(portfolio.getId(), request.getSymbol()).orElse(null);

        if (item == null) {
            // VİOP çarpanı ekleme anında snapshot'lanır (sonradan mock tablo değişse de pozisyon doğru kalır).
            BigDecimal contractSize = (request.getContractSize() != null && request.getContractSize().signum() > 0)
                    ? request.getContractSize()
                    : BigDecimal.ONE;
            item = new PortfolioItem();
            item.setId(UUID.randomUUID());
            item.setUser(user);
            item.setPortfolio(portfolio);
            item.setSymbol(request.getSymbol());
            item.setAssetType(request.getAssetType());
            item.setQuantity(request.getQuantity());
            item.setAveragePrice(request.getPrice());
            item.setContractSize(contractSize);
        } else {
            BigDecimal oldTotal = item.getQuantity().multiply(item.getAveragePrice());
            BigDecimal newTotal = request.getQuantity().multiply(request.getPrice());
            BigDecimal totalQuantity = item.getQuantity().add(request.getQuantity());
            item.setAveragePrice(oldTotal.add(newTotal).divide(totalQuantity, 4, RoundingMode.HALF_UP));
            item.setQuantity(totalQuantity);
        }

        portfolioItemRepository.save(item);

        // Audit trail: yeni varlık eklemek veya mevcuda üzerine eklemek her zaman BUY tarafıdır.
        writeTx(user, request.getSymbol(), item.getAssetType(), TradeSide.BUY,
                request.getQuantity(), request.getPrice(), null);
    }

    public void executeUpdateManualEntry(Portfolio portfolio, TradeRequestDto request) {
        PortfolioItem item = portfolioItemRepository.findByPortfolio_IdAndSymbol(portfolio.getId(), request.getSymbol())
                .orElseThrow(() -> new ResourceNotFoundException("Varlık bulunamadı: " + request.getSymbol()));

        BigDecimal oldQty = item.getQuantity();
        BigDecimal newQty = request.getQuantity();
        BigDecimal delta = newQty.subtract(oldQty);

        item.setQuantity(newQty);
        item.setAveragePrice(request.getPrice());
        portfolioItemRepository.save(item);

        // Quantity diff > 0 → ek BUY, < 0 → SELL. = 0 ise sadece fiyat düzeltmesi, audit kaydı atmıyoruz
        // çünkü kullanıcı sadece average-cost basis'i revize ediyor, gerçek bir trade yok.
        if (delta.signum() != 0) {
            TradeSide side = delta.signum() > 0 ? TradeSide.BUY : TradeSide.SELL;
            BigDecimal absQty = delta.abs();
            String note = oldQty.compareTo(BigDecimal.ZERO) == 0 ? null : "Quantity edit (was " + oldQty + ")";
            writeTx(item.getUser(), request.getSymbol(), item.getAssetType(), side,
                    absQty, request.getPrice(), note);
        }
    }

    public void executeRemoveFromPortfolio(Portfolio portfolio, TradeRequestDto request) {
        PortfolioItem item = portfolioItemRepository.findByPortfolio_IdAndSymbol(portfolio.getId(), request.getSymbol())
                .orElseThrow(() -> new ResourceNotFoundException("Varlık bulunamadı: " + request.getSymbol()));

        BigDecimal removed;
        if (request.getQuantity() == null || request.getQuantity().compareTo(item.getQuantity()) >= 0) {
            removed = item.getQuantity();
            portfolioItemRepository.delete(item);
        } else {
            removed = request.getQuantity();
            item.setQuantity(item.getQuantity().subtract(removed));
            portfolioItemRepository.save(item);
        }

        // SELL audit fiyatı: frontend SellModal current market price gönderir (gerçek işlem fiyatı).
        // Eski caller'lar (price=0) için fallback olarak averagePrice (cost-basis) kullanırız.
        BigDecimal sellPrice = (request.getPrice() != null && request.getPrice().signum() > 0)
                ? request.getPrice()
                : item.getAveragePrice();
        writeTx(item.getUser(), request.getSymbol(), item.getAssetType(), TradeSide.SELL,
                removed, sellPrice, null);
    }

    private void writeTx(User user, String symbol, com.financeportal.model.enums.AssetType assetType,
                         TradeSide side, BigDecimal quantity, BigDecimal price, String notes) {
        if (!transactionWriteEnabled) return; // feature flag kapalı, audit yazmıyoruz
        Transaction tx = new Transaction(
                UUID.randomUUID(), user, symbol, assetType, side, quantity, price, LocalDateTime.now(), notes
        );
        transactionRepository.save(tx);
    }
}
