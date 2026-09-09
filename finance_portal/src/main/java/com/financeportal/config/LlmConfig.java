package com.financeportal.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Sohbet asistanının LLM sağlayıcıları.
 *
 * <p><b>Tek starter, iki sağlayıcı.</b> Groq zaten OpenAI uyumlu bir uç sunuyor; Gemini de
 * kendi OpenAI uyumlu ucunu yayınlıyor. Bu yüzden her ikisi de {@code spring-ai-openai}
 * ile sürülebiliyor — tek fark base URL, anahtar ve model adı. Alternatif, Gemini için
 * ayrı bir Spring AI starter'ı kullanmaktı; o da Spring Boot 3.5 gerektiren 1.1.x hattına
 * geçmeyi zorunlu kılıyordu (bu proje 3.3.9'da).
 *
 * <p><b>Neden otomatik yapılandırma değil:</b> starter tek bir {@code ChatModel} üretir.
 * Bize birincil + yedek olmak üzere iki tane lazım, o yüzden ikisini de elle kuruyoruz.
 * Yapılandırma anahtarları eskisiyle aynı ({@code app.llm.*}) — ortam değişkenleri değişmedi.
 */
@Configuration
@Slf4j
public class LlmConfig {

    /** Bu sağlayıcı adı {@code app.llm.primary} / {@code fallback} değerleriyle eşleşir. */
    public static final String GEMINI = "gemini";
    public static final String GROQ = "groq";

    @Bean(name = "geminiChatClient")
    public ChatClient geminiChatClient(
            @Value("${app.llm.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
            @Value("${app.llm.gemini.api-key:}") String apiKey,
            @Value("${app.llm.gemini.model:gemini-2.5-flash}") String model) {

        // Yapılandırmadaki base-url Gemini'nin NATIF ucunu gösteriyor (eski istemci onu
        // kullanıyordu). OpenAI uyumlu katman aynı sunucuda "/openai" altında duruyor.
        String openAiCompatibleUrl = baseUrl.endsWith("/openai") ? baseUrl : baseUrl + "/openai";
        return buildClient(GEMINI, openAiCompatibleUrl, apiKey, model);
    }

    @Bean(name = "groqChatClient")
    public ChatClient groqChatClient(
            @Value("${app.llm.groq.base-url:https://api.groq.com/openai/v1}") String baseUrl,
            @Value("${app.llm.groq.api-key:}") String apiKey,
            @Value("${app.llm.groq.model:llama-3.3-70b-versatile}") String model) {

        return buildClient(GROQ, baseUrl, apiKey, model);
    }

    /**
     * Anahtar boş olsa bile bean kurulur; sağlayıcı seçimini {@code LlmProviderGateway}
     * yapıyor ve orada anahtarsız sağlayıcı atlanıyor. Burada patlarsak anahtarsız bir
     * ortamda (yerel geliştirme, CI) uygulama hiç açılmazdı.
     */
    private ChatClient buildClient(String provider, String baseUrl, String apiKey, String model) {
        if (apiKey == null || apiKey.isBlank()) {
            log.info("[LLM] '{}' için API anahtarı yok — sağlayıcı devre dışı.", provider);
        }

        OpenAiApi api = OpenAiApi.builder()
                .baseUrl(baseUrl)
                .apiKey(apiKey == null ? "" : apiKey)
                .build();

        OpenAiChatModel chatModel = OpenAiChatModel.builder()
                .openAiApi(api)
                .defaultOptions(OpenAiChatOptions.builder()
                        .model(model)
                        .temperature(0.5)
                        .maxTokens(1024)
                        .build())
                .build();

        log.info("[LLM] '{}' hazır — model={}, uç={}", provider, model, baseUrl);
        return ChatClient.builder(chatModel).build();
    }
}
