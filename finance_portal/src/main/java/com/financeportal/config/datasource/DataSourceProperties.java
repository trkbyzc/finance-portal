package com.financeportal.config.datasource;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Dış veri sağlayıcılarının canlı ortamda sunulup sunulmayacağını belirleyen yapılandırma.
 *
 * <p>Sağlayıcıların hepsi eşdeğer değildir: bir kısmı resmî API yayınlar (TCMB EVDS, FRED,
 * Binance, Finnhub, CoinGecko), bir kısmı ise üçüncü taraf kullanımı için tasarlanmamış
 * uçlardan okunur ya da HTML kazınarak elde edilir. İkinci grubu <b>yerelde</b> kullanmak ile
 * anonim ziyaretçilere <b>sunmak</b> farklı şeylerdir; ikincisi yeniden dağıtım anlamına gelir
 * ve ilgili şartlar buna izin vermez.
 *
 * <p>Bu yüzden politika ortama göre değişir:
 * <ul>
 *   <li><b>dev / local</b> — hiçbir kısıt yok, tüm kaynaklar açık (varsayılan değerler).</li>
 *   <li><b>prod</b> — riskli kaynaklar {@code application-prod.yml} içinde kapatılır veya
 *       giriş arkasına alınır.</li>
 * </ul>
 *
 * <p>Yapılandırma örneği:
 * <pre>
 * data-sources:
 *   policies:
 *     yahoo:
 *       enabled: false
 *       note: "Resmî olmayan uç; şartları yeniden dağıtıma izin vermiyor."
 *     fintables:
 *       enabled: true
 *       requires-auth: true
 * </pre>
 *
 * Tanımlanmamış bir kaynak {@link DataSourcePolicy} tarafından <b>açık</b> kabul edilir —
 * yani yeni bir istemci eklendiğinde yerel geliştirme kendiliğinden çalışmaya devam eder,
 * kısıtlama bilinçli bir tercih olarak eklenir.
 */
@Component
@ConfigurationProperties(prefix = "data-sources")
public class DataSourceProperties {

    /** Kaynak anahtarı → politika. Anahtarlar {@link DataSourceKeys} sabitleriyle eşleşir. */
    private final Map<String, Policy> policies = new LinkedHashMap<>();

    public Map<String, Policy> getPolicies() {
        return policies;
    }

    @Getter
    @Setter
    public static class Policy {

        /** Kaynak tamamen kapalı mı? Kapalıysa istek hiç yapılmaz. */
        private boolean enabled = true;

        /** Açık ama yalnızca giriş yapmış kullanıcılara mı sunulacak? */
        private boolean requiresAuth = false;

        /**
         * Kullanıcıya gösterilecek kısa gerekçe. Boş bırakılırsa arayüz genel bir
         * metin gösterir; dolduruldu ise arayüz bunu olduğu gibi kullanır.
         */
        private String note;
    }
}
