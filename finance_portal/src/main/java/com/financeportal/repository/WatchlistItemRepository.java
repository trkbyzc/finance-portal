package com.financeportal.repository;

import com.financeportal.model.entity.WatchlistItem;
import com.financeportal.model.enums.AssetType;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WatchlistItemRepository extends BaseRepository<WatchlistItem, UUID> {

    List<WatchlistItem> findByUser_IdOrderByAddedAtDesc(UUID userId);

    Optional<WatchlistItem> findByUser_IdAndSymbolAndAssetType(UUID userId, String symbol, AssetType assetType);

    Optional<WatchlistItem> findByIdAndUser_Id(UUID id, UUID userId);
}
