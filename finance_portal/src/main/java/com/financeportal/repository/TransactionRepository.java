package com.financeportal.repository;

import com.financeportal.model.entity.Transaction;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface TransactionRepository extends BaseRepository<Transaction, UUID> {

    Page<Transaction> findByUser_IdOrderByExecutedAtDesc(UUID userId, Pageable pageable);

    Page<Transaction> findByUser_IdAndSymbolOrderByExecutedAtDesc(UUID userId, String symbol, Pageable pageable);

    Page<Transaction> findByUser_IdAndExecutedAtBetweenOrderByExecutedAtDesc(
            UUID userId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<Transaction> findByUser_IdAndSymbolAndExecutedAtBetweenOrderByExecutedAtDesc(
            UUID userId, String symbol, LocalDateTime from, LocalDateTime to, Pageable pageable);
}
