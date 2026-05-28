package com.financeportal.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice // 🚀 REST için daha uygun
@Slf4j
public class GlobalExceptionHandler {

    // 1. Kaynak Bulunamadı (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    // 2. Bakiye Yetersiz veya Hatalı İstek (400)
    @ExceptionHandler({InsufficientBalanceException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleBadRequestExceptions(RuntimeException ex, HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // 3. 🛡️ GÜVENLİK İHLALİ (403) - Bizim IDOR korumamız buraya düşecek!
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponse> handleSecurityException(SecurityException ex, HttpServletRequest request) {
        log.error("🛑 GÜVENLİK İHLALİ DENEMESİ: {} - Path: {}", ex.getMessage(), request.getRequestURI());
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Bu işlem için yetkiniz bulunmamaktadır!", request);
    }

    // 4. Veritabanı Kısıtlamaları (409 Conflict)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        String message = "Veritabanı kısıtlaması ihlali: Bu kayıt zaten mevcut olabilir veya ilişkili bir veri engelliyor.";
        return buildErrorResponse(HttpStatus.CONFLICT, message, request);
    }

    // 5. Validasyon Hataları (400) - @Valid ile işaretli DTO'lar için
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> validationErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            validationErrors.put(fieldName, errorMessage);
        });

        ErrorResponse errorResponse = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                "Validation Failed",
                "Gönderilen verilerde doğrulama hatası var.",
                request.getRequestURI(),
                validationErrors
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Client tab kapattı / sayfayı değiştirdi / AbortController.abort() çağırdı diye
     * Tomcat response'u kapalı socket'e yazamadı. Bug değil — sadece gürültü.
     * DEBUG seviyesinde tek satır iz, stack trace yok. Body return etmenin anlamı yok,
     * karşı taraf zaten dinlemiyor; null dönülünce Spring sessizce kapatır.
     */
    @ExceptionHandler({AsyncRequestNotUsableException.class, ClientAbortException.class})
    public ResponseEntity<Void> handleClientAbort(Exception ex, HttpServletRequest request) {
        if (log.isDebugEnabled()) {
            log.debug("[CLIENT_ABORT] {} {} — {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
        }
        return null;
    }

    // 6. Beklenmedik Sistem Hataları (500) - Son Savunma Hattı
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, HttpServletRequest request) {
        log.error("💥 BEKLENMEDİK SİSTEM HATASI: ", ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Sunucu içinde beklenmeyen bir hata oluştu: " + ex.getMessage(), request);
    }

    // 🛠️ Yardımcı Metot: Tertemiz ErrorResponse objesi üretir
    private ResponseEntity<ErrorResponse> buildErrorResponse(HttpStatus status, String message, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI(),
                null
        );
        return new ResponseEntity<>(error, status);
    }
}