package com.financeportal.service.portfolio;

import com.financeportal.domains.bond.config.BondSpec;
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
 * Tahvil/eurobond vade itfası (redemption). Vadesi geçen sabit getirili pozisyon, nominalin
 * tamamı <b>par (temiz fiyat 100)</b> üzerinden geri ödenir → pozisyon kapatılır + audit'e yazılır.
 *
 * <p>Değerleme zaten vadede par'a çeker ({@code BondMath}, years ≤ 0 → 100); bu job ek olarak
 * itfa olmuş pozisyonu portföyden temizler.
 *
 * <ul>
 *   <li><b>İdempotent:</b> kapatılan pozisyon silindiği için tekrar işlenmez.</li>
 *   <li><b>Dayanıklı:</b> bir pozisyon hata verirse atlanır + log'lanır, batch çökmiyor.</li>
 * </ul>
 *
 * Devre dışı: <code>bond.maturity.enabled=false</code>. Cron: <code>bond.maturity.cron</code>.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "bond.maturity.enabled", matchIfMissing = true)
public class BondMaturitySettlementJob {

    private static final BigDecimal PAR = new BigDecimal("100"); // itfa = temiz fiyat 100 (nominal geri döner)

    private final PortfolioItemRepository portfolioItemRepository;
    private final TransactionRepository transactionRepository;
    private final BondSpec bondSpec;

    @Scheduled(cron = "${bond.maturity.cron:0 35 18 * * *}")
    @Transactional
    public void settleMaturedBonds() {
        LocalDate today = LocalDate.now();
        List<PortfolioItem> bonds = portfolioItemRepository.findByAssetType(AssetType.BOND);
        if (bonds.isEmpty()) return;

        int closed = 0, skipped = 0;
        for (PortfolioItem item : bonds) {
            try {
                LocalDate maturity = bondSpec.forSymbol(item.getSymbol(), null).maturity();
                if (maturity == null || !today.isAfter(maturity)) continue; // vade gelmemiş → dokunma

                // Par itfası: SELL @ temiz fiyat 100 → audit; pozisyonu kapat.
                Transaction tx = new Transaction(
                        UUID.randomUUID(), item.getUser(), item.getSymbol(), item.getAssetType(), TradeSide.SELL,
                        item.getQuantity(), PAR, LocalDateTime.now(), "Tahvil vade itfası (par)",
                        item.getDirection(), item.getContractSize());
                transactionRepository.save(tx);
                portfolioItemRepository.delete(item);
                closed++;
            } catch (Exception e) {
                log.warn("[BOND-MATURITY] İtfa hatası, atlandı: {} — {}", item.getSymbol(), e.getMessage());
                skipped++;
            }
        }

        if (closed > 0 || skipped > 0) {
            log.info("[BOND-MATURITY] Vade itfası: {} pozisyon kapatıldı, {} atlandı.", closed, skipped);
        }
    }
}
