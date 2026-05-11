package com.financeportal.controller;

import com.financeportal.model.dto.transaction.TransactionCreateDto;
import com.financeportal.model.dto.transaction.TransactionResponseDto;
import com.financeportal.model.dto.portfolio.TransferRequestDto;
import com.financeportal.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponseDto> createTransaction(@Valid @RequestBody TransactionCreateDto dto) {
        return ResponseEntity.ok(transactionService.createTransaction(dto));
    }

    @PostMapping("/transfer")
    public ResponseEntity<Map<String, String>> transferFunds(@Valid @RequestBody TransferRequestDto dto) {
        transactionService.transferFunds(dto);
        return ResponseEntity.ok(Map.of("message", "Transfer başarıyla gerçekleştirildi."));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<TransactionResponseDto>> getTransactionsByAccountId(
            @PathVariable UUID accountId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(transactionService.getTransactionsByAccountIdAndDateRange(accountId, startDate, endDate));
        }

        return ResponseEntity.ok(transactionService.getTransactionsByAccountId(accountId));
    }
}