package com.financeportal.config;

import com.financeportal.exception.DataSourceUnavailableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.ErrorHandler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class SchedulingErrorConfigTest {

    private final SchedulingErrorConfig config = new SchedulingErrorConfig();

    private ErrorHandler handler() {
        ThreadPoolTaskScheduler scheduler = config.taskScheduler();
        return (ErrorHandler) ReflectionTestUtils.getField(scheduler, "errorHandler");
    }

    @Test
    @DisplayName("Zamanlayıcı özel hata işleyiciyle kurulur")
    void schedulerIsConfiguredWithHandler() {
        ThreadPoolTaskScheduler scheduler = config.taskScheduler();

        assertThat(scheduler.getPoolSize()).isNotNegative();
        assertThat(ReflectionTestUtils.getField(scheduler, "errorHandler")).isNotNull();
    }

    /**
     * Kapatılmış kaynak arıza değil. Bu işleyici olmadan banka kuru senkronu
     * 5 dakikada bir tam yığın iziyle ERROR basıyordu (günde ~300 sahte hata).
     */
    @Test
    @DisplayName("Kapalı veri kaynağı istisnası sessizce yutulur")
    void swallowsDisabledDataSourceException() {
        DataSourceUnavailableException ex = new DataSourceUnavailableException(
                "hesapkurdu", DataSourceUnavailableException.Reason.DISABLED, "canlı demoda kapalı");

        assertThatCode(() -> handler().handleError(ex)).doesNotThrowAnyException();
    }

    /** AOP/proxy katmanları istisnayı sarmalayabilir; zincirin içinde de tanınmalı. */
    @Test
    @DisplayName("Sarmalanmış politika istisnası da tanınır")
    void recognisesWrappedPolicyException() {
        DataSourceUnavailableException cause = new DataSourceUnavailableException(
                "ipo-scraper", DataSourceUnavailableException.Reason.DISABLED, null);
        RuntimeException wrapped = new RuntimeException("proxy sarmalamasi", cause);

        assertThatCode(() -> handler().handleError(wrapped)).doesNotThrowAnyException();
    }

    /** Gerçek arızalar sessizleştirilmemeli — yalnızca politika istisnası muaf. */
    @Test
    @DisplayName("Gerçek hatalar işleyiciyi geçer ve loglanır")
    void realFailuresAreStillHandled() {
        assertThatCode(() -> handler().handleError(new IllegalStateException("veritabani dustu")))
                .doesNotThrowAnyException();
    }

    /** Kendine referans veren neden zinciri sonsuz döngüye girmemeli. */
    @Test
    @DisplayName("Döngüsel neden zinciri sonsuz döngüye girmez")
    void selfReferencingCauseTerminates() {
        RuntimeException loop = new RuntimeException("dongusel") {
            @Override
            public synchronized Throwable getCause() {
                return this;
            }
        };

        assertThatCode(() -> handler().handleError(loop)).doesNotThrowAnyException();
    }
}
