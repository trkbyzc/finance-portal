package com.financeportal.repository;

import com.financeportal.model.entity.Portfolio;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PortfolioRepository extends BaseRepository<Portfolio, UUID> {

    List<Portfolio> findByUser_IdOrderByCreatedAtAsc(UUID userId);

    long countByUser_Id(UUID userId);
}
