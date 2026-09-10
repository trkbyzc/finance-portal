package com.financeportal.config;

import com.financeportal.exception.DataSourceUnavailableException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.util.ErrorHandler;

/**
 * Zamanlı işlerin hata davranışını ayarlar.
 *
 * <p><b>Çözdüğü sorun:</b> bazı senkron işleri (banka kurları, halka arz takvimi) canlıda
 * bilinçli olarak kapatılmış veri kaynaklarını çağırıyor. Spring'in varsayılan hata
 * işleyicisi her tetiklenmede tam yığın iziyle ERROR basıyordu — banka kurları 5 dakikada
 * bir, yani günde ~300 sahte hata. Bu gürültü, gerçek bir arıza çıktığında onu gizler.
 *
 * <p>Kapatılmış bir kaynak arıza değil, yapılandırma kararıdır: DEBUG'a indirilir.
 * Diğer tüm istisnalar eskisi gibi ERROR olarak, yığın iziyle loglanır.
 *
 * <p>İşlerin kendisine {@code try/catch} eklemek yerine burada tek noktadan çözüldü;
 * aksi halde aynı blok her senkron servisine kopyalanır ve ileride eklenen bir iş
 * bunu unuturdu.
 */
@Configuration
@Slf4j
public class SchedulingErrorConfig implements SchedulingConfigurer {

    @Override
    public void configureTasks(ScheduledTaskRegistrar registrar) {
        registrar.setScheduler(taskScheduler());
    }

    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        // Senkron işleri paralel çalışabilsin; tek thread'de biri yavaşlarsa diğerleri beklerdi.
        scheduler.setPoolSize(4);
        scheduler.setThreadNamePrefix("scheduling-");
        scheduler.setErrorHandler(dataSourceAwareErrorHandler());
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(20);
        return scheduler;
    }

    private ErrorHandler dataSourceAwareErrorHandler() {
        return throwable -> {
            DataSourceUnavailableException policy = findPolicyCause(throwable);
            if (policy != null) {
                log.debug("[ZAMANLI-IS] '{}' kaynağı bu ortamda kapalı, senkron atlandı.", policy.getSource());
                return;
            }
            log.error("Zamanlı iş sırasında beklenmeyen hata", throwable);
        };
    }

    /** İstisna sarmalanmış olabilir (proxy/AOP katmanları); zincirde politika istisnası ara. */
    private DataSourceUnavailableException findPolicyCause(Throwable t) {
        for (Throwable c = t; c != null; c = c.getCause()) {
            if (c instanceof DataSourceUnavailableException dse) return dse;
            if (c.getCause() == c) break; // kendine döngüsel neden — sonsuz döngüye girme
        }
        return null;
    }
}
