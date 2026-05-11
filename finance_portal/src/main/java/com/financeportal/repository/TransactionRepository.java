package com.financeportal.repository;

import com.financeportal.model.entity.Transaction;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends BaseRepository<Transaction, UUID> {
    List<Transaction> findByAccountId(UUID accountId);
    List<Transaction> findByAccountIdAndTransactionDateBetween(UUID accountId, LocalDateTime startDate, LocalDateTime endDate);
}