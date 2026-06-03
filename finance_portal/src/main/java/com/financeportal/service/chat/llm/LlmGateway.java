package com.financeportal.service.chat.llm;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * LLM provider orchestrator: primary'ye gönderir, başarısız olursa fallback'e geçer.
 *
 * Failover koşulları:
 *   - LlmException.retriable == true  → fallback dene
 *   - LlmException.retriable == false → fallback denenmeden direkt fırlat
 *   - primary == fallback → fallback denenmez
 *
 * Konfigürasyon: app.llm.primary / app.llm.fallback (groq | gemini)
 */
@Service
@Slf4j
public class LlmGateway {

    private final Map<String, LlmClient> clientsByName = new HashMap<>();
    private final String primaryName;
    private final String fallbackName;

    public LlmGateway(List<LlmClient> clients,
                      @Value("${app.llm.primary:groq}") String primaryName,
                      @Value("${app.llm.fallback:gemini}") String fallbackName) {
        for (LlmClient c : clients) clientsByName.put(c.name(), c);
        this.primaryName = primaryName;
        this.fallbackName = fallbackName;
    }

    @PostConstruct
    void logSetup() {
        log.info("[LLM] primary={}, fallback={}, configured-clients={}",
                primaryName, fallbackName,
                clientsByName.values().stream()
                        .filter(LlmClient::isConfigured)
                        .map(LlmClient::name).toList());
    }

    /**
     * Bir LLM çağrısı yap. Primary patlar ve hata retriable ise fallback dener.
     * Her ikisi de patlarsa son hatayı fırlatır.
     */
    public LlmResponse generate(LlmRequest request) {
        LlmClient primary = clientsByName.get(primaryName);
        LlmClient fallback = clientsByName.get(fallbackName);

        if (primary == null) {
            throw new LlmException("Primary LLM provider bulunamadı: " + primaryName, false, 0);
        }

        try {
            if (primary.isConfigured()) {
                return primary.generate(request);
            }
            log.warn("[LLM] Primary '{}' konfigüre edilmemiş, fallback deneniyor", primaryName);
        } catch (LlmException e) {
            if (!e.isRetriable()) {
                log.warn("[LLM] Primary '{}' non-retriable hata, fallback'e geçilmiyor: {}",
                        primaryName, e.getMessage());
                throw e;
            }
            log.warn("[LLM] Primary '{}' patladı, fallback'e geçiliyor: {}", primaryName, e.getMessage());
        }

        if (fallback == null || fallback == primary || !fallback.isConfigured()) {
            throw new LlmException(
                    "LLM çağrısı başarısız oldu — primary patladı, kullanılabilir fallback yok.",
                    false, 0);
        }

        try {
            return fallback.generate(request);
        } catch (LlmException e) {
            log.error("[LLM] Fallback '{}' de patladı: {}", fallbackName, e.getMessage());
            throw e;
        }
    }
}
