package com.financeportal.service.chat.tools;

import com.financeportal.service.chat.llm.LlmTool;

import java.util.Map;

/**
 * Chatbot'un çağırabildiği bir tool (read-only).
 * Her implementer Spring bean'i olarak otomatik kayıt olur; ChatToolRegistry hepsini toplar.
 *
 * execute(): SecurityContext mevcut request thread'inde set olduğu için
 * tool altında çağrılan servisler kullanıcının kimliğini otomatik görebilir.
 * Tool ekstra parameter olarak userId almaz — SecurityUtils üzerinden okur.
 */
public interface ChatTool {

    /** LLM'in çağıracağı isim (snake_case, ASCII). */
    String name();

    /** Tool'un ne yaptığını LLM'e anlatan kısa açıklama. */
    String description();

    /** Argümanların JSON Schema gösterimi (tip kontrolü için). */
    Map<String, Object> parametersJsonSchema();

    /**
     * Tool'u çalıştır.
     * @param args LLM'in verdiği argümanlar (parametersJsonSchema'ya uymalı; tip uymazsa tool kendi
     *             validation'ını yapar — InvalidArgumentException atabilir).
     * @return Serileştirilebilir bir nesne (Map / List / DTO) — JSON'a çevrilip LLM'e geri verilir.
     */
    Object execute(Map<String, Object> args);

    default LlmTool toLlmTool() {
        return LlmTool.builder()
                .name(name())
                .description(description())
                .parametersJsonSchema(parametersJsonSchema())
                .build();
    }
}
