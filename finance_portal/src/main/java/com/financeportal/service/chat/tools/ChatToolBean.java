package com.financeportal.service.chat.tools;

/**
 * Sohbet asistanına açılan araçları taşıyan bean'leri işaretler.
 *
 * <p>Yöntemlerin kendisi Spring AI'nin {@code @Tool} anotasyonuyla tanımlanır; bu arayüzün
 * hiçbir üyesi yok. Tek işi toplanabilirlik: {@code List<Object>} enjekte etmek Spring'e
 * "bağlamdaki tüm bean'ler" demek olurdu, dolayısıyla araçların ortak bir tipe ihtiyacı var.
 *
 * <p>Yeni bir araç eklemek için: bir {@code @Component} yaz, bu arayüzü uygula ve
 * metodunu {@code @Tool} ile işaretle. Kayıt otomatik.
 */
public interface ChatToolBean {
}
