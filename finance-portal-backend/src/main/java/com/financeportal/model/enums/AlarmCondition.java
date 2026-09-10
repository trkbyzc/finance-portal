package com.financeportal.model.enums;

public enum AlarmCondition {
    /** Fiyat threshold değerine ulaşır veya geçerse ({@code >= threshold}) tetiklenir. */
    ABOVE,
    /** Fiyat threshold değerine düşer veya altına inerse ({@code <= threshold}) tetiklenir. */
    BELOW
}
