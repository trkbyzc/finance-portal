package com.financeportal.model.enums;

/**
 * Fiyat alarmı sıklığı.
 * - ONCE: tek seferlik — tetiklendikten sonra active=false yapılır.
 * - CONTINUOUS: sürekli — koşul karşılandığında bildirim atılır ama alarm aktif kalır;
 *   tekrar bildirim atmamak için cooldown uygulanır.
 */
public enum AlarmFrequency {
    ONCE,
    CONTINUOUS
}
