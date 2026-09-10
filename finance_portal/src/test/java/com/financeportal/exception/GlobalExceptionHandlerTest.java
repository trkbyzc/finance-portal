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
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
    }

    /** İstisna mesajı yanıta sızmamalı; ayrıntı yalnızca log'da kalır. */
    @Test
    void uncaughtException_doesNotLeakExceptionMessage() {
        RuntimeException ex = new RuntimeException("ORA-00942: table or view does not exist");
        ResponseEntity<ErrorResponse> response = handler.handleGlobalException(ex, request);

        assertFalse(response.getBody().getMessage().contains("ORA-00942"));
    }

    /** Var olmayan adres 500 değil 404 dönmeli. */
    @Test
    void unknownPath_returns404() {
        NoResourceFoundException ex =
                new NoResourceFoundException(HttpMethod.GET, "/actuator/metrics");
        ResponseEntity<ErrorResponse> response = handler.handleNoResourceFound(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals(404, response.getBody().getStatus());
    }

    @Test
    void clientAbort_returnsNullSilently() {
        org.apache.catalina.connector.ClientAbortException ex =
                new org.apache.catalina.connector.ClientAbortException("Connection reset");
        ResponseEntity<Void> response = handler.handleClientAbort(ex, request);

        // Client kapattı, response göndermeye gerek yok
        assertNull(response);
    }

    /**
     * Canlıda admin olmayan kullanıcı /admin/users çağırınca 500 dönüyordu:
     * @PreAuthorize reddi genel Exception işleyicisine düşüyordu. Erişim yine
     * engelleniyordu ama arayüz sunucu hatası gösteriyordu.
     */
    @Test
    void accessDenied_returns403() {
        org.springframework.security.access.AccessDeniedException ex =
                new org.springframework.security.access.AccessDeniedException("Access Denied");
        ResponseEntity<ErrorResponse> response = handler.handleAccessDenied(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(403, response.getBody().getStatus());
    }

    /**
     * Spring Security 6.3'te @PreAuthorize reddi AuthorizationDeniedException fırlatır;
     * bu AccessDeniedException'ın alt sınıfıdır. Canlıda gelen tam tür buydu, işleyicinin
     * onu da kapsadığını doğrula.
     */
    @Test
    void authorizationDenied_isCoveredByAccessDeniedHandler() {
        org.springframework.security.access.AccessDeniedException ex =
                new org.springframework.security.authorization.AuthorizationDeniedException(
                        "Access Denied",
                        new org.springframework.security.authorization.AuthorizationDecision(false));
        ResponseEntity<ErrorResponse> response = handler.handleAccessDenied(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void missingRequiredParam_returns400() throws Exception {
        org.springframework.web.bind.MissingServletRequestParameterException ex =
                new org.springframework.web.bind.MissingServletRequestParameterException("symbol", "String");
        ResponseEntity<ErrorResponse> response = handler.handleClientRequestErrors(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertTrue(response.getBody().getMessage().contains("symbol"));
    }

    @Test
    void unparseableEnumParam_returns400() {
        org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex =
                new org.springframework.web.method.annotation.MethodArgumentTypeMismatchException(
                        "SACMA", String.class, "assetType", null, new IllegalArgumentException("bad enum"));
        ResponseEntity<ErrorResponse> response = handler.handleClientRequestErrors(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }
}
