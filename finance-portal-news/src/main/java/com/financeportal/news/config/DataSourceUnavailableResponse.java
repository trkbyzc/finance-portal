package com.financeportal.news.config;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Kapalı ya da giriş gerektiren bir veri kaynağı istendiğinde dönen gövde.
 *
 * <p>{@link ErrorResponse}'tan ayrı tutulur: burada arayüzün <b>karar vermek</b> için
 * ihtiyaç duyduğu makine-okur alanlar var ({@code code}, {@code source}, {@code reason}).
 * Arayüz bu gövdeyi görünce kırmızı hata yerine açıklayıcı bir bilgi kartı gösterir.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DataSourceUnavailableResponse {

    /** Arayüzün tanıması için sabit ayrım kodu. */
    public static final String CODE = "DATA_SOURCE_UNAVAILABLE";

    private LocalDateTime timestamp;
    private int status;

    /** Her zaman {@link #CODE} — arayüz bu değere bakarak bilgi kartına yönlenir. */
    private String code;

    /** Kaynak anahtarı (ör. {@code yahoo}, {@code fintables}). */
    private String source;

    /** {@code DISABLED} veya {@code REQUIRES_AUTH}. */
    private String reason;

    /** Kullanıcıya gösterilecek gerekçe; yapılandırmada not verilmemişse genel metin. */
    private String message;

    private String path;
}
