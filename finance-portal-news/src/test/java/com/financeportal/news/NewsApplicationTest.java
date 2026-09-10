package com.financeportal.news;

import com.financeportal.news.config.DataSourcePolicy;
import com.financeportal.news.controller.NewsController;
import com.financeportal.news.service.NewsService;
import com.financeportal.news.service.NewsSyncService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Uygulama bağlamı gerçekten ayağa kalkıyor mu?
 *
 * <p><b>Neden bu test var:</b> daha önce backend'de tam olarak bu boşluk yüzünden
 * canlı beş dakika düştü. Birim testlerin hepsi geçiyordu, kod derleniyordu, ama
 * uygulama açılışta bir yapılandırma eksiği yüzünden çöküp duruyordu. Birim testleri
 * sınıfları tek tek kurar; hiçbiri "Spring bu parçaları birbirine bağlayabiliyor mu"
 * sorusunu sormaz.
 *
 * <p>Redis'e CANLI BAĞLANTI GEREKMEZ: Spring Data Redis bağlantıyı ilk kullanımda
 * kurar, açılışta değil. Yani bu test Redis olmadan da anlamlıdır ve CI'da çalışır.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.data.redis.host=localhost",
        "spring.data.redis.port=6379",
        // Zamanlanmış toplama testte tetiklenmesin: dışarıya RSS isteği atardı.
        "app.sync.news-rate-ms=86400000"
})
class NewsApplicationTest {

    @Autowired private NewsController newsController;
    @Autowired private NewsService newsService;
    @Autowired private NewsSyncService newsSyncService;
    @Autowired private DataSourcePolicy dataSourcePolicy;
    @Autowired private RedisTemplate<String, Object> redisTemplate;
    @Autowired private StringRedisTemplate stringRedisTemplate;

    @Test
    void baglamAyagaKalkarVeTumParcalarBaglanir() {
        assertNotNull(newsController);
        assertNotNull(newsService);
        assertNotNull(newsSyncService);
        assertNotNull(dataSourcePolicy);
        assertNotNull(redisTemplate, "RedisConfig'teki şablon bağlanmalı");
        assertNotNull(stringRedisTemplate, "Spring'in kendi StringRedisTemplate'i de gerekli");
    }

    /** Yerel (varsayılan) profilde hiçbir kaynak kapalı olmamalı. */
    @Test
    void yereldeKaynaklarAcik() {
        org.junit.jupiter.api.Assertions.assertTrue(
                dataSourcePolicy.isEnabled("news-content"),
                "Yerelde makale metni açık olmalı — kısıtlamalar yalnızca canlıda");
    }
}
