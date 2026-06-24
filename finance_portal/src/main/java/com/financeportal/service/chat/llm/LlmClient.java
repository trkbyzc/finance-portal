package com.financeportal.service.chat.llm;

/**
 * Bir LLM provider'ı için ortak arayüz.
 * Implementer'lar: GroqClient, GeminiClient.
 */
public interface LlmClient {

    /** Provider adı — config'teki primary/fallback değerleriyle eşleşir ("groq", "gemini"). */
    String name();

    boolean isConfigured();

    /**
     * Bir LLM çağrısı yap.
     * @throws LlmException retriable=true ise gateway fallback'e geçer.
     */
    LlmResponse generate(LlmRequest request);
}
