package com.financeportal.domains.economic_calendar.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.financeportal.model.enums.EventImpact;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Ekonomik takvim event'i — Finnhub'tan gelen JSON satırının kanonik formu.
 * <p>
 * Finnhub time alanını "2026-06-01 07:00:00" şeklinde döner (UTC). Frontend
 * tarayıcının yerel saatine kendi çevirir; backend olduğu gibi LocalDateTime tutar.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EconomicEventDto {

    /** Frontend cache key + de-dup için: country + event + time hash. */
    private String id;

    /** Finnhub `country` — ISO-2 (US, TR, EU, DE, ...). */
    private String country;

    /** Finnhub `event` — "Turkish CPI YoY", "Fed Interest Rate Decision" vb. */
    private String event;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime time;

    private EventImpact impact;

    /** Açıklanan değer. Açıklama henüz yapılmadıysa null. */
    private BigDecimal actual;

    /** Analist tahmini. Yoksa null. */
    private BigDecimal estimate;

    /** Bir önceki dönem değeri. Yoksa null. */
    private BigDecimal previous;

    /** %, $, K, M gibi birim. Yoksa boş string. */
    private String unit;
}
