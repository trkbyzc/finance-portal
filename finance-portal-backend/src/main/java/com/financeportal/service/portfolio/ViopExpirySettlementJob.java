package com.financeportal.service.portfolio;

import com.financeportal.domains.viop.config.ViopExpiry;
import com.financeportal.model.entity.PortfolioItem;
import com.financeportal.model.entity.Transaction;
import com.financeportal.model.enums.AssetType;
import com.financeportal.model.enums.TradeSide;
import com.financeportal.repository.PortfolioItemRepository;
import com.financeportal.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * VİOP vade (expiry) otomatik uzlaşması. Sembolün AAYY ekinden vade tarihi çıkarılır
 * ({@link ViopExpiry}); vadesi geçmiş her pozisyon, uzlaşma (son piyasa) fiyatından
 * <b>yön korunarak</b> SELL ile kapatılır ve audit ledger'ına yazılır.
 *
 * <ul>
 *   <li><b>İdempotent:</b> kapatılan pozisyon silindiği için sonraki çalışmada tekrar işlenmez.</li>
 *   <li><b>Dayanıklı:</b> bir pozisyon hata verirse atlanır + log'lanır, batch çökmiyor (over-sell koruması).</li>
 *   <li><b>Uzlaşma fiyatı yoksa</b> (0/null) kapatma atlanır → manuel kapatma için log uyarısı.</li>
 * </ul>
 *
 * Devre dışı bırakmak için: <code>viop.expiry.enabled=false</code>. Cron: <code>viop.expiry.cron</code>.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "viop.expiry.enabled", matchIfMissing = true)
public class ViopExpirySettlementJob {

    private final PortfolioItemRepository portfolioItemRepository;
    private final PortfolioPriceService priceService;
    private final TransactionRepository transactionRepository;

    // Her gün 18:30 (BİST kapanışından sonra). Override: viop.expiry.cron
    @Scheduled(cron = "${viop.expiry.cron:0 30 18 * * *}")
    @Transactional
    public void settleExpiredPositions() {
        LocalDate today = LocalDate.now();
        List<PortfolioItem> futures = portfolioItemRepository.findByAssetType(AssetType.FUTURE);
        if (futures.isEmpty()) return;

        int closed = 0, skipped = 0;
        for (PortfolioItem item : futures) {
            try {
                if (!ViopExpiry.isExpired(item.getSymbol(), today)) continue; // vade gelmemiş → dokunma

                BigDecimal settlement = priceService.getCurrentPrice(item.getSymbol(), AssetType.FUTURE);
                if (settlement == null || settlement.signum() <= 0) {
                    // Uzlaşma fiyatı bulunamadı → otomatik kapatma yapma, manuel kapatma için işaretle.
                    log.warn("[VIOP-EXPIRY] Uzlaşma fiyatı yok, otomatik kapatma atlandı: {} (vade {})",
                            item.getSymbol(), ViopExpiry.expiryDate(item.getSymbol()));
                    skipped++;
                    continue;
                }

                // Yön korunarak SELL @ uzlaşma → audit, sonra pozisyonu kapat (sil).
                writeSettlementTx(item, settlement);
                portfolioItemRepository.delete(item);
                closed++;
            } catch (Exception e) {
                // Tek pozisyonun hatası tüm batch'i çökertmez (over-sell koruması mantığı).
                log.warn("[VIOP-EXPIRY] Pozisyon kapatma hatası, atlandı: {} — {}", item.getSymbol(), e.getMessage());
                skipped++;
            }
        }

        if (closed > 0 || skipped > 0) {
            log.info("[VIOP-EXPIRY] Vade uzlaşması: {} pozisyon kapatıldı, {} atlandı.", closed, skipped);
        }
    }

    private void writeSettlementTx(PortfolioItem item, BigDecimal settlementPrice) {
        Transaction tx = new Transaction(
                UUID.randomUUID(), item.getUser(), item.getSymbol(), item.getAssetType(), TradeSide.SELL,
                item.getQuantity(), settlementPrice, LocalDateTime.now(), "VİOP vade uzlaşması (otomatik kapama)",
                item.getDirection(), item.getContractSize()
        );
        transactionRepository.save(tx);
    }
}
