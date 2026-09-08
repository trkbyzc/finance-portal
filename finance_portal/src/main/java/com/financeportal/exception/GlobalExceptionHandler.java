package com.financeportal.exception;

import com.financeportal.service.chat.llm.LlmException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

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

    /**
     * Veri kaynağı bu ortamda sunulmuyor — hata değil, politika sonucu.
     * Arayüz {@code code} alanına bakarak kırmızı hata yerine bilgi kartı gösterir.
     *
     * <p>Kapalı kaynak 503, giriş gerektiren kaynak 401 döner; ikisi de beklenen
     * durumlar olduğu için WARN değil DEBUG seviyesinde loglanır (bkz. DataSourcePolicy).
     */
    @ExceptionHandler(DataSourceUnavailableException.class)
    public ResponseEntity<DataSourceUnavailableResponse> handleDataSourceUnavailable(
            DataSourceUnavailableException ex, HttpServletRequest request) {

        boolean needsAuth = ex.getReason() == DataSourceUnavailableException.Reason.REQUIRES_AUTH;
        HttpStatus status = needsAuth ? HttpStatus.UNAUTHORIZED : HttpStatus.SERVICE_UNAVAILABLE;

        String message = ex.getNote() != null && !ex.getNote().isBlank()
                ? ex.getNote()
                : needsAuth
                    ? "Bu bölüm yalnızca giriş yapmış kullanıcılara açıktır."
                    : "Bu veri kaynağı, sağlayıcının kullanım şartları nedeniyle canlı demoda "
                      + "devre dışıdır. Projeyi yerelde çalıştırdığınızda tam işlevsel olarak gelir.";

        DataSourceUnavailableResponse body = new DataSourceUnavailableResponse(
                LocalDateTime.now(),
                status.value(),
                DataSourceUnavailableResponse.CODE,
                ex.getSource(),
                ex.getReason().name(),
                message,
                request.getRequestURI()
        );
        return new ResponseEntity<>(body, status);
    }

    /**
     * Metot düzeyi yetkilendirme reddi ({@code @PreAuthorize}).
     *
     * <p>Bu işleyici olmadan {@code AuthorizationDeniedException} aşağıdaki genel
     * {@code Exception} işleyicisine düşüyor ve yetkisiz istek <b>500</b> olarak
     * dönüyordu. Erişim yine engelleniyordu — güvenlik açığı değildi — ama arayüz
     * "yetkiniz yok" yerine "sunucu hatası" gösteriyordu ve canlıda admin paneline
     * giren normal kullanıcı bunu bir çökme sanıyordu.
     *
     * <p>Üstteki {@code SecurityException} işleyicisi {@code java.lang}'inkini
     * yakalar (IDOR kontrolleri onu fırlatır); bu ayrı bir sınıf hiyerarşisidir.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("YETKISIZ ERISIM DENEMESI: {} - Path: {}", ex.getMessage(), request.getRequestURI());
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Bu işlem için yetkiniz bulunmamaktadır!", request);
    }

    /**
     * İstemci kaynaklı istek hataları: eksik zorunlu parametre, tür uyuşmazlığı
     * (örneğin enum'a çevrilemeyen değer) ve okunamayan gövde.
     *
     * <p>Spring bunları normalde 400 olarak çevirir, ancak bu sınıf
     * {@code ResponseEntityExceptionHandler}'ı genişletmediği için hepsi genel
     * {@code Exception} işleyicisine düşüp <b>500</b> dönüyordu. Yani istemcinin
     * hatası sunucu hatası gibi raporlanıyor, izleme tarafında da gerçek arızalarla
     * karışıyordu.
     */
    @ExceptionHandler({
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class
    })
    public ResponseEntity<ErrorResponse> handleClientRequestErrors(Exception ex, HttpServletRequest request) {
        log.debug("Geçersiz istek ({}): {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "İstek geçersiz: " + ex.getMessage(), request);
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