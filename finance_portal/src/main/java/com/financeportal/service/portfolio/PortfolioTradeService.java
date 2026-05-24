package com.financeportal.service.portfolio;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.entity.PortfolioItem;
import com.financeportal.repository.PortfolioItemRepository;
import com.financeportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class PortfolioTradeService {

    private final PortfolioItemRepository portfolioItemRepository;
    private final UserRepository userRepository;

    public void executeManualEntry(UUID userId, TradeRequestDto request) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));
        PortfolioItem item = portfolioItemRepository.findByUser_IdAndSymbol(userId, request.getSymbol()).orElse(null);

        if (item == null) {
            item = new PortfolioItem(UUID.randomUUID(), user, request.getSymbol(), request.getAssetType(),
                    request.getQuantity(), request.getPrice());
        } else {
            BigDecimal oldTotal = item.getQuantity().multiply(item.getAveragePrice());
            BigDecimal newTotal = request.getQuantity().multiply(request.getPrice());
            BigDecimal totalQuantity = item.getQuantity().add(request.getQuantity());
            item.setAveragePrice(oldTotal.add(newTotal).divide(totalQuantity, 4, RoundingMode.HALF_UP));
            item.setQuantity(totalQuantity);
        }

        portfolioItemRepository.save(item);
    }

    public void executeUpdateManualEntry(UUID userId, TradeRequestDto request) {
        PortfolioItem item = portfolioItemRepository.findByUser_IdAndSymbol(userId, request.getSymbol())
                .orElseThrow(() -> new ResourceNotFoundException("Varlık bulunamadı: " + request.getSymbol()));

        item.setQuantity(request.getQuantity());
        item.setAveragePrice(request.getPrice());
        portfolioItemRepository.save(item);
    }

    public void executeRemoveFromPortfolio(UUID userId, TradeRequestDto request) {
        PortfolioItem item = portfolioItemRepository.findByUser_IdAndSymbol(userId, request.getSymbol())
                .orElseThrow(() -> new ResourceNotFoundException("Varlık bulunamadı: " + request.getSymbol()));

        if (request.getQuantity() == null || request.getQuantity().compareTo(item.getQuantity()) >= 0) {
            portfolioItemRepository.delete(item);
            return;
        }

        item.setQuantity(item.getQuantity().subtract(request.getQuantity()));
        portfolioItemRepository.save(item);
    }
}
