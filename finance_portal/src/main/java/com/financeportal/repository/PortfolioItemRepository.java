package com.financeportal.repository;

import com.financeportal.model.entity.PortfolioItem;
import com.financeportal.model.enums.AssetType;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortfolioItemRepository extends BaseRepository<PortfolioItem, UUID> {
    // User nesnesinin içindeki id'ye ulaşmak için User_Id şeklinde alt çizgi kullanılır
    Optional<PortfolioItem> findByUser_IdAndSymbol(UUID userId, String symbol);

    List<PortfolioItem> findByUser_Id(UUID userId);

    List<PortfolioItem> findByPortfolio_Id(UUID portfolioId);

    // Tip bazında tüm pozisyonlar — VİOP vade uzlaşma cron'u FUTURE'ları tarar
    List<PortfolioItem> findByAssetType(AssetType assetType);

    Optional<PortfolioItem> findByPortfolio_IdAndSymbol(UUID portfolioId, String symbol);

    /**
     * VİOP yön-bazlı pozisyon araması: aynı sembolde ayrı LONG ve SHORT pozisyonları olabilir.
     * LONG ararken eski (direction = NULL) kayıtlar da eşleşir — böylece bu özellikten önce
     * eklenmiş VİOP pozisyonları yeni LONG eklemeleriyle sorunsuz birleşir (geriye uyumlu).
     */
    @Query("SELECT p FROM PortfolioItem p WHERE p.portfolio.id = :portfolioId AND p.symbol = :symbol "
            + "AND (p.direction = :direction OR (:direction = 'LONG' AND p.direction IS NULL))")
    Optional<PortfolioItem> findByPortfolio_IdAndSymbolAndDirection(@Param("portfolioId") UUID portfolioId,
                                                                    @Param("symbol") String symbol,
                                                                    @Param("direction") String direction);
}