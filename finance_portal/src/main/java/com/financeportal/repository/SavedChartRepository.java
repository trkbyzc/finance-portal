package com.financeportal.repository;

import com.financeportal.model.entity.SavedChart;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SavedChartRepository extends BaseRepository<SavedChart, UUID> {

    List<SavedChart> findByUser_IdOrderByCreatedAtDesc(UUID userId);
}
