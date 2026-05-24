package com.financeportal.service.portfolio;

import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.repository.PortfolioItemRepository;
import com.financeportal.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioItemRepository portfolioItemRepository;
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
}
