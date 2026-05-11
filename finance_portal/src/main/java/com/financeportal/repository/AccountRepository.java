package com.financeportal.repository;

import com.financeportal.model.entity.Account;
import com.financeportal.repository.base.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccountRepository extends BaseRepository<Account, UUID> {

    // Zaten var olan metodun
    List<Account> findByUserId(UUID userId);

    // --- YENİ EKLENEN: Gece sonu faiz işlemleri için Vadeli (DEPOSIT) hesapları bulma ---
    List<Account> findByAccountType(String accountType);
}