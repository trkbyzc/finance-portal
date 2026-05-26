package com.financeportal.service.bootstrap;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Startup'ta external data fetch yapan tüm sync service'lerin completion durumunu izler.
 * Hepsi tamamlandığında konsola büyük banner basar — kullanıcı "veriler hazır mı?"
 * sorusuna net cevap görsün.
 * <p>
 * Kullanım (sync service'lerde):
 * <pre>
 *   {@code @PostConstruct} void registerBootstrap() { tracker.register("Currency"); }
 *   {@code @EventListener(ApplicationReadyEvent.class)}
 *   public void syncFoo() {
 *       try { ... } finally { tracker.markComplete("Currency"); }
 *   }
 * </pre>
 * Banner SADECE BİR KEZ basılır — hourly/scheduled re-run'larda no-op.
 * Hata olsa bile {@code finally} ile markComplete çağrılırsa banner yine basılır
 * (banner "veri başarıyla geldi" değil, "tüm task'lar denendi ve bitti" anlamında).
 */
@Component
@Slf4j
public class BootstrapReadinessTracker {

    private final Set<String> expected = ConcurrentHashMap.newKeySet();
    private final Set<String> completed = ConcurrentHashMap.newKeySet();
    private final AtomicBoolean bannerPrinted = new AtomicBoolean(false);
    private final long startTimeMs = System.currentTimeMillis();

    public void register(String name) {
        if (expected.add(name)) {
            log.info("[BOOTSTRAP] {} kaydedildi (toplam beklenen: {})", name, expected.size());
        }
    }

    public void markComplete(String name) {
        if (bannerPrinted.get()) return; // hourly re-run → no-op
        boolean firstTime = completed.add(name);
        if (firstTime) {
            log.info("[BOOTSTRAP] OK {} hazır ({}/{})", name, completed.size(), expected.size());
        }
        if (!expected.isEmpty()
                && completed.containsAll(expected)
                && bannerPrinted.compareAndSet(false, true)) {
            long elapsedSec = (System.currentTimeMillis() - startTimeMs) / 1000;
            log.info("");
            log.info("==================================================================");
            log.info("                                                                  ");
            log.info("    >>> TÜM VERİLER HAZIR — SİSTEME GİREBİLİRSİN! <<<              ");
            log.info("                                                                  ");
            log.info("    {} sync task tamamlandı, toplam {} saniye.                    ",
                    completed.size(), elapsedSec);
            log.info("                                                                  ");
            log.info("==================================================================");
            log.info("");
        }
    }
}
