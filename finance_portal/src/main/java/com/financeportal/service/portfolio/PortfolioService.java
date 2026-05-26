package com.financeportal.service.portfolio;

import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.dto.portfolio.TransactionDto;
import com.financeportal.model.entity.Transaction;
import com.financeportal.repository.PortfolioItemRepository;
import com.financeportal.repository.TransactionRepository;
import com.financeportal.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioItemRepository portfolioItemRepository;
    private final TransactionRepository transactionRepository;
    private final SecurityUtils securityUtils;
    private final PortfolioTradeService tradeService;
    private final PortfolioAnalyticsService analyticsService;

    @Transactional(rollbackFor = Exception.class)
    public void addManualEntry(TradeRequestDto request) {
        UUID currentUserId = securityUtils.getCurrentUserId();
        log.info("Portföye varlık eklendi - userId: {}, symbol: {}", currentUserId, request.getSymbol());
        tradeService.executeManualEntry(currentUserId, request);
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateManualEntry(TradeRequestDto request) {
        UUID currentUserId = securityUtils.getCurrentUserId();
        log.info("Portföydeki varlık güncellendi - userId: {}, symbol: {}", currentUserId, request.getSymbol());
        tradeService.executeUpdateManualEntry(currentUserId, request);
    }

    @Transactional(rollbackFor = Exception.class)
    public void removeFromPortfolio(TradeRequestDto request) {
        UUID currentUserId = securityUtils.getCurrentUserId();
        log.info("Portföyden varlık çıkarıldı - userId: {}, symbol: {}", currentUserId, request.getSymbol());
        tradeService.executeRemoveFromPortfolio(currentUserId, request);
    }

    public List<PortfolioItemDto> getMyPortfolio() {
        UUID currentUserId = securityUtils.getCurrentUserId();
        var items = portfolioItemRepository.findByUser_Id(currentUserId);
        return analyticsService.buildPortfolioItems(items);
    }

    public PortfolioSummaryDto getMyPortfolioSummary() {
        UUID currentUserId = securityUtils.getCurrentUserId();
        var items = portfolioItemRepository.findByUser_Id(currentUserId);
        return analyticsService.buildPortfolioSummary(items);
    }

    /**
     * Kullanıcının transaction history'si. Hem symbol hem date range opsiyonel —
     * 4 query method'ından uygun olanı seçer.
     */
    public Page<TransactionDto> getMyTransactions(String symbol, LocalDate fromDate, LocalDate toDate, int page, int size) {
        UUID currentUserId = securityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));

        String normalizedSymbol = (symbol != null && !symbol.isBlank()) ? symbol.trim() : null;
        LocalDateTime from = fromDate != null
                ? fromDate.atStartOfDay()
                : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime to = toDate != null
                ? toDate.atTime(LocalTime.MAX)
                : LocalDateTime.now().plusDays(1);
        boolean hasDateRange = fromDate != null || toDate != null;

        Page<Transaction> result;
        if (normalizedSymbol != null && hasDateRange) {
            result = transactionRepository.findByUser_IdAndSymbolAndExecutedAtBetweenOrderByExecutedAtDesc(
                    currentUserId, normalizedSymbol, from, to, pageable);
        } else if (normalizedSymbol != null) {
            result = transactionRepository.findByUser_IdAndSymbolOrderByExecutedAtDesc(
                    currentUserId, normalizedSymbol, pageable);
        } else if (hasDateRange) {
            result = transactionRepository.findByUser_IdAndExecutedAtBetweenOrderByExecutedAtDesc(
                    currentUserId, from, to, pageable);
        } else {
            result = transactionRepository.findByUser_IdOrderByExecutedAtDesc(currentUserId, pageable);
        }

        return result.map(this::toDto);
    }

    private TransactionDto toDto(Transaction t) {
        return new TransactionDto(
                t.getId(), t.getSymbol(), t.getAssetType(), t.getSide(),
                t.getQuantity(), t.getPrice(), t.getExecutedAt(), t.getNotes()
        );
    }
}
