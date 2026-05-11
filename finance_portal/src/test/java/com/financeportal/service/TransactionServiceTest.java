package com.financeportal.service;

import com.financeportal.exception.InsufficientBalanceException;
import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.TransactionCreateDto;
import com.financeportal.model.dto.TransactionResponseDto;
import com.financeportal.model.entity.Account;
import com.financeportal.model.entity.Transaction;
import com.financeportal.repository.AccountRepository;
import com.financeportal.repository.TransactionRepository;
import com.financeportal.unitofwork.IUnitOfWork;

// İŞTE EKSİK OLAN HAYAT KURTARICI IMPORTLAR BURADA
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private IUnitOfWork unitOfWork;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private TransactionService transactionService;

    private Account testAccount;
    private TransactionCreateDto createDto;

    @BeforeEach
    void setUp() {
        lenient().when(unitOfWork.getAccounts()).thenReturn(accountRepository);
        lenient().when(unitOfWork.getTransactions()).thenReturn(transactionRepository);

        testAccount = new Account();
        testAccount.setId(UUID.randomUUID());
        testAccount.setAccountName("Test Hesabı");
        testAccount.setBalance(new BigDecimal("1000.00"));

        createDto = new TransactionCreateDto();
        createDto.setAccountId(testAccount.getId());
        createDto.setAmount(new BigDecimal("200.00"));
        createDto.setDescription("Test işlemi");
    }

    @Test
    void createTransaction_withValidDeposit_shouldIncreaseBalance() {
        createDto.setTransactionType("DEPOSIT");

        when(accountRepository.findById(testAccount.getId())).thenReturn(Optional.of(testAccount));

        TransactionResponseDto response = transactionService.createTransaction(createDto);

        assertNotNull(response);
        assertEquals(new BigDecimal("1200.00"), testAccount.getBalance());
        verify(accountRepository).save(testAccount);
        verify(transactionRepository).save(any(Transaction.class));
        verify(unitOfWork).commit();
    }

    @Test
    void createTransaction_withValidWithdrawal_shouldDecreaseBalance() {
        createDto.setTransactionType("WITHDRAWAL");

        when(accountRepository.findById(testAccount.getId())).thenReturn(Optional.of(testAccount));

        TransactionResponseDto response = transactionService.createTransaction(createDto);

        assertNotNull(response);
        assertEquals(new BigDecimal("800.00"), testAccount.getBalance());
        verify(accountRepository).save(testAccount);
        verify(transactionRepository).save(any(Transaction.class));
        verify(unitOfWork).commit();
    }

    @Test
    void createTransaction_withInsufficientBalance_shouldThrowException() {
        createDto.setTransactionType("WITHDRAWAL");
        createDto.setAmount(new BigDecimal("1500.00"));

        when(accountRepository.findById(testAccount.getId())).thenReturn(Optional.of(testAccount));

        assertThrows(InsufficientBalanceException.class, () -> {
            transactionService.createTransaction(createDto);
        });

        verify(accountRepository, never()).save(any());
        verify(unitOfWork, never()).commit();
    }

    @Test
    void createTransaction_withInvalidAccount_shouldThrowException() {
        createDto.setTransactionType("DEPOSIT");

        when(accountRepository.findById(testAccount.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            transactionService.createTransaction(createDto);
        });

        verify(unitOfWork, never()).commit();
    }
}