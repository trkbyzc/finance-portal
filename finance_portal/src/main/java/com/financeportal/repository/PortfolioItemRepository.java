package com.financeportal.repository;

import com.financeportal.model.entity.PortfolioItem;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortfolioItemRepository extends BaseRepository<PortfolioItem, UUID> {
    // User nesnesinin içindeki id'ye ulaşmak için User_Id şeklinde alt çizgi kullanılır
    Optional<PortfolioItem> findByUser_IdAndSymbol(UUID userId, String symbol);

    // Kullanıcının tüm portföyünü getirir
    List<PortfolioItem> findByUser_Id(UUID userId);
}