package com.financeportal.service.chat.llm;

import com.financeportal.config.LlmConfig;
import com.financeportal.service.chat.tools.ChatToolBean;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Sohbet asistanının bean bağlantısını doğrular.
 *
 * <p><b>Neden gerekli:</b> bu projede hiç {@code @SpringBootTest} yok, yani bağlamın ayağa
 * kalkıp kalkmadığı hiçbir yerde ölçülmüyordu. Birim testleri bean'leri elle kurduğu için
 * yanlış bir {@code @Qualifier} ya da çözümlenemeyen bir bağımlılık ancak canlıda ortaya
 * çıkardı. Burada gerçek yapılandırma sınıfları küçük bir bağlamda çalıştırılıyor —
 * veritabanı, Redis veya ağ gerekmiyor.
 *
 * <p>Özellikle riskli iki nokta: iki {@code ChatClient} bean'inin nitelendiriciyle ayrışması
 * ve araçların {@code List<ChatToolBean>} olarak toplanması. İkincisi {@code List<Object>}
 * olsaydı Spring bağlamdaki TÜM bean'leri enjekte ederdi.
 */
class LlmProviderGatewayWiringTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(JacksonAutoConfiguration.class))
            .withUserConfiguration(LlmConfig.class, TestTools.class)
            .withBean(LlmProviderGateway.class)
            .withPropertyValues(
                    "app.llm.primary=gemini",
                    "app.llm.fallback=groq",
                    "app.llm.gemini.api-key=test-gemini-key",
                    "app.llm.groq.api-key=test-groq-key");

    @Test
    @DisplayName("Geçit ayağa kalkar ve her iki sağlayıcı da yapılandırılmış görünür")
    void gatewayStartsWithBothProviders() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(LlmProviderGateway.class);
            assertThat(context.getBean("geminiChatClient")).isNotNull();
            assertThat(context.getBean("groqChatClient")).isNotNull();
        });
    }

    @Test
    @DisplayName("Araçlar toplanır — sadece ChatToolBean'ler, tüm bean'ler değil")
    void onlyChatToolBeansAreCollected() {
        runner.run(context -> {
            LlmProviderGateway gateway = context.getBean(LlmProviderGateway.class);

            @SuppressWarnings("unchecked")
            List<ChatToolBean> tools =
                    (List<ChatToolBean>) ReflectionTestUtils.getField(gateway, "toolBeans");

            assertThat(tools).hasSize(1);
            assertThat(tools.get(0)).isInstanceOf(SampleTool.class);
        });
    }

    /**
     * API anahtarı olmayan ortamlarda (yerel geliştirme, CI) uygulama yine açılmalı;
     * sağlayıcı yalnızca çağrı anında atlanır.
     */
    @Test
    @DisplayName("Anahtarlar boşken de bağlam ayağa kalkar")
    void contextStartsWithoutApiKeys() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(JacksonAutoConfiguration.class))
                .withUserConfiguration(LlmConfig.class, TestTools.class)
                .withBean(LlmProviderGateway.class)
                .run(context -> assertThat(context).hasNotFailed());
    }

    /** Sağlayıcı adları yapılandırma değerleriyle eşleşmeli; sessizce sapmasınlar. */
    @Test
    @DisplayName("Sağlayıcı sabitleri yapılandırmadaki adlarla aynı")
    void providerNamesMatchConfiguration() {
        assertThat(LlmConfig.GEMINI).isEqualTo("gemini");
        assertThat(LlmConfig.GROQ).isEqualTo("groq");
    }

    @Configuration
    static class TestTools {
        @Bean
        SampleTool sampleTool() {
            return new SampleTool();
        }

        /** ChatToolBean OLMAYAN bir bean — araç listesine sızmadığını kanıtlar. */
        @Bean
        String unrelatedBean() {
            return "araç değil";
        }
    }

    static class SampleTool implements ChatToolBean {
        @Tool(name = "sample", description = "test aracı")
        public String sample() {
            return "ok";
        }
    }
}
