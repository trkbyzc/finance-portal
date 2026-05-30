package com.financeportal.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GlobalExceptionHandlerTest {

    @Mock
    private HttpServletRequest request;

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        when(request.getRequestURI()).thenReturn("/api/test-path");
    }

    @Test
    void resourceNotFound_returns404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Stock not found");
        ResponseEntity<ErrorResponse> response = handler.handleResourceNotFound(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getStatus());
        assertEquals("Stock not found", response.getBody().getMessage());
        assertEquals("/api/test-path", response.getBody().getPath());
    }

    @Test
    void insufficientBalance_returns400() {
        InsufficientBalanceException ex = new InsufficientBalanceException("Bakiye yetersiz");
        ResponseEntity<ErrorResponse> response = handler.handleBadRequestExceptions(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Bakiye yetersiz", response.getBody().getMessage());
    }

    @Test
    void illegalArgument_returns400_sharedHandler() {
        IllegalArgumentException ex = new IllegalArgumentException("Invalid input");
        ResponseEntity<ErrorResponse> response = handler.handleBadRequestExceptions(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Invalid input", response.getBody().getMessage());
    }

    @Test
    void securityException_returns403_withGenericMessage() {
        SecurityException ex = new SecurityException("User 123 tried accessing user 456 portfolio");
        ResponseEntity<ErrorResponse> response = handler.handleSecurityException(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        // Mesaj sızdırılmaz — generic Türkçe mesaj döner (info disclosure önleme)
        assertEquals("Bu işlem için yetkiniz bulunmamaktadır!", response.getBody().getMessage());
    }

    @Test
    void dataIntegrityViolation_returns409_conflict() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException("unique constraint violated");
        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrity(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(409, response.getBody().getStatus());
        assertTrue(response.getBody().getMessage().contains("Veritabanı"));
    }

    @Test
    void validationException_returns400_withFieldErrorsMap() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "myDto");
        bindingResult.addError(new FieldError("myDto", "email", "Email is required"));
        bindingResult.addError(new FieldError("myDto", "age", "Age must be > 0"));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);
        ResponseEntity<ErrorResponse> response = handler.handleValidationExceptions(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody().getValidationErrors());
        assertEquals(2, response.getBody().getValidationErrors().size());
        assertEquals("Email is required", response.getBody().getValidationErrors().get("email"));
        assertEquals("Age must be > 0", response.getBody().getValidationErrors().get("age"));
    }

    @Test
    void uncaughtException_returns500() {
        RuntimeException ex = new RuntimeException("DB connection lost");
        ResponseEntity<ErrorResponse> response = handler.handleGlobalException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(500, response.getBody().getStatus());
        assertTrue(response.getBody().getMessage().contains("DB connection lost"));
    }

    @Test
    void clientAbort_returnsNullSilently() {
        org.apache.catalina.connector.ClientAbortException ex =
                new org.apache.catalina.connector.ClientAbortException("Connection reset");
        ResponseEntity<Void> response = handler.handleClientAbort(ex, request);

        // Client kapattı, response göndermeye gerek yok
        assertNull(response);
    }
}
