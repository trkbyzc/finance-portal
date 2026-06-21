package com.financeportal.domains.economic_calendar.client;

import com.financeportal.domains.economic_calendar.dto.EconomicEventDto;

import java.time.LocalDate;
import java.util.List;

/**
 * Ekonomik takvim veri kaynağı soyutlaması — dış sağlayıcıdan [from, to] penceresindeki
 * olayları {@link EconomicEventDto} listesi olarak çeker.
 *
 * <p>Birden çok implementasyon olabilir (TradingView birincil = {@code @Primary}; Finnhub atıl
 * alternatif). Sync servisi bu arayüze bağlıdır → kaynak değiştirmek tek bir {@code @Primary}
 * işaretiyle yapılır; DTO/cache/read-path/controller/frontend değişmez.
 */
public interface EconomicCalendarClient {
    List<EconomicEventDto> fetchCalendar(LocalDate from, LocalDate to);
}
