package com.financeportal.model.enums;

/**
 * Kullanıcının market ticker bar'ını hangi sayfalarda görmek istediğini belirler.
 */
public enum TickerScope {
    /** Ticker her sayfada üstte sticky olarak görünür (auth user'ın global tercih). */
    ALL_PAGES,
    /** Ticker sadece ana sayfada (Dashboard) görünür. */
    HOME_ONLY
}
