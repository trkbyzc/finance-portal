package com.financeportal.controller;

import com.financeportal.model.dto.account.AccountCreateDto;
import com.financeportal.model.dto.account.AccountResponseDto;
import com.financeportal.model.dto.account.OpenDepositAccountDto;
import com.financeportal.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<AccountResponseDto> createAccount(@Valid @RequestBody AccountCreateDto dto) {
        return ResponseEntity.ok(accountService.createAccount(dto));
    }

    // --- YENİ EKLENEN VADELİ HESAP ENDPOINT'İ ---
    @PostMapping("/deposit")
    public ResponseEntity<AccountResponseDto> openDepositAccount(@Valid @RequestBody OpenDepositAccountDto dto) {
        return ResponseEntity.ok(accountService.openDepositAccount(dto));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AccountResponseDto>> getAccountsByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(accountService.getAccountsByUserId(userId));
    }

    @GetMapping("/user/{userId}/total-balance")
    public ResponseEntity<Map<String, BigDecimal>> getTotalBalanceByUserId(@PathVariable UUID userId) {
        BigDecimal totalBalance = accountService.getTotalBalanceByUserId(userId);
        return ResponseEntity.ok(Map.of("totalBalance", totalBalance));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponseDto> getAccountById(@PathVariable UUID id) {
        return ResponseEntity.ok(accountService.getAccountById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponseDto> updateAccount(@PathVariable UUID id, @Valid @RequestBody AccountCreateDto dto) {
        return ResponseEntity.ok(accountService.updateAccount(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable UUID id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}