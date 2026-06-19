package com.financeportal.service.portfolio;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.entity.Portfolio;
import com.financeportal.model.entity.PortfolioItem;
import com.financeportal.model.entity.Transaction;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.AssetType;
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
import java.util.Optional;
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
     *
     * <p>VİOP'ta pozisyon symbol + yön ile gruplanır: aynı sembolde ayrı bir LONG ve SHORT
     * pozisyonu birlikte tutulabilir. BUY her zaman pozisyonu AÇAR/ARTIRIR (yön bağımsız);
     * yön yalnızca değerlemede K/Z işaretini belirler.
     */
    public void executeManualEntry(UUID userId, Portfolio portfolio, TradeRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        String direction = normalizeDirection(request); // spot → null, VİOP → LONG/SHORT
        PortfolioItem item = findPosition(portfolio.getId(), request.getSymbol(), direction).orElse(null);

        // VİOP çarpanı ekleme anında snapshot'lanır (sonradan mock tablo değişse de pozisyon doğru kalır).
        BigDecimal contractSize = (request.getContractSize() != null && request.getContractSize().signum() > 0)
                ? request.getContractSize()
                : BigDecimal.ONE;

        if (item == null) {
            item = new PortfolioItem();
            item.setId(UUID.randomUUID());
            item.setUser(user);
            item.setPortfolio(portfolio);
            item.setSymbol(request.getSymbol());
            item.setAssetType(request.getAssetType());
            item.setQuantity(request.getQuantity());
            item.setAveragePrice(request.getPrice());
            item.setContractSize(contractSize);
            item.setDirection(direction); // spot=null, VİOP=LONG/SHORT
        } else {
            BigDecimal oldTotal = item.getQuantity().multiply(item.getAveragePrice());
            BigDecimal newTotal = request.getQuantity().multiply(request.getPrice());
            BigDecimal totalQuantity = item.getQuantity().add(request.getQuantity());
            item.setAveragePrice(oldTotal.add(newTotal).divide(totalQuantity, 4, RoundingMode.HALF_UP));
            item.setQuantity(totalQuantity);
            // Bu özellikten önce eklenmiş VİOP satırı direction=null ise LONG'a normalize et.
            if (item.getDirection() == null && direction != null) item.setDirection(direction);
        }

        portfolioItemRepository.save(item);

        // Audit trail: yeni varlık eklemek veya mevcuda üzerine eklemek her zaman BUY tarafıdır.
        // Alış tarihi verilmişse işlem tarihi olarak kullanılır (reel getiri/enflasyon doğru hesaplansın).
        LocalDateTime executedAt = request.getPurchaseDate() != null ? request.getPurchaseDate().atStartOfDay() : null;
        writeTx(user, request.getSymbol(), item.getAssetType(), TradeSide.BUY,
                request.getQuantity(), request.getPrice(), null, executedAt, item.getDirection(), item.getContractSize());
    }

    public void executeUpdateManualEntry(Portfolio portfolio, TradeRequestDto request) {
        String direction = normalizeDirection(request);
        PortfolioItem item = findPosition(portfolio.getId(), request.getSymbol(), direction)
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
                    absQty, request.getPrice(), note, null, item.getDirection(), item.getContractSize());
        }
    }

    public void executeRemoveFromPortfolio(Portfolio portfolio, TradeRequestDto request) {
        String direction = normalizeDirection(request);
        PortfolioItem item = findPosition(portfolio.getId(), request.getSymbol(), direction)
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
                removed, sellPrice, null, null, item.getDirection(), item.getContractSize());
    }

    /**
     * VİOP (FUTURE) için yön normalize eder: null/boş/tanınmayan → "LONG"; "short" → "SHORT".
     * VİOP dışı (spot) varlıklarda yön yoktur → null (eski davranış birebir korunur).
     */
    private String normalizeDirection(TradeRequestDto request) {
        if (request.getAssetType() != AssetType.FUTURE) return null;
        String d = request.getDirection();
        return (d != null && "SHORT".equalsIgnoreCase(d.trim())) ? "SHORT" : "LONG";
    }

    /**
     * Pozisyonu bulur: VİOP (direction != null) → symbol + yön; spot (direction == null) → symbol (tek satır).
     */
    private Optional<PortfolioItem> findPosition(UUID portfolioId, String symbol, String direction) {
        return direction != null
                ? portfolioItemRepository.findByPortfolio_IdAndSymbolAndDirection(portfolioId, symbol, direction)
                : portfolioItemRepository.findByPortfolio_IdAndSymbol(portfolioId, symbol);
    }

    private void writeTx(User user, String symbol, AssetType assetType, TradeSide side,
                         BigDecimal quantity, BigDecimal price, String notes,
                         LocalDateTime executedAt, String direction, BigDecimal contractSize) {
        if (!transactionWriteEnabled) return; // feature flag kapalı, audit yazmıyoruz
        Transaction tx = new Transaction(
                UUID.randomUUID(), user, symbol, assetType, side, quantity, price,
                executedAt != null ? executedAt : LocalDateTime.now(), notes, direction, contractSize
        );
        transactionRepository.save(tx);
    }
}
