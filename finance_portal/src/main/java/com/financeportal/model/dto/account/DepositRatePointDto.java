package com.financeportal.model.dto.account;

/**
 * Tek bir tarihsel mevduat faizi noktası (EVDS TP.TRY.MT04 — 1 yıla kadar TRY mevduat oranı).
 * date: ISO yyyy-MM-dd · rate: yıllık faiz oranı (%). Frontend Performans widget'ı bu seriyi
 * dönem boyunca bileşikleyerek "mevduata koysaydın" getirisini hesaplar.
 */
public record DepositRatePointDto(String date, Double rate) {
}
