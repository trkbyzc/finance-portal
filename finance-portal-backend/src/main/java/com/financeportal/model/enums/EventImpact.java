package com.financeportal.model.enums;

/**
 * Ekonomik takvim event önem seviyesi.
 * Finnhub case-insensitive ("low", "medium", "high") gönderir; client parse'da normalize eder.
 */
public enum EventImpact {
    LOW,
    MEDIUM,
    HIGH
}
