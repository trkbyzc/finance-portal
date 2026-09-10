package com.financeportal.news.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Bir veri kaynağının o anki istek bağlamında sunulup sunulamayacağına karar verir.
 *
 * <p>Servisler dış çağrıyı yapmadan <b>önce</b> {@link #check(String)} çağırır; kaynak
 * kapalıysa istek hiç yapılmaz ve {@link DataSourceUnavailableException} fırlar. Böylece
 * hem gereksiz dış trafik oluşmaz hem de kullanıcıya net bir gerekçe döner.
 *
 * <p>Tanımsız kaynaklar açık kabul edilir — yeni bir istemci eklendiğinde yerel geliştirme
 * kendiliğinden çalışır; kısıtlama yapılandırmaya bilinçli olarak eklenir.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSourcePolicy {

    private final DataSourceProperties properties;

    /** Kaynak bu ortamda tamamen kapalı mı? */
    public boolean isEnabled(String source) {
        return policyOf(source).isEnabled();
    }

    /** Kaynak giriş yapmış kullanıcı gerektiriyor mu? */
    public boolean requiresAuth(String source) {
        return policyOf(source).isRequiresAuth();
    }

    /**
     * Kaynak şu anki kullanıcı için erişilebilir mi? İstisna fırlatmaz — koşullu davranmak
     * (ör. listeyi kaynak kapalıyken kısaltmak) isteyen çağıranlar için.
     */
    public boolean isAvailable(String source) {
        DataSourceProperties.Policy policy = policyOf(source);
        if (!policy.isEnabled()) {
            return false;
        }
        return !policy.isRequiresAuth() || isAuthenticated();
    }

    /**
     * Kaynak kapalı ve yerine sentetik demo verisi sunulacak mı?
     *
     * <p>İstemciler {@link #check(String)} çağırmadan <b>önce</b> bunu sorar: doğruysa
     * dış çağrı yapılmaz, istisna da fırlatılmaz; üretilmiş veri döndürülür.
     */
    public boolean useDemoData(String source) {
        DataSourceProperties.Policy policy = policyOf(source);
        return !policy.isEnabled() && policy.isDemoData();
    }

    /**
     * Kaynak erişilebilir değilse {@link DataSourceUnavailableException} fırlatır.
     * Dış çağrıdan hemen önce çağrılmalıdır.
     */
    public void check(String source) {
        DataSourceProperties.Policy policy = policyOf(source);

        if (!policy.isEnabled()) {
            log.debug("[DATA-SOURCE] '{}' bu ortamda kapalı, istek yapılmadı.", source);
            throw new DataSourceUnavailableException(
                    source, DataSourceUnavailableException.Reason.DISABLED, policy.getNote());
        }

        if (policy.isRequiresAuth() && !isAuthenticated()) {
            log.debug("[DATA-SOURCE] '{}' giriş gerektiriyor, anonim istek reddedildi.", source);
            throw new DataSourceUnavailableException(
                    source, DataSourceUnavailableException.Reason.REQUIRES_AUTH, policy.getNote());
        }
    }

    private DataSourceProperties.Policy policyOf(String source) {
        return properties.getPolicies()
                .getOrDefault(source, DEFAULT_OPEN);
    }

    private boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null
                && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal());
    }

    /** Yapılandırmada tanımlanmamış kaynaklar için varsayılan: açık, giriş gerekmez. */
    private static final DataSourceProperties.Policy DEFAULT_OPEN = new DataSourceProperties.Policy();
}
