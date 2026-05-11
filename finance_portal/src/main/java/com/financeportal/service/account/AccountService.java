package com.financeportal.service;

import com.financeportal.exception.InsufficientBalanceException;
import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.account.AccountCreateDto;
import com.financeportal.model.dto.account.AccountResponseDto;
import com.financeportal.model.dto.account.OpenDepositAccountDto;
import com.financeportal.model.entity.Account;
import com.financeportal.model.entity.Transaction;
import com.financeportal.model.entity.User;
import com.financeportal.unitofwork.IUnitOfWork;
import com.financeportal.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AccountService {

    private final IUnitOfWork unitOfWork;
    private final SecurityUtils securityUtils;

    public AccountResponseDto createAccount(AccountCreateDto dto) {
        UUID currentUserId = securityUtils.getCurrentUserId();
        log.info("Yeni hesap oluşturma talebi alındı. Kullanıcı ID: {}", currentUserId);

        try {
            User user = unitOfWork.getUsers().findById(currentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

            Account account = new Account();
            account.setId(UUID.randomUUID());
            account.setUser(user);
            account.setAccountName(dto.getAccountName());
            account.setBalance(dto.getBalance());
            account.setCurrency(dto.getCurrency());
            account.setAccountType("CHECKING"); // Varsayılan vadesiz
            account.setCreatedAt(LocalDateTime.now());

            unitOfWork.getAccounts().save(account);
            unitOfWork.commit();

            log.info("Hesap başarıyla oluşturuldu. Hesap ID: {}", account.getId());
            return convertToDto(account);

        } catch (Exception e) {
            log.error("Hesap oluşturulurken hata: {}", e.getMessage());
            throw e;
        }
    }

    // --- YENİ EKLENEN: VADELİ HESAP AÇMA MANTIĞI ---
    public AccountResponseDto openDepositAccount(OpenDepositAccountDto dto) {
        UUID currentUserId = securityUtils.getCurrentUserId();
        log.info("Vadeli hesap açma talebi alındı. Kullanıcı ID: {}", currentUserId);

        try {
            // 1. Kaynak hesabı bul ve bakiye kontrolü yap
            Account sourceAccount = getAccountEntityById(dto.getSourceAccountId());

            if (!sourceAccount.getUser().getId().equals(currentUserId)) {
                throw new SecurityException("Bu hesap size ait değil!");
            }
            if (sourceAccount.getBalance().compareTo(dto.getAmount()) < 0) {
                throw new InsufficientBalanceException("Kaynak hesapta yeterli bakiye bulunmamaktadır.");
            }

            // 2. Kaynak hesaptan (Vadesiz) parayı düş
            sourceAccount.setBalance(sourceAccount.getBalance().subtract(dto.getAmount()));
            unitOfWork.getAccounts().save(sourceAccount);

            // 3. Yeni Vadeli Hesabı (DEPOSIT) Oluştur
            Account depositAccount = new Account();
            depositAccount.setId(UUID.randomUUID());
            depositAccount.setUser(sourceAccount.getUser());
            depositAccount.setAccountName(dto.getDurationInDays() + " Günlük Vadeli Hesap");
            depositAccount.setBalance(dto.getAmount());
            depositAccount.setCurrency(sourceAccount.getCurrency());
            depositAccount.setAccountType("DEPOSIT"); // Kritik nokta
            depositAccount.setInterestRate(dto.getInterestRate());
            depositAccount.setMaturityDate(LocalDateTime.now().plusDays(dto.getDurationInDays()));
            depositAccount.setCreatedAt(LocalDateTime.now());
            unitOfWork.getAccounts().save(depositAccount);

            // 4. Dekontları (Transaction) Oluştur
            Transaction withdrawTx = new Transaction(UUID.randomUUID(), sourceAccount, dto.getAmount(), "WITHDRAWAL", "Vadeli hesaba aktarım", LocalDateTime.now());
            Transaction depositTx = new Transaction(UUID.randomUUID(), depositAccount, dto.getAmount(), "DEPOSIT", "Vadeli hesap açılışı", LocalDateTime.now());
            unitOfWork.getTransactions().save(withdrawTx);
            unitOfWork.getTransactions().save(depositTx);

            // 5. Unit of Work ile Mühürle (Ya hep ya hiç!)
            unitOfWork.commit();
            log.info("Vadeli hesap başarıyla oluşturuldu ve bakiye aktarıldı. Yeni Hesap ID: {}", depositAccount.getId());

            return convertToDto(depositAccount);
        } catch (Exception e) {
            log.error("Vadeli hesap açılırken hata: {}", e.getMessage());
            throw e;
        }
    }

    public List<AccountResponseDto> getAccountsByUserId(UUID userId) {
        return unitOfWork.getAccounts().findByUserId(userId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public BigDecimal getTotalBalanceByUserId(UUID userId) {
        return unitOfWork.getAccounts().findByUserId(userId)
                .stream()
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public AccountResponseDto getAccountById(UUID id) {
        Account account = getAccountEntityById(id);
        return convertToDto(account);
    }

    public AccountResponseDto updateAccount(UUID id, AccountCreateDto dto) {
        log.info("Hesap güncelleme talebi. Hesap ID: {}", id);

        try {
            Account account = getAccountEntityById(id);
            account.setAccountName(dto.getAccountName());
            account.setBalance(dto.getBalance());
            account.setCurrency(dto.getCurrency());

            unitOfWork.getAccounts().save(account);
            unitOfWork.commit();

            return convertToDto(account);
        } catch (Exception e) {
            log.error("Hesap güncellenirken hata: {}", e.getMessage());
            throw e;
        }
    }

    public void deleteAccount(UUID id) {
        log.info("Hesap silme talebi. Hesap ID: {}", id);
        try {
            Account account = getAccountEntityById(id);
            unitOfWork.getAccounts().delete(account);
            unitOfWork.commit();
            log.info("Hesap başarıyla silindi.");
        } catch (Exception e) {
            log.error("Hesap silinirken hata: {}", e.getMessage());
            throw e;
        }
    }

    private Account getAccountEntityById(UUID id) {
        return unitOfWork.getAccounts().findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hesap bulunamadı"));
    }

    private AccountResponseDto convertToDto(Account account) {
        return new AccountResponseDto(
                account.getId(),
                account.getAccountName(),
                account.getBalance(),
                account.getCurrency(),
                account.getUser() != null ? account.getUser().getId() : null,
                account.getAccountType(),
                account.getInterestRate(),
                account.getMaturityDate()
        );
    }
}