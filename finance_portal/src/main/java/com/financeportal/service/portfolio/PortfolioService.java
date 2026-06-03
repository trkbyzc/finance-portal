package com.financeportal.service.portfolio;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.portfolio.PortfolioDto;
import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.dto.portfolio.TransactionDto;
import com.financeportal.model.entity.Portfolio;
import com.financeportal.model.entity.Transaction;
import com.financeportal.model.entity.User;
import com.financeportal.repository.PortfolioItemRepository;
import com.financeportal.repository.PortfolioRepository;
import com.financeportal.repository.TransactionRepository;
import com.financeportal.repository.UserRepository;
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
    private final PortfolioRepository portfolioRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final PortfolioTradeService tradeService;
    private final PortfolioAnalyticsService analyticsService;

    // ---------- Portföy yönetimi (çoklu adlandırılmış portföy) ----------

    @Transactional
    public List<PortfolioDto> listPortfolios() {
        UUID userId = securityUtils.getCurrentUserId();
        getOrCreateDefault(userId); // en az bir portföy garantisi
        return portfolioRepository.findByUser_IdOrderByCreatedAtAsc(userId).stream()
                .map(p -> new PortfolioDto(p.getId(), p.getName(), p.getCreatedAt(),
                        portfolioItemRepository.findByPortfolio_Id(p.getId()).size()))
                .toList();
    }

    @Transactional
    public PortfolioDto createPortfolio(String name) {
        UUID userId = securityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));
        String clean = (name != null && !name.isBlank()) ? name.trim() : "Yeni Portföy";
        Portfolio p = portfolioRepository.save(new Portfolio(UUID.randomUUID(), user, clean, LocalDateTime.now()));
        return new PortfolioDto(p.getId(), p.getName(), p.getCreatedAt(), 0);
    }

    @Transactional
    public PortfolioDto renamePortfolio(UUID portfolioId, String name) {
        Portfolio p = requireOwned(portfolioId);
        if (name != null && !name.isBlank()) p.setName(name.trim());
        portfolioRepository.save(p);
        return new PortfolioDto(p.getId(), p.getName(), p.getCreatedAt(),
                portfolioItemRepository.findByPortfolio_Id(p.getId()).size());
    }

    @Transactional
    public void deletePortfolio(UUID portfolioId) {
        UUID userId = securityUtils.getCurrentUserId();
        Portfolio p = requireOwned(portfolioId);
        if (portfolioRepository.countByUser_Id(userId) <= 1) {
            throw new IllegalStateException("Son portföy silinemez.");
        }
        portfolioItemRepository.deleteAll(portfolioItemRepository.findByPortfolio_Id(portfolioId));
        portfolioRepository.delete(p);
    }

    private Portfolio requireOwned(UUID portfolioId) {
        UUID userId = securityUtils.getCurrentUserId();
        Portfolio p = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portföy bulunamadı"));
        if (!p.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Portföy bulunamadı");
        }
        return p;
    }

    private Portfolio getOrCreateDefault(UUID userId) {
        List<Portfolio> list = portfolioRepository.findByUser_IdOrderByCreatedAtAsc(userId);
        if (!list.isEmpty()) return list.get(0);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));
        return portfolioRepository.save(new Portfolio(UUID.randomUUID(), user, "Ana Portföy", LocalDateTime.now()));
    }

    /** İstenen portföyü (sahiplik doğrulanmış) ya da varsayılanı döndürür. */
    private Portfolio resolvePortfolio(UUID userId, UUID portfolioId) {
        if (portfolioId != null) {
            Portfolio p = portfolioRepository.findById(portfolioId).orElse(null);
            if (p != null && p.getUser().getId().equals(userId)) return p;
        }
        return getOrCreateDefault(userId);
    }

    // ---------- İşlemler (portföy bazlı) ----------

    @Transactional(rollbackFor = Exception.class)
    public void addManualEntry(TradeRequestDto request) {
        UUID currentUserId = securityUtils.getCurrentUserId();
        Portfolio portfolio = resolvePortfolio(currentUserId, request.getPortfolioId());
        log.info("Portföye varlık eklendi - userId: {}, portfolio: {}, symbol: {}", currentUserId, portfolio.getId(), request.getSymbol());
        tradeService.executeManualEntry(currentUserId, portfolio, request);
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateManualEntry(TradeRequestDto request) {
        UUID currentUserId = securityUtils.getCurrentUserId();
        Portfolio portfolio = resolvePortfolio(currentUserId, request.getPortfolioId());
        log.info("Portföydeki varlık güncellendi - userId: {}, symbol: {}", currentUserId, request.getSymbol());
        tradeService.executeUpdateManualEntry(portfolio, request);
    }

    @Transactional(rollbackFor = Exception.class)
    public void removeFromPortfolio(TradeRequestDto request) {
        UUID currentUserId = securityUtils.getCurrentUserId();
        Portfolio portfolio = resolvePortfolio(currentUserId, request.getPortfolioId());
        log.info("Portföyden varlık çıkarıldı - userId: {}, symbol: {}", currentUserId, request.getSymbol());
        tradeService.executeRemoveFromPortfolio(portfolio, request);
    }

    public List<PortfolioItemDto> getMyPortfolio(UUID portfolioId) {
        UUID currentUserId = securityUtils.getCurrentUserId();
        Portfolio portfolio = resolvePortfolio(currentUserId, portfolioId);
        var items = portfolioItemRepository.findByPortfolio_Id(portfolio.getId());
        return analyticsService.buildPortfolioItems(items);
    }

    public PortfolioSummaryDto getMyPortfolioSummary(UUID portfolioId) {
        UUID currentUserId = securityUtils.getCurrentUserId();
        Portfolio portfolio = resolvePortfolio(currentUserId, portfolioId);
        var items = portfolioItemRepository.findByPortfolio_Id(portfolio.getId());
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
