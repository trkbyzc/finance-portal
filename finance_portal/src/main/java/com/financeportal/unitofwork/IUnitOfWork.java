package com.financeportal.unitofwork;

import com.financeportal.repository.AccountRepository;
import com.financeportal.repository.TransactionRepository;
import com.financeportal.repository.UserRepository;
import com.financeportal.repository.PortfolioItemRepository;

public interface IUnitOfWork {
    AccountRepository getAccounts();
    TransactionRepository getTransactions();
    UserRepository getUsers();
    PortfolioItemRepository getPortfolioItems(); // YENİ EKLENEN

    void commit();
}