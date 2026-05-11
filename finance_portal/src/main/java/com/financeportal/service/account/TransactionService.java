package com.financeportal.service;

import com.financeportal.exception.InsufficientBalanceException;
import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.transaction.TransactionCreateDto;
import com.financeportal.model.dto.portfolio.TransferRequestDto;
import com.financeportal.model.dto.transaction.TransactionResponseDto;
import com.financeportal.model.entity.Account;
import com.financeportal.model.entity.Transaction;
import com.financeportal.unitofwork.IUnitOfWork;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TransactionService {

    private final IUnitOfWork unitOfWork; // Ayrı ayrı repository'ler yerine tek merkez!

    public TransactionResponseDto createTransaction(TransactionCreateDto dto) {
        log.info("İşlem başlatılıyor. Hesap ID: {}, Tip: {}, Tutar: {}", dto.getAccountId(), dto.getTransactionType(), dto.getAmount());

        try {
            Account account = unitOfWork.getAccounts().findById(dto.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Hesap bulunamadı"));

            if ("WITHDRAWAL".equalsIgnoreCase(dto.getTransactionType())) {
                if (account.getBalance().compareTo(dto.getAmount()) < 0) {
                    throw new InsufficientBalanceException("Yetersiz bakiye");
                }
                account.setBalance(account.getBalance().subtract(dto.getAmount()));
            } else if ("DEPOSIT".equalsIgnoreCase(dto.getTransactionType())) {
                account.setBalance(account.getBalance().add(dto.getAmount()));
            } else {
                throw new IllegalArgumentException("Geçersiz işlem tipi (Sadece DEPOSIT veya WITHDRAWAL)");
            }

            Transaction transaction = new Transaction();
            transaction.setId(UUID.randomUUID());
            transaction.setAccount(account);
            transaction.setAmount(dto.getAmount());
            transaction.setTransactionType(dto.getTransactionType().toUpperCase());
            transaction.setDescription(dto.getDescription()); // DTO'da olan ama eski kodda unutulan alan eklendi
            transaction.setTransactionDate(LocalDateTime.now());

            // 1. İşlemleri UoW üzerinden sıraya koy
            unitOfWork.getAccounts().save(account);
            unitOfWork.getTransactions().save(transaction);

            // 2. MÜHÜRLE! (İkisi de aynı anda DB'ye yazılır)
            unitOfWork.commit();

            log.info("İşlem başarılı. İşlem ID: {}", transaction.getId());
            return new TransactionResponseDto(transaction);

        } catch (Exception e) {
            log.error("İşlem sırasında hata: {}", e.getMessage());
            throw e; // Custom exception yapını bozmamak için fırlatmaya devam ediyoruz
        }
    }

    public void transferFunds(TransferRequestDto dto) {
        log.info("Transfer başlatılıyor. Gönderen: {}, Alıcı: {}, Tutar: {}", dto.getFromAccountId(), dto.getToAccountId(), dto.getAmount());

        try {
            Account fromAccount = unitOfWork.getAccounts().findById(dto.getFromAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Gönderen hesap bulunamadı"));

            Account toAccount = unitOfWork.getAccounts().findById(dto.getToAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Alıcı hesap bulunamadı"));

            if (fromAccount.getBalance().compareTo(dto.getAmount()) < 0) {
                throw new InsufficientBalanceException("Gönderen hesapta yetersiz bakiye");
            }

            // Bakiyeleri güncelle
            fromAccount.setBalance(fromAccount.getBalance().subtract(dto.getAmount()));
            toAccount.setBalance(toAccount.getBalance().add(dto.getAmount()));

            // Gönderen için işlem logu (Transfer Çıkışı)
            Transaction fromTx = new Transaction();
            fromTx.setId(UUID.randomUUID());
            fromTx.setAccount(fromAccount);
            fromTx.setAmount(dto.getAmount().negate()); // Eksi tutar
            fromTx.setTransactionType("TRANSFER_OUT");
            fromTx.setDescription(dto.getDescription() != null ? dto.getDescription() : "Para Transferi (Giden)");
            fromTx.setTransactionDate(LocalDateTime.now());

            // Alıcı için işlem logu (Transfer Girişi)
            Transaction toTx = new Transaction();
            toTx.setId(UUID.randomUUID());
            toTx.setAccount(toAccount);
            toTx.setAmount(dto.getAmount()); // Artı tutar
            toTx.setTransactionType("TRANSFER_IN");
            toTx.setDescription(dto.getDescription() != null ? dto.getDescription() : "Para Transferi (Gelen)");
            toTx.setTransactionDate(LocalDateTime.now());

            // 1. Dört işlemi de UoW'a teslim et
            unitOfWork.getAccounts().save(fromAccount);
            unitOfWork.getAccounts().save(toAccount);
            unitOfWork.getTransactions().save(fromTx);
            unitOfWork.getTransactions().save(toTx);

            // 2. MÜHÜRLE! (4'ü birden atomik olarak çalışır)
            unitOfWork.commit();
            log.info("Transfer başarıyla tamamlandı.");

        } catch (Exception e) {
            log.error("Transfer sırasında hata oluştu, tüm işlemler geri alındı: {}", e.getMessage());
            throw e;
        }
    }

    public List<TransactionResponseDto> getTransactionsByAccountIdAndDateRange(UUID accountId, LocalDateTime startDate, LocalDateTime endDate) {
        return unitOfWork.getTransactions().findByAccountIdAndTransactionDateBetween(accountId, startDate, endDate)
                .stream()
                .map(TransactionResponseDto::new)
                .collect(Collectors.toList());
    }

    public List<TransactionResponseDto> getTransactionsByAccountId(UUID accountId) {
        return unitOfWork.getTransactions().findByAccountId(accountId)
                .stream()
                .map(TransactionResponseDto::new)
                .collect(Collectors.toList());
    }
}