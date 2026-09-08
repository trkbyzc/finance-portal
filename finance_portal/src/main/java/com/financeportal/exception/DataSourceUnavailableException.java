package com.financeportal.exception;

import lombok.Getter;

/**
 * Bir dış veri sağlayıcısı bulunduğumuz ortamda sunulmadığında fırlatılır.
 *
 * <p>Bu bir <b>hata</b> değil, bilinçli bir politika sonucudur: kaynak ya lisans/şartlar
 * gereği canlıda kapalıdır ya da yalnızca giriş yapmış kullanıcılara açıktır. Bu yüzden
 * arayüzde kırmızı bir hata yerine açıklayıcı bir bilgi kartı gösterilir.
 *
 * @see com.financeportal.config.datasource.DataSourcePolicy
 */
@Getter
public class DataSourceUnavailableException extends RuntimeException {

    /** Neden sunulmadığı — arayüz buna göre farklı metin gösterir. */
    public enum Reason {
        /** Bu ortamda tamamen kapalı. */
        DISABLED,
        /** Açık, ancak giriş yapılması gerekiyor. */
        REQUIRES_AUTH
    }

    private final String source;
    private final Reason reason;
    private final String note;

    public DataSourceUnavailableException(String source, Reason reason, String note) {
        super("Veri kaynağı bu ortamda sunulmuyor: " + source + " (" + reason + ")");
        this.source = source;
        this.reason = reason;
        this.note = note;
    }
}
