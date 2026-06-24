package com.financeportal.exception;

import com.financeportal.service.chat.llm.LlmException;
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

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler({InsufficientBalanceException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleBadRequestExceptions(RuntimeException ex, HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // IDOR ve kaynak sahipliği ihlallerini yakalamak için SecurityException fırlatılır.
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponse> handleSecurityException(SecurityException ex, HttpServletRequest request) {
        log.error("GÜVENLİK İHLALİ DENEMESİ: {} - Path: {}", ex.getMessage(), request.getRequestURI());
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Bu işlem için yetkiniz bulunmamaktadır!", request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        String message = "Veritabanı kısıtlaması ihlali: Bu kayıt zaten mevcut olabilir veya ilişkili bir veri engelliyor.";
        return buildErrorResponse(HttpStatus.CONFLICT, message, request);
    }

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

    /**
     * Chatbot LLM provider'larına erişilemediğinde (rate limit, 5xx, timeout, key yok).
     * 503 + kullanıcı dostu mesaj — frontend "şu an asistana ulaşılamıyor" gösterir,
     * generic 500 mesajını yer.
     */
    @ExceptionHandler(LlmException.class)
    public ResponseEntity<ErrorResponse> handleLlm(LlmException ex, HttpServletRequest request) {
        log.warn("[LLM] çağrı başarısız: status={}, retriable={}, msg={}",
                ex.getStatusCode(), ex.isRetriable(), ex.getMessage());
        String msg = "Asistana şu an ulaşılamıyor. Lütfen birazdan tekrar dene.";
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, msg, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, HttpServletRequest request) {
        log.error("BEKLENMEDİK SİSTEM HATASI: ", ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Sunucu içinde beklenmeyen bir hata oluştu: " + ex.getMessage(), request);
    }

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