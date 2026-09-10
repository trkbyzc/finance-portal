package com.financeportal.news;

import com.financeportal.news.config.DataSourcePolicy;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * CANLI profil gerçekten ayağa kalkıyor mu ve kısıtlamalar doğru mu?
 *
 * <p>Yerel profilin açılması canlının da açılacağı anlamına GELMEZ: prod dosyası
 * ayrı ayarlar getirir ve tek bir eksik değer uygulamayı açılışta düşürür.
 * Bu ayrım daha önce backend'de canlıyı beş dakika kapattı.
 */
@SpringBootTest
@ActiveProfiles("prod")
@TestPropertySource(properties = "app.sync.news-rate-ms=86400000")
class NewsApplicationProdTest {

    @Autowired private DataSourcePolicy dataSourcePolicy;

    @Value("${app.news.allow-manual-sync}")
    private boolean allowManualSync;

    @Test
    void canliProfilAyagaKalkar() {
        // Buraya gelinebiliyorsa bağlam yüklenmiştir.
        assertTrue(true);
    }

    @Test
    void canlidaBasliklarAcikMakaleMetniKapali() {
        assertTrue(dataSourcePolicy.isEnabled("news-rss"),
                "RSS başlıkları canlıda açık kalmalı — haber listesi buna bağlı");
        assertFalse(dataSourcePolicy.isEnabled("news-content"),
                "Makalenin tam metni canlıda kapalı olmalı (telifli içerik)");
    }

    @Test
    void canlidaElleSenkronKapali() {
        assertFalse(allowManualSync,
                "POST /news/sync canlıda dışarıya kapalı olmalı");
    }
}
