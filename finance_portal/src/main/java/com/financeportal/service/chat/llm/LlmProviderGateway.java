package com.financeportal.service.chat.llm;

import com.financeportal.config.LlmConfig;
import com.financeportal.service.chat.tools.ChatToolBean;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Birincil sağlayıcı ile yedeği arasında geçiş yapar.
 *
 * <p>Araç çağrılarının kendisi artık burada değil: Spring AI, model bir araç istediğinde
 * onu çalıştırıp sonucu modele geri veriyor ve nihai metin gelene kadar döngüyü kendisi
 * çeviriyor. Önceden bu döngü {@code ChatService} içinde elle yazılıydı.
 *
 * <p>Yedekleme mantığı korundu: birincil sağlayıcı patlarsa (kota, kesinti) ikincisi
 * denenir. Anahtarı olmayan sağlayıcı hiç denenmez — yerel geliştirmede ve CI'da
 * anahtarlar boş olabiliyor.
 */
@Component
@Slf4j
public class LlmProviderGateway {

    /** Bir çağrının sonucu; hangi sağlayıcı/modelin yanıtladığı arayüze ve kayda geçer. */
    public record LlmResult(String content, String provider, String model) {}

    private record Provider(String name, ChatClient client, String model, boolean configured) {}

    private final Map<String, Provider> providers = new LinkedHashMap<>();
    private final List<ChatToolBean> toolBeans;
    private final String primaryName;
    private final String fallbackName;

    public LlmProviderGateway(
            @Qualifier("geminiChatClient") ChatClient geminiClient,
            @Qualifier("groqChatClient") ChatClient groqClient,
            List<ChatToolBean> toolBeans,
            @Value("${app.llm.primary:gemini}") String primaryName,
            @Value("${app.llm.fallback:groq}") String fallbackName,
            @Value("${app.llm.gemini.api-key:}") String geminiKey,
            @Value("${app.llm.gemini.model:gemini-2.5-flash}") String geminiModel,
            @Value("${app.llm.groq.api-key:}") String groqKey,
            @Value("${app.llm.groq.model:llama-3.3-70b-versatile}") String groqModel) {

        providers.put(LlmConfig.GEMINI,
                new Provider(LlmConfig.GEMINI, geminiClient, geminiModel, isSet(geminiKey)));
        providers.put(LlmConfig.GROQ,
                new Provider(LlmConfig.GROQ, groqClient, groqModel, isSet(groqKey)));

        this.toolBeans = toolBeans;
        this.primaryName = primaryName;
        this.fallbackName = fallbackName;

        log.info("[LLM] birincil={}, yedek={}, yapılandırılmış={}, araç sayısı={}",
                primaryName, fallbackName,
                providers.values().stream().filter(Provider::configured).map(Provider::name).toList(),
                toolBeans.size());
    }

    private static boolean isSet(String key) {
        return key != null && !key.isBlank();
    }

    /**
     * Sohbeti modele gönderir ve nihai metni döner.
     *
     * @throws LlmException hiçbir sağlayıcı yanıt veremezse
     */
    public LlmResult generate(List<Message> messages) {
        List<String> order = new ArrayList<>();
        order.add(primaryName);
        if (!fallbackName.equals(primaryName)) order.add(fallbackName);

        RuntimeException lastFailure = null;

        for (String name : order) {
            Provider p = providers.get(name);
            if (p == null) {
                log.warn("[LLM] Tanımsız sağlayıcı adı: {}", name);
                continue;
            }
            if (!p.configured()) {
                log.warn("[LLM] '{}' için API anahtarı yok, atlanıyor.", name);
                continue;
            }

            try {
                String content = p.client().prompt()
                        .messages(messages)
                        .tools(toolBeans.toArray())
                        .call()
                        .content();

                return new LlmResult(content == null ? "" : content, p.name(), p.model());
            } catch (RuntimeException e) {
                lastFailure = e;
                log.warn("[LLM] '{}' başarısız oldu: {}", name, e.getMessage());
            }
        }

        throw new LlmException(
                "Sohbet asistanı şu anda yanıt veremiyor"
                        + (lastFailure != null ? ": " + lastFailure.getMessage() : "."),
                true, 0);
    }
}
