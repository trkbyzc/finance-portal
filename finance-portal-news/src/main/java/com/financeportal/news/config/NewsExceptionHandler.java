package com.financeportal.news.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;

/**
 * Bu servisin hata yanitlari.
 *
 * <p>Bicim backend'inkiyle AYNI olmak zorunda: arayuz her iki servisten de ayni
 * govdeyi bekliyor. Ozellikle {@code DATA_SOURCE_UNAVAILABLE} kodlu 503 —
 * {@code utils/dataSourceError.js} bu koda bakip kirmizi hata yerine aciklayici
 * bir bilgi karti gosteriyor. Kod degisirse arayuz haberi "coktu" sanir.
 */
@RestControllerAdvice
@Slf4j
public class NewsExceptionHandler {

    @ExceptionHandler(DataSourceUnavailableException.class)
    public ResponseEntity<DataSourceUnavailableResponse> handleUnavailable(
            DataSourceUnavailableException ex, HttpServletRequest request) {

        boolean needsAuth = ex.getReason() == DataSourceUnavailableException.Reason.REQUIRES_AUTH;
        HttpStatus status = needsAuth ? HttpStatus.UNAUTHORIZED : HttpStatus.SERVICE_UNAVAILABLE;

        String message = ex.getNote() != null && !ex.getNote().isBlank()
                ? ex.getNote()
                : "Bu veri kaynağı canlı demoda devre dışıdır.";

        return new ResponseEntity<>(new DataSourceUnavailableResponse(
                LocalDateTime.now(), status.value(), DataSourceUnavailableResponse.CODE,
                ex.getSource(), ex.getReason().name(), message, request.getRequestURI()
        ), status);
    }

    /** Var olmayan adres: 404, yigin izi olmadan. Backend'de de ayni davranis var. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<String> handleNotFound(NoResourceFoundException ex, HttpServletRequest request) {
        log.debug("Bilinmeyen adres: {}", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("{\"status\":404,\"error\":\"Not Found\",\"message\":\"İstenen kaynak bulunamadı.\"}");
    }

    /**
     * İstisna mesaji BILEREK yanita konulmuyor; ayrinti log'da kalir.
     * Disariya sizmasi sinif adi, adres ya da dosya yolu ele verebilir.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleUnexpected(Exception ex) {
        log.error("BEKLENMEDİK HATA: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"status\":500,\"error\":\"Internal Server Error\","
                        + "\"message\":\"Sunucu içinde beklenmeyen bir hata oluştu.\"}");
    }
}
