package com.financeportal.unitofwork;

import com.financeportal.repository.AccountRepository;
import com.financeportal.repository.TransactionRepository;
import com.financeportal.repository.UserRepository;
import com.financeportal.repository.PortfolioItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class UnitOfWork implements IUnitOfWork {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final PortfolioItemRepository portfolioItemRepository; // YENİ EKLENEN

    @Override
    public AccountRepository getAccounts() { return accountRepository; }

    @Override
    public TransactionRepository getTransactions() { return transactionRepository; }

    @Override
    public UserRepository getUsers() { return userRepository; }

    @Override
    public PortfolioItemRepository getPortfolioItems() { return portfolioItemRepository; } // YENİ EKLENEN

    @Override
    @Transactional
    public void commit() {
        log.info("Unit of Work: İşlemler commit ediliyor...");
    }
}